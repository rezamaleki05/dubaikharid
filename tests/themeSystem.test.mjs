import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

const themeSource = await source('../src/lib/theme.js');
const themeModule = await import(`data:text/javascript,${encodeURIComponent(themeSource)}`);
const layout = await source('../src/app/layout.js');
const context = await source('../src/context/ThemeContext.js');
const switcher = await source('../src/components/ThemeSwitcher.js');
const publicHeader = await source('../src/components/Header.js');
const adminHeader = await source('../src/components/admin/AdminHeader.js');
const globalStyles = await source('../src/app/globals.css');
const switcherStyles = await source('../src/components/ThemeSwitcher.module.css');

function runBootstrap(saved, systemDark) {
  const root = { dataset: {}, style: {} };
  vm.runInNewContext(themeModule.THEME_BOOTSTRAP_SCRIPT, {
    localStorage: { getItem: () => saved },
    window: { matchMedia: () => ({ matches: systemDark }) },
    document: { documentElement: root },
  });
  return root;
}

test('default theme preference follows the operating-system preference', () => {
  assert.equal(themeModule.resolveTheme('system', true), 'dark');
  assert.equal(themeModule.resolveTheme('system', false), 'light');
  assert.equal(runBootstrap(null, true).dataset.theme, 'dark');
  assert.equal(runBootstrap(null, false).dataset.theme, 'light');
});

test('explicit light and dark preferences override system and survive bootstrap', () => {
  assert.equal(runBootstrap('light', true).dataset.theme, 'light');
  assert.equal(runBootstrap('dark', false).dataset.theme, 'dark');
  assert.equal(runBootstrap('light', true).dataset.themePreference, 'light');
  assert.equal(runBootstrap('dark', false).dataset.themePreference, 'dark');
});

test('invalid persisted values safely fall back to system mode', () => {
  const root = runBootstrap('invalid-theme', true);
  assert.equal(root.dataset.themePreference, 'system');
  assert.equal(root.dataset.theme, 'dark');
});

test('theme is applied before hydration with a tracked Next.js script', () => {
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /THEME_BOOTSTRAP_SCRIPT/);
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(layout, /<ThemeProvider>/);
});

test('switcher persists all three supported preferences', () => {
  assert.match(context, /localStorage\.setItem\(THEME_STORAGE_KEY, preference\)/);
  assert.match(context, /prefers-color-scheme: dark/);
  assert.match(context, /addEventListener\('storage'/);
  assert.match(switcher, /value: 'light'/);
  assert.match(switcher, /value: 'dark'/);
  assert.match(switcher, /value: 'system'/);
});

test('storefront and Admin use the same shared theme switcher and preference', () => {
  assert.match(publicHeader, /import ThemeSwitcher/);
  assert.match(publicHeader, /<ThemeSwitcher compact/);
  assert.match(adminHeader, /import ThemeSwitcher/);
  assert.match(adminHeader, /<ThemeSwitcher compact/);
});

test('light theme defines semantic surfaces without globally filtering product imagery', () => {
  for (const token of ['--bg-primary', '--surface-primary', '--surface-elevated', '--text-primary', '--border-primary', '--accent', '--danger', '--success', '--overlay']) {
    assert.match(globalStyles, new RegExp(token));
  }
  assert.doesNotMatch(globalStyles, /data-theme=['"]light['"][^{]*\bimg\b[^}]*filter\s*:/s);
});

test('theme menu remains bounded and usable on mobile', () => {
  assert.match(switcherStyles, /width:\s*154px/);
  assert.match(switcherStyles, /@media \(max-width: 640px\)/);
  assert.match(switcherStyles, /position:\s*fixed/);
});

test('critical public, account, payment, and Admin styles all include light-theme coverage', async () => {
  const criticalStyles = [
    '../src/components/Header.module.css',
    '../src/components/CheckoutModal.module.css',
    '../src/components/payment/ManualPayment.module.css',
    '../src/app/product/[id]/Product.module.css',
    '../src/app/profile/Profile.module.css',
    '../src/app/admin/Admin.module.css',
  ];
  for (const path of criticalStyles) assert.match(await source(path), /data-theme='light'/, path);
});
