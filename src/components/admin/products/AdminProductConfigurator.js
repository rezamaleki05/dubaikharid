'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminBrandSelector from '@/components/admin/AdminBrandSelector';
import AdminProductImageField, { createProductImageState } from '@/components/admin/AdminProductImageField';
import { buildVariantOptionCombinations } from '@/lib/adminProductConfigurationDomain';
import styles from './AdminProductConfigurator.module.css';

const EMPTY_FORM = {
  nameFa: '',
  nameEn: '',
  description: '',
  slug: '',
  brandId: '',
  categoryId: '',
  storeId: '',
  supplyMode: 'EXTERNAL_DUBAI',
  priceAed: '',
  priceToman: '',
  weight: '1',
  originalLink: '',
  gender: '',
  discountPercent: '0',
  hasDiscount: false,
  isBestSeller: false,
  status: 'active',
};

async function readApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'عملیات با خطا مواجه شد.');
  return payload;
}

async function uploadProductImage(imageState) {
  if (imageState.method === 'url') {
    const value = imageState.url.trim() || null;
    return { value, changed: value !== (imageState.existingUrl || null) };
  }
  if (imageState.file) {
    const formData = new FormData();
    formData.set('file', imageState.file);
    const uploaded = await readApiResponse(await fetch('/api/admin/products/upload', {
      method: 'POST',
      body: formData,
    }));
    return { value: uploaded.url, changed: true };
  }
  if (imageState.removed) return { value: null, changed: Boolean(imageState.existingUrl) };
  return { value: imageState.existingUrl || null, changed: false };
}

function combinationKey(optionIds) {
  return optionIds.length ? [...optionIds].sort().join('|') : '__default__';
}

function blankDraft(existing = null) {
  return {
    id: existing?.id || null,
    sku: existing?.sku || '',
    priceAedOverride: existing?.priceAedOverride ?? '',
    priceTomanOverride: existing?.priceTomanOverride ?? '',
    discountPercentOverride: existing?.discountPercentOverride ?? '',
    weightOverride: existing?.weightOverride ?? '',
    inventory: {
      stock: existing?.inventory?.stock ?? '0',
      minStock: existing?.inventory?.minStock ?? '0',
      location: existing?.inventory?.location || '',
      reserved: existing?.inventory?.reserved ?? 0,
      available: existing?.inventory?.available ?? 0,
    },
  };
}

function hydrateAttributeInputs(assignments, values) {
  const result = {};
  for (const assignment of assignments) {
    if (assignment.isVariantDefining) continue;
    const rows = values.filter(value => value.attributeId === assignment.attributeId);
    const type = assignment.attribute.inputType;
    if (['MULTI_SELECT', 'COLOR'].includes(type) && assignment.allowsMultiple) {
      result[assignment.attributeId] = rows.map(row => row.attributeOptionId).filter(Boolean);
    } else if (['SELECT', 'MULTI_SELECT', 'COLOR'].includes(type)) {
      result[assignment.attributeId] = rows[0]?.attributeOptionId || '';
    } else if (type === 'TEXT') result[assignment.attributeId] = rows[0]?.textValue || '';
    else if (type === 'NUMBER') result[assignment.attributeId] = rows[0]?.numberValue || '';
    else if (type === 'BOOLEAN') {
      result[assignment.attributeId] = typeof rows[0]?.booleanValue === 'boolean'
        ? String(rows[0].booleanValue)
        : '';
    }
  }
  return result;
}

function initialForm(product, seed) {
  if (product) {
    return {
      ...EMPTY_FORM,
      nameFa: product.nameFa || '',
      nameEn: product.nameEn || '',
      description: product.description || '',
      slug: product.slug || '',
      brandId: product.brandId || '',
      categoryId: product.categoryId || '',
      storeId: product.storeId || '',
      supplyMode: product.supplyMode || 'EXTERNAL_DUBAI',
      priceAed: product.priceAed ?? '',
      priceToman: product.priceToman ?? '',
      weight: String(product.weight ?? 1),
      originalLink: product.originalLink || '',
      gender: product.gender || '',
      discountPercent: String(product.discountPercent ?? 0),
      hasDiscount: Boolean(product.hasDiscount),
      isBestSeller: Boolean(product.isBestSeller),
      status: product.status || 'active',
    };
  }
  return { ...EMPTY_FORM, ...seed };
}

function FieldLabel({ assignment }) {
  return (
    <span className={styles.fieldLabel}>
      {assignment.attribute.nameFa}
      {assignment.isRequired && <strong aria-label="الزامی">*</strong>}
      <small>{assignment.attribute.nameEn}</small>
      {assignment.attribute.unitFa && <em>{assignment.attribute.unitFa}</em>}
    </span>
  );
}

function OptionButton({ option, selected, onClick, color = false }) {
  return (
    <button
      type="button"
      className={selected ? styles.optionSelected : styles.option}
      onClick={onClick}
      aria-pressed={selected}
    >
      {color && (
        <span
          className={styles.swatch}
          style={{ backgroundColor: option.swatchHex || '#6b7280' }}
          aria-hidden="true"
        />
      )}
      <span>{option.labelFa}</span>
      <small>{option.labelEn}</small>
    </button>
  );
}

function DynamicAttributeField({ assignment, value, onChange }) {
  const type = assignment.attribute.inputType;
  const options = assignment.attribute.options;
  const multiple = ['MULTI_SELECT', 'COLOR'].includes(type) && assignment.allowsMultiple;
  if (['SELECT', 'MULTI_SELECT', 'COLOR'].includes(type)) {
    const selected = multiple ? (Array.isArray(value) ? value : []) : [value].filter(Boolean);
    return (
      <div className={styles.attributeField}>
        <FieldLabel assignment={assignment} />
        <div className={styles.optionList}>
          {options.map(option => (
            <OptionButton
              key={option.id}
              option={option}
              color={type === 'COLOR'}
              selected={selected.includes(option.id)}
              onClick={() => {
                if (!multiple) return onChange(selected.includes(option.id) ? '' : option.id);
                onChange(selected.includes(option.id)
                  ? selected.filter(id => id !== option.id)
                  : [...selected, option.id]);
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  if (type === 'BOOLEAN') {
    return (
      <label className={styles.attributeField}>
        <FieldLabel assignment={assignment} />
        <select className={styles.input} value={value ?? ''} onChange={event => onChange(event.target.value)}>
          <option value="">انتخاب کنید</option>
          <option value="true">بله</option>
          <option value="false">خیر</option>
        </select>
      </label>
    );
  }
  return (
    <label className={styles.attributeField}>
      <FieldLabel assignment={assignment} />
      <div className={styles.inputWithUnit}>
        <input
          className={styles.input}
          type={type === 'NUMBER' ? 'number' : 'text'}
          step={type === 'NUMBER' ? 'any' : undefined}
          value={value ?? ''}
          onChange={event => onChange(event.target.value)}
        />
        {assignment.attribute.unitFa && <span>{assignment.attribute.unitFa}</span>}
      </div>
    </label>
  );
}

function VariantEditor({ row, draft, onChange, supplyMode }) {
  const set = (field, value) => onChange({ ...draft, [field]: value });
  const setInventory = (field, value) => onChange({
    ...draft,
    inventory: { ...draft.inventory, [field]: value },
  });
  return (
    <div className={styles.variantEditor}>
      <div className={styles.variantIdentity}>
        <div className={styles.variantName}>
          {row.labels.length ? row.labels.join(' / ') : 'محصول ساده'}
        </div>
        {draft.id && <span className={styles.preserved}>شناسه موجود حفظ می‌شود</span>}
      </div>
      <div className={styles.variantFields}>
        <label>
          <span>SKU اختیاری</span>
          <input dir="ltr" className={styles.input} value={draft.sku} onChange={event => set('sku', event.target.value)} />
        </label>
        <label>
          <span>{supplyMode === 'EXTERNAL_DUBAI' ? 'قیمت درهم سفارشی' : 'قیمت تومان سفارشی'}</span>
          <input
            className={styles.input}
            type="number"
            min={supplyMode === 'EXTERNAL_DUBAI' ? '0.01' : '1'}
            step={supplyMode === 'EXTERNAL_DUBAI' ? '0.01' : '1'}
            placeholder="خالی = ارث‌بری"
            value={supplyMode === 'EXTERNAL_DUBAI' ? draft.priceAedOverride : draft.priceTomanOverride}
            onChange={event => set(
              supplyMode === 'EXTERNAL_DUBAI' ? 'priceAedOverride' : 'priceTomanOverride',
              event.target.value,
            )}
          />
        </label>
        <label>
          <span>تخفیف سفارشی ٪</span>
          <input
            className={styles.input}
            type="number"
            min="0"
            max="100"
            placeholder="خالی = ارث‌بری؛ ۰ = بدون تخفیف"
            value={draft.discountPercentOverride}
            onChange={event => set('discountPercentOverride', event.target.value)}
          />
        </label>
        <label>
          <span>وزن سفارشی (کیلوگرم)</span>
          <input
            className={styles.input}
            type="number"
            min="0.01"
            step="any"
            placeholder="خالی = ارث‌بری"
            value={draft.weightOverride}
            onChange={event => set('weightOverride', event.target.value)}
          />
        </label>
      </div>
      {supplyMode === 'IRAN_STOCK' && (
        <div className={styles.inventoryGrid}>
          <label>
            <span>موجودی کل</span>
            <input className={styles.input} type="number" min={draft.inventory.reserved} step="1" value={draft.inventory.stock} onChange={event => setInventory('stock', event.target.value)} />
          </label>
          <label>
            <span>حداقل موجودی</span>
            <input className={styles.input} type="number" min="0" step="1" value={draft.inventory.minStock} onChange={event => setInventory('minStock', event.target.value)} />
          </label>
          <label>
            <span>محل نگهداری</span>
            <input className={styles.input} value={draft.inventory.location} onChange={event => setInventory('location', event.target.value)} />
          </label>
          <div className={styles.readOnlyInventory}>
            <span>رزرو: <strong>{draft.inventory.reserved}</strong></span>
            <span>قابل فروش: <strong>{Number(draft.inventory.stock || 0) - Number(draft.inventory.reserved || 0)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductConfigurator({
  mode,
  productId = null,
  seed = null,
  brands,
  categories,
  stores,
  onBrandsChange,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => initialForm(null, seed));
  const [image, setImage] = useState(() => createProductImageState(seed?.image || '', seed?.image ? 'url' : 'upload'));
  const [detail, setDetail] = useState(null);
  const [categoryConfig, setCategoryConfig] = useState(null);
  const [attributeInputs, setAttributeInputs] = useState({});
  const [axisSelections, setAxisSelections] = useState({});
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !productId) return;
    let cancelled = false;
    fetch('/api/admin/products/' + encodeURIComponent(productId) + '/configuration', { cache: 'no-store' })
      .then(readApiResponse)
      .then(payload => {
        if (cancelled) return;
        setDetail(payload);
        setForm(initialForm(payload.product));
        setImage(createProductImageState(payload.product.image || ''));
      })
      .catch(fetchError => !cancelled && setError(fetchError.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [mode, productId]);

  useEffect(() => {
    if (!form.categoryId) return;
    let cancelled = false;
    fetch(
      '/api/admin/categories/' + encodeURIComponent(form.categoryId) + '/product-configuration',
      { cache: 'no-store' },
    ).then(readApiResponse).then(payload => {
      if (cancelled) return;
      setCategoryConfig(payload);
      const editingSameCategory = detail?.product?.categoryId === form.categoryId;
      if (!editingSameCategory) {
        setAttributeInputs({});
        setAxisSelections({});
        setSelectedKeys([]);
        setDrafts({});
        return;
      }
      setAttributeInputs(hydrateAttributeInputs(payload.attributes, detail.attributeValues));
      const activeVariants = detail.variants.filter(variant => variant.isActive);
      const nextAxisSelections = {};
      for (const assignment of payload.attributes.filter(item => item.isVariantDefining)) {
        nextAxisSelections[assignment.attributeId] = [...new Set(activeVariants.flatMap(variant => (
          variant.options.filter(option => option.attributeId === assignment.attributeId).map(option => option.optionId)
        )))];
      }
      const nextDrafts = {};
      for (const variant of detail.variants) {
        const key = combinationKey(variant.options.map(option => option.optionId));
        nextDrafts[key] = blankDraft(variant);
      }
      setAxisSelections(nextAxisSelections);
      setSelectedKeys(activeVariants
        .filter(variant => payload.attributes.some(item => item.isVariantDefining) ? !variant.isDefault : variant.isDefault)
        .map(variant => combinationKey(variant.options.map(option => option.optionId))));
      setDrafts(nextDrafts);
    }).catch(fetchError => !cancelled && setError(fetchError.message));
    return () => { cancelled = true; };
  }, [detail, form.categoryId]);

  const axes = useMemo(
    () => categoryConfig?.attributes.filter(item => item.isVariantDefining) || [],
    [categoryConfig],
  );
  const informational = useMemo(
    () => categoryConfig?.attributes.filter(item => !item.isVariantDefining) || [],
    [categoryConfig],
  );
  const combinations = useMemo(() => {
    if (!categoryConfig) return [];
    const optionGroups = axes.map(axis => axisSelections[axis.attributeId] || []);
    return buildVariantOptionCombinations(optionGroups).map(optionIds => {
      const optionMap = new Map(axes.flatMap(axis => axis.attribute.options.map(option => [option.id, option])));
      return {
        key: combinationKey(optionIds),
        optionIds,
        labels: optionIds.map(id => optionMap.get(id)?.labelFa || id),
      };
    });
  }, [axes, axisSelections, categoryConfig]);
  const visibleKeys = useMemo(() => new Set(combinations.map(row => row.key)), [combinations]);
  const effectiveSelectedKeys = axes.length === 0 && combinations.length === 1
    ? ['__default__']
    : selectedKeys.filter(key => visibleKeys.has(key));

  const toggleAxisOption = (attributeId, optionId) => {
    setAxisSelections(previous => {
      const current = previous[attributeId] || [];
      return {
        ...previous,
        [attributeId]: current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const ensureDraft = useCallback(key => drafts[key] || blankDraft(), [drafts]);

  const buildAttributeValues = () => {
    const values = [];
    const selectedRows = combinations.filter(row => effectiveSelectedKeys.includes(row.key));
    const usedAxisOptions = new Set(selectedRows.flatMap(row => row.optionIds));
    for (const axis of axes) {
      for (const optionId of usedAxisOptions) {
        if (axis.attribute.options.some(option => option.id === optionId)) {
          values.push({ attributeId: axis.attributeId, attributeOptionId: optionId });
        }
      }
    }
    for (const assignment of informational) {
      const value = attributeInputs[assignment.attributeId];
      const type = assignment.attribute.inputType;
      if (['SELECT', 'MULTI_SELECT', 'COLOR'].includes(type)) {
        for (const optionId of (Array.isArray(value) ? value : [value]).filter(Boolean)) {
          values.push({ attributeId: assignment.attributeId, attributeOptionId: optionId });
        }
      } else if (type === 'TEXT' && String(value || '').trim()) {
        values.push({ attributeId: assignment.attributeId, textValue: String(value).trim() });
      } else if (type === 'NUMBER' && String(value ?? '').trim()) {
        values.push({ attributeId: assignment.attributeId, numberValue: String(value).trim() });
      } else if (type === 'BOOLEAN' && value !== '') {
        values.push({ attributeId: assignment.attributeId, booleanValue: value === 'true' });
      }
    }
    return values;
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!categoryConfig) return setError('ابتدا دسته‌بندی محصول را انتخاب کنید.');
    if (combinations.length > (categoryConfig.hardLimit || 200)) {
      return setError('تعداد ترکیب‌ها از سقف مجاز عبور کرده است.');
    }
    if (effectiveSelectedKeys.length < 1) return setError('حداقل یک ترکیب قابل فروش را انتخاب کنید.');
    setSaving(true);
    try {
      const imageResult = await uploadProductImage(image);
      const rows = combinations.filter(row => effectiveSelectedKeys.includes(row.key));
      const variants = rows.map((row, index) => {
        const draft = ensureDraft(row.key);
        const variant = {
          id: draft.id,
          optionIds: row.optionIds,
          sku: draft.sku,
          isActive: true,
          sortOrder: index,
          priceAedOverride: draft.priceAedOverride === '' ? null : draft.priceAedOverride,
          priceTomanOverride: draft.priceTomanOverride === '' ? null : draft.priceTomanOverride,
          discountPercentOverride: draft.discountPercentOverride === '' ? null : draft.discountPercentOverride,
          weightOverride: draft.weightOverride === '' ? null : draft.weightOverride,
          inventory: null,
        };
        if (form.supplyMode === 'IRAN_STOCK') {
          if (draft.inventory.stock === '' || draft.inventory.minStock === '') {
            throw new Error('موجودی و حداقل موجودی همه تنوع‌ها الزامی است.');
          }
          variant.inventory = {
            stock: Number(draft.inventory.stock),
            minStock: Number(draft.inventory.minStock),
            location: draft.inventory.location || null,
          };
        }
        return variant;
      });
      const product = {
        nameFa: form.nameFa,
        nameEn: form.nameEn,
        description: form.description || null,
        ...(form.slug ? { slug: form.slug } : {}),
        brandId: form.brandId || null,
        categoryId: form.categoryId,
        storeId: form.storeId,
        supplyMode: form.supplyMode,
        priceAed: form.supplyMode === 'EXTERNAL_DUBAI' ? form.priceAed : null,
        priceToman: form.supplyMode === 'IRAN_STOCK' ? form.priceToman : null,
        weight: form.weight,
        originalLink: form.originalLink || null,
        image: imageResult.value,
        gender: form.gender || null,
        discountPercent: form.hasDiscount ? Number(form.discountPercent) : 0,
        hasDiscount: form.hasDiscount,
        isBestSeller: form.isBestSeller,
        status: form.status,
      };
      const endpoint = mode === 'edit'
        ? '/api/admin/products/' + encodeURIComponent(productId) + '/configuration'
        : '/api/admin/products/configuration';
      const payload = await readApiResponse(await fetch(endpoint, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, attributeValues: buildAttributeValues(), variants }),
      }));
      await onSaved(payload);
    } catch (submitError) {
      setError(submitError.message || 'ذخیره محصول انجام نشد.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.backdrop}><div className={styles.loading}>در حال بارگذاری تنظیمات محصول…</div></div>;
  }

  const tooMany = combinations.length > (categoryConfig?.hardLimit || 200);
  const warning = combinations.length >= (categoryConfig?.warningThreshold || 50);
  return (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="product-config-title">
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>PRODUCT CONFIGURATION</span>
            <h2 id="product-config-title">{mode === 'edit' ? 'ویرایش محصول و تنوع‌ها' : 'افزودن محصول پویا'}</h2>
            <p>دسته‌بندی، ویژگی‌ها، قیمت و موجودی در یک جریان کنترل‌شده</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="بستن">×</button>
        </header>
        <form className={styles.form} onSubmit={submit}>
          {error && <div className={styles.error} role="alert">{error}</div>}

          <section className={styles.section}>
            <div className={styles.sectionHeading}><span>۰۱</span><div><h3>هویت و دسته‌بندی</h3><p>ابتدا دسته‌بندی را مشخص کنید تا فیلدهای مرتبط نمایش داده شوند.</p></div></div>
            <div className={styles.twoColumns}>
              <label><span>نام فارسی محصول *</span><input className={styles.input} required maxLength={240} value={form.nameFa} onChange={event => setForm({ ...form, nameFa: event.target.value })} /></label>
              <label><span>نام انگلیسی / نام اصلی محصول *</span><input dir="ltr" className={styles.input} required maxLength={240} value={form.nameEn} onChange={event => setForm({ ...form, nameEn: event.target.value })} /></label>
            </div>
            <label><span>توضیحات</span><textarea className={styles.textarea} rows={5} maxLength={20000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
            <div className={styles.threeColumns}>
              <label>
                <span>دسته‌بندی *</span>
                <select className={styles.input} required value={form.categoryId} onChange={event => {
                  setCategoryConfig(null);
                  setError('');
                  setForm({ ...form, categoryId: event.target.value });
                }}>
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <AdminBrandSelector
                brands={brands}
                categoryId={form.categoryId}
                value={form.brandId}
                onChange={brandId => setForm(previous => ({ ...previous, brandId }))}
                onBrandsChange={onBrandsChange}
                disabled={saving}
              />
              <label>
                <span>فروشگاه مبدا *</span>
                <select className={styles.input} required value={form.storeId} onChange={event => setForm({ ...form, storeId: event.target.value })}>
                  <option value="">انتخاب فروشگاه</option>
                  {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
              </label>
            </div>
          </section>

          {categoryConfig && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}><span>۰۲</span><div><h3>ویژگی‌های دسته‌بندی</h3><p>فقط ویژگی‌های فعال و مرتبط با این دسته‌بندی نمایش داده می‌شوند.</p></div></div>
              {informational.length ? (
                <div className={styles.attributeGrid}>
                  {informational.map(assignment => (
                    <DynamicAttributeField
                      key={assignment.id}
                      assignment={assignment}
                      value={attributeInputs[assignment.attributeId]}
                      onChange={value => setAttributeInputs(previous => ({ ...previous, [assignment.attributeId]: value }))}
                    />
                  ))}
                </div>
              ) : <p className={styles.emptyMessage}>ویژگی اطلاعاتی برای این دسته‌بندی تعریف نشده است.</p>}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeading}><span>۰۳</span><div><h3>روش تأمین و قیمت پایه</h3><p>قیمت تنوع‌ها می‌تواند از محصول ارث ببرد یا مقدار سفارشی داشته باشد.</p></div></div>
            <div className={styles.supplyModes}>
              <button type="button" className={form.supplyMode === 'EXTERNAL_DUBAI' ? styles.supplyActive : styles.supplyMode} onClick={() => setForm({ ...form, supplyMode: 'EXTERNAL_DUBAI' })}><strong>سفارش از دبی</strong><small>قیمت درهم + وزن، بدون موجودی فیزیکی</small></button>
              <button type="button" className={form.supplyMode === 'IRAN_STOCK' ? styles.supplyActive : styles.supplyMode} onClick={() => setForm({ ...form, supplyMode: 'IRAN_STOCK' })}><strong>موجود در ایران</strong><small>قیمت تومان + موجودی مستقل هر تنوع</small></button>
            </div>
            <div className={styles.threeColumns}>
              <label><span>{form.supplyMode === 'EXTERNAL_DUBAI' ? 'قیمت پایه (AED) *' : 'قیمت پایه (تومان) *'}</span><input className={styles.input} required type="number" min="1" step={form.supplyMode === 'EXTERNAL_DUBAI' ? '0.01' : '1'} value={form.supplyMode === 'EXTERNAL_DUBAI' ? form.priceAed : form.priceToman} onChange={event => setForm({ ...form, [form.supplyMode === 'EXTERNAL_DUBAI' ? 'priceAed' : 'priceToman']: event.target.value })} /></label>
              <label><span>وزن پایه (کیلوگرم) *</span><input className={styles.input} required type="number" min="0.01" step="any" value={form.weight} onChange={event => setForm({ ...form, weight: event.target.value })} /></label>
              <label><span>درصد تخفیف</span><input className={styles.input} disabled={!form.hasDiscount} type="number" min="0" max="100" value={form.discountPercent} onChange={event => setForm({ ...form, discountPercent: event.target.value })} /></label>
            </div>
            <div className={styles.checkRow}>
              <label><input type="checkbox" checked={form.hasDiscount} onChange={event => setForm({ ...form, hasDiscount: event.target.checked })} /> دارای تخفیف</label>
              <label><input type="checkbox" checked={form.isBestSeller} onChange={event => setForm({ ...form, isBestSeller: event.target.checked })} /> پرفروش</label>
            </div>
          </section>

          {categoryConfig && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}><span>۰۴</span><div><h3>{axes.length ? 'ماتریس تنوع‌های قابل فروش' : 'تنظیمات محصول ساده'}</h3><p>{axes.length ? 'گزینه‌های هر محور را انتخاب کنید؛ سپس فقط ترکیب‌هایی را فعال کنید که واقعاً فروخته می‌شوند.' : 'تنوع پیش‌فرض داخلی بدون نمایش انتخاب‌گر ساختگی حفظ می‌شود.'}</p></div></div>
              {axes.map(axis => (
                <div className={styles.axis} key={axis.id}>
                  <FieldLabel assignment={axis} />
                  <div className={styles.optionList}>
                    {axis.attribute.options.map(option => (
                      <OptionButton key={option.id} option={option} color={axis.attribute.inputType === 'COLOR'} selected={(axisSelections[axis.attributeId] || []).includes(option.id)} onClick={() => toggleAxisOption(axis.attributeId, option.id)} />
                    ))}
                  </div>
                </div>
              ))}
              {axes.length > 0 && combinations.length > 0 && !tooMany && (
                <div className={styles.matrixToolbar}>
                  <span>{combinations.length} ترکیب ممکن · {effectiveSelectedKeys.length} انتخاب‌شده</span>
                  <div><button type="button" onClick={() => setSelectedKeys(combinations.map(row => row.key))}>انتخاب همه</button><button type="button" onClick={() => setSelectedKeys([])}>پاک‌کردن همه</button></div>
                </div>
              )}
              {warning && !tooMany && <div className={styles.warning}>تعداد ترکیب‌ها زیاد است؛ فقط ترکیب‌های واقعاً قابل فروش را فعال نگه دارید.</div>}
              {tooMany && <div className={styles.error}>تعداد ترکیب‌ها از سقف {categoryConfig.hardLimit} عبور کرده است. گزینه‌های محورها را کاهش دهید.</div>}
              {!tooMany && combinations.map(row => {
                const selected = axes.length === 0 || effectiveSelectedKeys.includes(row.key);
                const draft = ensureDraft(row.key);
                return (
                  <div className={selected ? styles.variantSelected : styles.variantRow} key={row.key}>
                    {axes.length > 0 && <label className={styles.variantToggle}><input type="checkbox" checked={selected} onChange={() => setSelectedKeys(previous => selected ? previous.filter(key => key !== row.key) : [...previous, row.key])} /><span>{row.labels.join(' / ')}</span></label>}
                    {selected && <VariantEditor row={row} draft={draft} supplyMode={form.supplyMode} onChange={next => setDrafts(previous => ({ ...previous, [row.key]: next }))} />}
                  </div>
                );
              })}
              {axes.length > 0 && combinations.length === 0 && <p className={styles.emptyMessage}>برای ساخت ماتریس، از هر محور حداقل یک گزینه انتخاب کنید.</p>}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeading}><span>۰۵</span><div><h3>انتشار و منبع</h3><p>تصویر، لینک اصلی و وضعیت نمایش محصول حفظ می‌شوند.</p></div></div>
            <AdminProductImageField value={image} onChange={setImage} uploading={saving} />
            <div className={styles.twoColumns}>
              <label><span>لینک اصلی محصول</span><input dir="ltr" className={styles.input} value={form.originalLink} onChange={event => setForm({ ...form, originalLink: event.target.value })} /></label>
              <label><span>وضعیت محصول</span><select className={styles.input} value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="active">فعال</option><option value="needs_update">نیاز به بروزرسانی</option><option value="broken_link">لینک خراب</option><option value="hidden">مخفی</option></select></label>
            </div>
            <div className={styles.checkRow}>
              {['men', 'women', 'kids'].map(gender => <label key={gender}><input type="radio" name="gender" checked={form.gender === gender} onChange={() => setForm({ ...form, gender })} />{gender === 'men' ? 'مردانه' : gender === 'women' ? 'زنانه' : 'بچگانه'}</label>)}
              <button type="button" className={styles.clearGender} onClick={() => setForm({ ...form, gender: '' })}>بدون جنسیت</button>
            </div>
          </section>

          <footer className={styles.footer}>
            <button type="button" className={styles.cancel} onClick={onClose}>انصراف</button>
            <button type="submit" className={styles.submit} disabled={saving || tooMany}>{saving ? 'در حال ذخیره کنترل‌شده…' : mode === 'edit' ? 'ذخیره تغییرات' : 'ثبت محصول و تنوع‌ها'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
