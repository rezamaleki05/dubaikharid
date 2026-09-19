import {
  validateAttributeOptionPayload,
  validateCatalogAttributePayload,
  validateCategoryAttributeConfiguration,
  validateCategoryAttributePayload,
} from './catalogAttributeDomain.js';
import {
  buildStandardCatalogPresetPlan,
  normalizeCatalogPresetLookup,
  summarizeStandardCatalogPresetPlan,
} from './standardCatalogPresets.js';

const SERIALIZABLE_RETRY_LIMIT = 3;

function validationError(message) {
  const error = new Error(message);
  error.name = 'StandardCatalogPresetValidationError';
  return error;
}

async function readPresetState(client) {
  const [categories, attributes, assignments] = await Promise.all([
    client.category.findMany({ orderBy: { id: 'asc' } }),
    client.catalogAttribute.findMany({
      include: { options: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
      orderBy: { code: 'asc' },
    }),
    client.categoryAttribute.findMany({ orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }] }),
  ]);
  return { categories, attributes, assignments };
}

function validatedAttributeData(preset) {
  const result = validateCatalogAttributePayload({
    code: preset.code,
    nameFa: preset.nameFa,
    nameEn: preset.nameEn,
    inputType: preset.inputType,
    unitFa: preset.unitFa ?? null,
    unitEn: preset.unitEn ?? null,
    isActive: true,
    sortOrder: preset.sortOrder,
  });
  if (result.error) throw validationError(`Invalid standard attribute ${preset.code}: ${result.error}`);
  return result.data;
}

function validatedOptionData(preset, inputType) {
  const result = validateAttributeOptionPayload({
    code: preset.code,
    labelFa: preset.labelFa,
    labelEn: preset.labelEn,
    swatchHex: preset.swatchHex ?? null,
    isActive: true,
    sortOrder: preset.sortOrder,
  });
  if (result.error) throw validationError(`Invalid standard option ${preset.code}: ${result.error}`);
  if (result.data.swatchHex && inputType !== 'COLOR') {
    throw validationError(`Standard option ${preset.code} has a swatch but its attribute is not COLOR.`);
  }
  return result.data;
}

function validatedAssignmentData(preset, attribute) {
  const result = validateCategoryAttributePayload({
    attributeId: attribute.id,
    isRequired: preset.isRequired,
    isVariantDefining: preset.isVariantDefining,
    allowsMultiple: preset.allowsMultiple,
    sortOrder: preset.sortOrder,
  });
  if (result.error) throw validationError(`Invalid standard assignment ${preset.attributeCode}: ${result.error}`);
  const configuration = validateCategoryAttributeConfiguration(attribute.inputType, result.data);
  if (configuration.error) {
    throw validationError(`Invalid standard assignment ${preset.attributeCode}: ${configuration.error}`);
  }
  return result.data;
}

function countCreates(plan) {
  return Object.values(plan.create).reduce((total, rows) => total + rows.length, 0);
}

async function applyPresetTransaction(tx) {
  const created = { attributes: 0, options: 0, categories: 0, assignments: 0 };
  const initialState = await readPresetState(tx);
  const initialPlan = buildStandardCatalogPresetPlan(initialState);

  if (initialPlan.create.categories.length) {
    const result = await tx.category.createMany({
      data: initialPlan.create.categories.map(preset => ({
        id: preset.id,
        name: preset.nameFa,
        query: preset.query,
        icon: null,
        countText: null,
      })),
    });
    created.categories = result.count;
  }

  if (initialPlan.create.attributes.length) {
    const result = await tx.catalogAttribute.createMany({
      data: initialPlan.create.attributes.map(validatedAttributeData),
    });
    created.attributes = result.count;
  }

  const materializedState = await readPresetState(tx);
  const materializedPlan = buildStandardCatalogPresetPlan(materializedState);

  if (materializedPlan.create.options.length) {
    const optionRows = materializedPlan.create.options.map(preset => {
      const attribute = materializedPlan.attributeRefs.get(preset.attributeCode)?.existing;
      if (!attribute) throw validationError(`Missing materialized attribute ${preset.attributeCode}.`);
      return {
        ...validatedOptionData(preset, attribute.inputType),
        attributeId: attribute.id,
      };
    });
    const result = await tx.attributeOption.createMany({ data: optionRows });
    created.options = result.count;
  }

  if (materializedPlan.create.assignments.length) {
    const assignmentRows = materializedPlan.create.assignments.map(preset => {
      const category = materializedPlan.categoryRefs.get(preset.categoryKey)?.existing;
      const attribute = materializedPlan.attributeRefs.get(preset.attributeCode)?.existing;
      if (!category || !attribute) {
        throw validationError(`Missing materialized preset references for ${preset.categoryKey}:${preset.attributeCode}.`);
      }
      return {
        ...validatedAssignmentData(preset, attribute),
        categoryId: category.id,
      };
    });
    const result = await tx.categoryAttribute.createMany({ data: assignmentRows });
    created.assignments = result.count;
  }

  const finalState = await readPresetState(tx);
  const finalPlan = buildStandardCatalogPresetPlan(finalState);
  if (countCreates(finalPlan) !== 0) {
    throw validationError('Standard catalog preset did not converge to an idempotent state.');
  }
  return {
    created,
    preflight: summarizeStandardCatalogPresetPlan(initialPlan),
    final: summarizeStandardCatalogPresetPlan(finalPlan),
  };
}

async function runSerializableWithRetry(client, operation) {
  let lastError;
  for (let attempt = 1; attempt <= SERIALIZABLE_RETRY_LIMIT; attempt += 1) {
    try {
      return await client.$transaction(operation, { isolationLevel: 'Serializable', timeout: 60_000 });
    } catch (error) {
      lastError = error;
      if (error?.code !== 'P2034' || attempt === SERIALIZABLE_RETRY_LIMIT) throw error;
    }
  }
  throw lastError;
}

export function databaseEndpointIdentity(databaseUrl) {
  const hostname = new URL(databaseUrl).hostname;
  const match = hostname.match(/^(ep-[a-z0-9-]+?)(?:-pooler)?\./i);
  return match?.[1] || hostname;
}

export async function previewStandardCatalogPresets(client) {
  const state = await readPresetState(client);
  return summarizeStandardCatalogPresetPlan(buildStandardCatalogPresetPlan(state));
}

export async function installStandardCatalogPresets(client, { dryRun = false } = {}) {
  if (dryRun) {
    return {
      dryRun: true,
      created: { attributes: 0, options: 0, categories: 0, assignments: 0 },
      preflight: await previewStandardCatalogPresets(client),
    };
  }
  const result = await runSerializableWithRetry(client, applyPresetTransaction);
  return { dryRun: false, ...result };
}

export function findPresetRecordByCode(records, code) {
  const expected = normalizeCatalogPresetLookup(code);
  return records.find(record => normalizeCatalogPresetLookup(record.code) === expected) || null;
}
