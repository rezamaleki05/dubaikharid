import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { installAnalyticsRouteGuard, isPublicAnalyticsLocation } from '../src/lib/analyticsPolicy.js';
const source = async path => readFile(new URL(path, import.meta.url), 'utf8');
const storage = new Map();
globalThis.window = { location: new URL('https://www.dubaikharid.shop/product/p1'), navigator:{webdriver:false}, __dkAnalyticsEnabled:true, dataLayer:[], localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)} };
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID='G-65ETTKMWRB';
const analytics=await import('../src/lib/analytics.js');
analytics.initializePublicAnalytics(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
const lastEvent=()=>Array.from(window.dataLayer.at(-1));
const reset=()=>{window.dataLayer.length=0;window.location=new URL('https://www.dubaikharid.shop/product/p1');window.__dkAnalyticsEnabled=true;window.navigator.webdriver=false;storage.clear();};

test('ecommerce uses customer Toman converted to ISO IRR, never AED acquisition cost',()=>{
 reset();const item={id:'p1',name:'Product',priceToman:1000000,priceAed:100,discountPercent:10,quantity:2};
 assert.equal(analytics.trackViewItem(item),true);assert.equal(lastEvent()[2].currency,'IRR');assert.equal(lastEvent()[2].value,18000000);assert.equal(lastEvent()[2].items[0].price,9000000);
 for(const fn of ['trackAddToCart','trackRemoveFromCart','trackViewCart','trackBeginCheckout'])assert.equal(analytics[fn](fn==='trackViewCart'?[item]:item),true);
});
test('authoritative final variant/snapshot price is not discounted twice',()=>{
 reset();analytics.trackViewItem({id:'p',name:'Shoe',priceAed:100,discountPercent:35,supplyMode:'EXTERNAL_DUBAI',pricing:{finalPriceToman:'77922000'}});assert.equal(lastEvent()[2].items[0].price,779220000);
 analytics.trackViewItem({id:'p',name:'Shoe',priceToman:100,discountPercent:35,finalUnitPriceTomanSnapshot:'90'});assert.equal(lastEvent()[2].items[0].price,900);
});
test('AED-only or varying-price items omit monetary value rather than fake revenue',()=>{
 reset();for(const item of [{id:'p',name:'Product',priceAed:100},{id:'p',name:'Product',priceToman:100,supplyMode:'EXTERNAL_DUBAI'},{id:'p',name:'Product',priceToman:100,priceRange:{varies:true}}]){analytics.trackViewItem(item);assert.equal(lastEvent()[2].value,undefined);assert.equal(lastEvent()[2].items[0].price,undefined);}
});
test('server-confirmed paid order only, once per browser; no customer PII',()=>{
 reset();const order={id:'DK-1',paymentStatus:'paid',phone:'PRIVATE_PHONE',customerName:'PRIVATE_NAME',items:[{productId:'p1',name:'Product',finalUnitPriceTomanSnapshot:'250000',quantity:2}]};
 assert.equal(analytics.trackPurchaseOnce({...order,paymentStatus:'pending'}),false);assert.equal(analytics.trackPurchaseOnce(order),true);assert.equal(analytics.trackPurchaseOnce(order),false);assert.equal(lastEvent()[2].value,5000000);assert.doesNotMatch(JSON.stringify(lastEvent()),/PRIVATE|phone|customerName/);
});
test('WhatsApp whitelist contains context but no URL, phone or query strings',()=>{
 reset();window.location=new URL('https://www.dubaikharid.shop/profile?phone=SECRET#message');analytics.trackWhatsAppClick('profile_support');assert.deepEqual(lastEvent(),['event','whatsapp_click',{link_location:'profile_support',page_path:'/profile',page_type:'public',page_location:'https://www.dubaikharid.shop/profile',page_title:'DubaiKharid | public'}]);assert.equal(analytics.trackWhatsAppClick('phone=SECRET'),false);
});
test('persisted lead success emits once; no form input, record id, URL or PII transmitted',()=>{
 reset();assert.equal(analytics.trackLeadCreated(null,'quick_request'),false);assert.equal(analytics.trackLeadCreated({id:'lead-1',phone:'PRIVATE',notes:'PRIVATE'},'quick_request'),true);assert.equal(analytics.trackLeadCreated({id:'lead-1'},'quick_request'),false);assert.equal(lastEvent()[1],'lead_created');assert.doesNotMatch(JSON.stringify(lastEvent()),/lead-1|PRIVATE|phone|notes/);
});
test('admin, API, dev, previews and automated browsers cannot emit events',()=>{
 reset();for(const url of ['https://www.dubaikharid.shop/admin','https://www.dubaikharid.shop/admin/products','https://www.dubaikharid.shop/api/orders','http://localhost:3109/','https://preview.vercel.app/']){window.location=new URL(url);assert.equal(analytics.trackWhatsAppClick('footer'),false);}
 window.location=new URL('https://www.dubaikharid.shop/');window.navigator.webdriver=true;assert.equal(analytics.trackViewCart([]),false);window.navigator.webdriver=false;window.__dkAnalyticsEnabled=false;assert.equal(analytics.trackViewCart([]),false);assert.equal(window.dataLayer.length,0);
});
test('history is disabled before GA listeners see public→admin navigation; back/public re-enables',()=>{
 const listeners=new Map();const win={location:new URL('https://www.dubaikharid.shop/'),history:{},document:{addEventListener(){},removeEventListener(){}},addEventListener:(n,fn)=>listeners.set(n,fn),removeEventListener:n=>listeners.delete(n)};
 const observations=[];for(const name of ['pushState','replaceState'])win.history[name]=(_s,_u,url)=>{observations.push(win['ga-disable-G-T']);win.location=new URL(url,win.location)};
 const cleanup=installAnalyticsRouteGuard(win,{enabled:true,gaId:'G-T'});win.history.pushState({},'','/admin/dashboard');assert.equal(observations.at(-1),true);win.history.replaceState({},'','/stores/noon');assert.equal(observations.at(-1),false);win.location=new URL('https://www.dubaikharid.shop/admin');listeners.get('popstate')();assert.equal(win.__dkAnalyticsEnabled,false);cleanup();
});
test('public host policy is exact, HTTPS-only, environment gate remains server-side',async()=>{
 assert.equal(isPublicAnalyticsLocation(new URL('https://www.dubaikharid.shop/')),true);assert.equal(isPublicAnalyticsLocation(new URL('https://dubaikharid.shop.attacker.test/')),false);
 const layout=await source('../src/app/layout.js'),boundary=await source('../src/components/analytics/PublicAnalytics.js');assert.equal((layout.match(/<PublicAnalytics/g)||[]).length,1);assert.match(layout,/isGoogleAnalyticsEnabled\(\)/);assert.match(boundary,/installAnalyticsRouteGuard/);assert.match(boundary,/analyticsBrowserExcluded/);assert.equal((boundary.match(/googletagmanager.com/g)||[]).length,1);
});
test('all four request surfaces track only after successful backend response; no server Telegram changes',async()=>{
 for(const path of ['../src/components/QuickPurchaseRequestModal.js','../src/components/CheckoutModal.js','../src/app/product/[id]/ProductClient.js','../src/app/profile/page.js']){const s=await source(path);const success=s.indexOf('if (!response.ok)',s.indexOf("fetch('/api/purchase-requests'"));const call=s.indexOf('trackLeadCreated(',s.indexOf('const payload = await response.json()'));if(path.endsWith('CheckoutModal.js'))assert.match(s,/else trackLeadCreated\(result.data, 'checkout_request'\)/);else assert.ok(call>success&&success>0,path);}
});

 test('owner QA opt-out suppresses events before initialization or navigation',()=>{reset();storage.set('dubaikharid_analytics_opt_out','1');assert.equal(analytics.trackWhatsAppClick('footer'),false);assert.equal(window.dataLayer.length,0);storage.clear();});

test('exported event boundary cannot send arbitrary form/WhatsApp free text or nested PII',()=>{
 reset();assert.equal(analytics.trackEvent('whatsapp_click',{link_location:'PRIVATE_PHONE'}),false);assert.equal(analytics.trackEvent('lead_created',{form_name:'PRIVATE_NAME'}),false);
 analytics.trackEvent('view_cart',{items:[{item_id:'p',item_name:'Product',phone:'PRIVATE_PHONE',email:'PRIVATE_EMAIL'}],email:'PRIVATE_EMAIL'});assert.doesNotMatch(JSON.stringify(lastEvent()),/PRIVATE|email|phone/);
});
