import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const header = await readFile(new URL('../src/components/Header.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/components/Header.module.css', import.meta.url), 'utf8');

test('account trigger and dropdown share one continuous interaction container', () => {
  assert.match(header, /userMenuContainer[\s\S]*userMenuTrigger[\s\S]*userDropdownBridge[\s\S]*userDropdown/);
  assert.match(styles, /\.userDropdownBridge\s*\{[\s\S]*top:\s*100%;[\s\S]*padding-top:\s*7px;/);
  assert.doesNotMatch(styles, /\.userDropdown(?:Bridge)?\s*\{[\s\S]*top:\s*calc\(100%\s*\+\s*7px\)/);
});

test('hover and keyboard focus keep the account bridge interactive', () => {
  assert.match(styles, /\.userMenuContainer:hover \.userDropdownBridge,[\s\S]*\.userMenuContainer:focus-within \.userDropdownBridge/);
  assert.match(styles, /\.userDropdownBridge\s*\{[\s\S]*pointer-events:\s*none;/);
  assert.doesNotMatch(styles, /\.userDropdownBridge\s*\{[^}]*transition:[^;}]*visibility/);
  assert.match(styles, /\.userMenuContainer:focus-within \.userDropdownBridge\s*\{[\s\S]*pointer-events:\s*auto;/);
  assert.match(header, /<button type="button" className=\{styles\.userMenuTrigger\}>/);
});

test('header sublayers keep the account dropdown above search and navigation', () => {
  assert.match(styles, /--header-layer-nav:\s*1;/);
  assert.match(styles, /--header-layer-main:\s*2;/);
  assert.match(styles, /--header-layer-account:\s*3;/);
  assert.match(styles, /\.topBar\s*\{[\s\S]*z-index:\s*var\(--header-layer-account\);[\s\S]*overflow:\s*visible;/);
  assert.match(styles, /\.mainRow\s*\{[\s\S]*z-index:\s*var\(--header-layer-main\);/);
  assert.match(styles, /\.nav\s*\{[\s\S]*z-index:\s*var\(--header-layer-nav\);/);
});

test('mobile header continues to hide the desktop account rail', () => {
  assert.match(styles, /@media \(max-width: 980px\)[\s\S]*\.topBar\s*\{\s*display:\s*none;/);
});
