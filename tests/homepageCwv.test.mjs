import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('theme resolution is parser executed before body paint, retaining the existing bootstrap', () => {
  const source=fs.readFileSync('src/app/layout.js','utf8');
  assert.match(source,/<head><script id="dubai-kharid-theme" dangerouslySetInnerHTML=\{\{ __html: THEME_BOOTSTRAP_SCRIPT \}\} \/><\/head>/);
  assert.doesNotMatch(source,/<Script id="dubai-kharid-theme"/);
});
test('one matching responsive Hero preload carries explicit high priority without a duplicate Next preload',()=>{
  const source=fs.readFileSync('src/components/Hero.js','utf8');
  assert.equal((source.match(/rel="preload"/g)||[]).length,1);
  assert.match(source,/imageSrcSet=\{heroPreload.srcSet\} imageSizes=\{heroPreload.sizes\} fetchPriority="high"/);
  assert.match(source,/<Image.*loading="eager" fetchPriority="high" sizes="100vw" quality=\{90\}/);
  assert.doesNotMatch(source,/<Image[^>]*\bpreload\b/);
});
