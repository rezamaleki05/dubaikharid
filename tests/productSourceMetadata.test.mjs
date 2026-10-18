import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sameSourceHomepage, exactProductSourceInput, productSourceLink, officialSourceDomainWarning } from '../src/lib/productSourceDomain.js';
import { buildProductVariantSignature } from '../src/lib/productVariantDomain.js';
const external = await import('data:text/javascript;base64,' + Buffer.from(readFileSync('src/lib/externalUrls.js','utf8').replace("import 'server-only';",'')).toString('base64'));
const brand={id:'adidas',url:'https://www.adidas.ae/'};
const exact='https://www.adidas.ae/en/galaxy-6-shoes/GW3848.html';
for(const [label,url] of [['path',exact],['query',exact+'?id=123&color=black'],['SKU',exact+'?sku=GW3848'],['query order',exact+'?z=2&a=1']]) test(`official exact ${label} survives form selection and reopen`,()=>{
 const form={sourceType:'brand',brandId:brand.id,originalLink:url};assert.equal(productSourceLink(form,brand),url);assert.equal(exactProductSourceInput({originalLink:url,brand,storeId:null}),url);assert.equal(brand.url,'https://www.adidas.ae/');
});
test('empty official URL uses existing homepage fallback and reopens as empty exact input',()=>{
 assert.equal(productSourceLink({sourceType:'brand',originalLink:' '},brand),brand.url);assert.equal(exactProductSourceInput({originalLink:brand.url,brand}), '');
});
test('none source never leaks a stale exact URL',()=>assert.equal(productSourceLink({sourceType:'none',originalLink:exact},brand),null));
test('official→store→official keeps one exact URL and cannot introduce Store ID into the URL',()=>{
 const form={sourceType:'brand',originalLink:exact,storeId:''};const value=productSourceLink(form,brand);form.sourceType='store';form.storeId='amazon';assert.equal(productSourceLink(form,brand),value);form.sourceType='brand';form.storeId='';assert.equal(productSourceLink(form,brand),value);
});
for(const name of ['Amazon','Noon','Namshi','Shein'])test(`${name} source preserves product path/query`,()=>assert.equal(productSourceLink({sourceType:'store',originalLink:`https://${name.toLowerCase()}.com/item/123?sku=ABC`},brand),`https://${name.toLowerCase()}.com/item/123?sku=ABC`));
test('Store fallback remains separate and is not mistaken for Brand fallback',()=>{
 assert.equal(productSourceLink({sourceType:'store',originalLink:''},brand),null);assert.equal(exactProductSourceInput({storeId:'store',originalLink:brand.url,brand}),brand.url);
});
for(const url of ['not a url','javascript:alert(1)','https://user:pass@example.com/item','https://localhost/item','https://127.0.0.1/item'])test(`unsafe source rejected: ${url}`,()=>assert.equal(external.parseExternalHttpUrl(url),null));
test('valid HTTPS path/query survives URL validation; existing dedupe canonicalization remains independent',()=>{
 const input=exact+'?sku=GW3848&size=42&utm_source=mail#details';assert.equal(external.parseExternalHttpUrl(input).toString(),input);assert.equal(external.normalizeProductSourceUrl(input),exact+'?size=42&sku=GW3848');
});
for(const url of ['https://adidas.ae/','https://www.adidas.ae'])test(`equivalent homepage recognized ${url}`,()=>assert.ok(sameSourceHomepage(url,brand.url)));
for(const url of [exact,brand.url+'?id=123','https://www.adidas.ae.evil.test/'])test(`exact/different URL not a shared homepage ${url}`,()=>assert.equal(sameSourceHomepage(url,brand.url),false));
test('domain warning is non-blocking and accepts legitimate subdomains',()=>{
 assert.equal(officialSourceDomainWarning('https://shop.adidas.ae/product',brand.url),false);assert.equal(officialSourceDomainWarning('https://www.adidas.com/product',brand.url),true);assert.equal(productSourceLink({sourceType:'brand',originalLink:'https://www.adidas.com/product'},brand),'https://www.adidas.com/product');
});
for(const sourceType of ['brand','store','none'])test(`source ${sourceType} cannot change variant identity`,()=>{
 const selection=[{attributeCode:'color',optionCode:'black'},{attributeCode:'size',optionCode:'eu-42'}];assert.equal(buildProductVariantSignature(selection.map(x=>({...x,sourceType,originalLink:exact,brandHomepage:brand.url}))), 'color=black|size=eu-42');assert.notEqual(buildProductVariantSignature([...selection.slice(0,1),{attributeCode:'size',optionCode:'eu-41'}]),buildProductVariantSignature(selection));
});
test('source whitespace trims only surrounding input, retaining path/query bytes',()=>assert.equal(productSourceLink({sourceType:'brand',originalLink:'  '+exact+'?b=two&a=one  '},brand),exact+'?b=two&a=one'));
test('nonstandard port is not silently treated as the Brand homepage',()=>assert.equal(sameSourceHomepage('https://www.adidas.ae:8443/',brand.url),false));
test('a meaningful root-page query is still an exact Product reference',()=>assert.equal(exactProductSourceInput({brand,originalLink:brand.url+'?product=123'}),brand.url+'?product=123'));
test('Product Telegram CTA cannot become an external sourcing URL',async()=>{
 const {buildTelegramProductPost}=await import('../src/lib/telegram/message.js');const post=buildTelegramProductPost({id:'source-product',nameFa:'کفش',nameEn:'Shoes',originalLink:exact,sourceUrlKey:exact});assert.equal(post.url,'https://www.dubaikharid.shop/product/source-product');assert.equal(post.reply_markup.inline_keyboard[0][0].url,post.url);
});
