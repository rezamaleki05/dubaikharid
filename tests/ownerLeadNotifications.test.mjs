import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createOwnerLeadNotifier, scheduleNewLead } from '../src/lib/leadNotifications/delivery.js';
import { leadConfiguration, normalizePrivateChatId, normalizeLeadRecipient, LEAD_SETTING_KEYS } from '../src/lib/leadNotifications/domain.js';
import { buildLeadTelegramMessage, buildLeadWhatsappParameters } from '../src/lib/leadNotifications/message.js';
import { persistedLeadEvent } from '../src/lib/leadNotifications/events.js';
import { defaultSettings, validateSettingValue, PUBLIC_SETTING_KEYS } from '../src/lib/settingsSchema.js';
import { telegramConfiguration } from '../src/lib/telegram/domain.js';

const load = source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const clientSource = readFileSync('src/lib/telegram/client.js','utf8').replace("import 'server-only';", '').replace("'./domain.js'", JSON.stringify(pathToFileURL(process.cwd()+'/src/lib/telegram/domain.js').href));
const { createTelegramClient } = await load(clientSource);
const { createWhatsappLeadClient } = await load(readFileSync('src/lib/leadNotifications/whatsapp.js','utf8').replace("import 'server-only';", ''));
const env = { VERCEL_ENV:'production', TELEGRAM_ALLOW_SEND:'true', TELEGRAM_BOT_TOKEN:'fake-token',
  WHATSAPP_ALLOW_SEND:'true', WHATSAPP_CLOUD_ACCESS_TOKEN:'fake-wa-token', WHATSAPP_PHONE_NUMBER_ID:'123456', WHATSAPP_GRAPH_API_VERSION:'v23.0' };
const settings = { telegramLeadsEnabled:true, telegramLeadChatId:'123456789', telegramChannel:'@dubaikharid',
  whatsappLeadsEnabled:true, whatsappLeadRecipient:'+971527556964', whatsappLeadTemplate:'owner_lead', whatsappLeadTemplateLanguage:'fa' };
const event = { type:'purchase_request', customerName:'خریدار', phone:'+989171234567', product:'کیف',
  productUrl:'https://example.test/product', message:'قیمت نهایی؟', createdAt:'2026-10-12T00:00:00Z' };
function harness(overrides={}) {
  const calls=[], outcomes=[];
  const notify=createOwnerLeadNotifier({ getSettings:async()=>settings, env,
    telegram:{sendPrivateLead:async (id,message)=>{calls.push({provider:'telegram',id,message});}},
    whatsapp:{sendTemplate:async (config,parameters)=>{calls.push({provider:'whatsapp',config,parameters});}},
    recordOutcome:async result=>outcomes.push(result), ...overrides });
  return { notify,calls,outcomes };
}
test('lead settings default off, remain private, and reject secret keys',()=>{
  const defaults=defaultSettings();
  assert.equal(defaults.telegramLeadsEnabled,false);assert.equal(defaults.whatsappLeadsEnabled,false);
  for(const key of LEAD_SETTING_KEYS) assert.ok(!PUBLIC_SETTING_KEYS.includes(key));
  for(const key of ['TELEGRAM_BOT_TOKEN','WHATSAPP_CLOUD_ACCESS_TOKEN','WHATSAPP_PHONE_NUMBER_ID']) assert.ok(validateSettingValue(key,'secret').error);
});
test('private Chat ID refuses public channels, groups, usernames and malformed input',()=>{
  assert.equal(normalizePrivateChatId(' 123456789 '),'123456789');
  for(const bad of ['@dubaikharid','-100123456789','-123456','0','1e9','4503599627370496',{},null]) assert.equal(normalizePrivateChatId(bad),null);
  assert.equal(validateSettingValue('telegramLeadChatId',' 123456789 ').value,'123456789');
  assert.ok(validateSettingValue('telegramLeadChatId','@dubaikharid').error);
});
test('owner phone normalizes international formatted and Persian digits without support fallback',()=>{
  for(const value of ['+971 52 755 6964','00971-52-755-6964','+۹۷۱۵۲۷۵۵۶۹۶۴']) assert.equal(normalizeLeadRecipient(value),'+971527556964');
  for(const bad of ['09171234567','not-phone',null]) assert.equal(normalizeLeadRecipient(bad),null);
  assert.equal(validateSettingValue('whatsappLeadRecipient','+971 52 755 6964').value,'+971527556964');
  assert.equal(validateSettingValue('whatsappLeadRecipient','').value,'');
});
for(const type of ['contact','purchase_request','order']) test(`${type} event delivers to owner DM only`,async()=>{
  const h=harness();await h.notify({...event,type});
  assert.equal(h.calls[0].id,settings.telegramLeadChatId);
  assert.ok(!JSON.stringify(h.calls).includes('@dubaikharid'));
  assert.equal(h.calls[1].parameters.length,8);
});
test('Product publishing uses channel even when private lead settings are enabled',async()=>{
  const config=telegramConfiguration({...settings,telegramEnabled:true},env);
  assert.equal(config.channel,'@dubaikharid');assert.ok(!JSON.stringify(config).includes(settings.telegramLeadChatId));
  const calls=[];const client=createTelegramClient({token:'fake',fetchImpl:async (_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true,result:{message_id:1}})};}});
  await client.sendProductPost(config.channel,{text:'product',parse_mode:'HTML'});
  assert.equal(calls[0].chat_id,'@dubaikharid');assert.ok(!JSON.stringify(calls).includes(settings.telegramLeadChatId));
});
test('disabled providers make no transport call',async()=>{
  const h=harness({getSettings:async()=>({...settings,telegramLeadsEnabled:false,whatsappLeadsEnabled:false})});
  const result=await h.notify(event);assert.equal(h.calls.length,0);assert.equal(result.telegram.code,'TELEGRAM_DISABLED');assert.equal(result.whatsapp.code,'WHATSAPP_DISABLED');
});
test('WhatsApp unconfigured does not block Telegram',async()=>{
  const h=harness({env:{...env,WHATSAPP_CLOUD_ACCESS_TOKEN:''}});const result=await h.notify(event);
  assert.equal(result.whatsapp.code,'WHATSAPP_NOT_CONFIGURED');assert.equal(result.telegram.status,'ACCEPTED');assert.equal(h.calls.length,1);
});
test('template and API version required; free-form outbound is never used',()=>{
  for(const change of [{whatsappLeadTemplate:''},{whatsappLeadTemplateLanguage:'invalid-locale'}]) assert.equal(leadConfiguration({...settings,...change},env).whatsapp.code,'WHATSAPP_NOT_CONFIGURED');
  assert.equal(leadConfiguration(settings,{...env,WHATSAPP_GRAPH_API_VERSION:''}).whatsapp.code,'WHATSAPP_NOT_CONFIGURED');
});
test('strict send gates block local/preview and explicitly disabled Production',async()=>{
  for(const VERCEL_ENV of ['preview','development',undefined]) {
    const h=harness({env:{...env,VERCEL_ENV}});await h.notify(event);assert.equal(h.calls.length,0);
  }
  const h=harness({env:{...env,TELEGRAM_ALLOW_SEND:'false',WHATSAPP_ALLOW_SEND:'false'}});await h.notify(event);assert.equal(h.calls.length,0);
});
for(const failed of ['telegram','whatsapp','both']) test(`${failed} failure is isolated and sanitized`,async()=>{
  const broken=async()=>{throw new Error('Authorization: fake-token https://secret-provider/error')};
  const options={};if(failed!=='whatsapp')options.telegram={sendPrivateLead:broken};if(failed!=='telegram')options.whatsapp={sendTemplate:broken};
  const h=harness(options);const result=await h.notify(event);
  if(failed==='telegram')assert.equal(result.whatsapp.status,'ACCEPTED');
  if(failed==='whatsapp')assert.equal(result.telegram.status,'ACCEPTED');
  assert.ok(!JSON.stringify(h.outcomes).includes('fake-token'));
  assert.ok(!JSON.stringify(h.outcomes).includes(event.customerName));
  assert.ok(!JSON.stringify(result).includes('https://'));
});
test('message escapes HTML, rejects unsafe links, and optional fields are omitted',()=>{
  const message=buildLeadTelegramMessage({...event,customerName:'<b>A&B</b>',productUrl:'javascript:alert(1)',adminUrl:'https://user:password@example.test'});
  assert.ok(message.text.includes('&lt;b&gt;A&amp;B&lt;/b&gt;'));assert.ok(!message.text.includes('javascript:'));assert.ok(!message.text.includes('password'));
  assert.ok(!message.text.includes('undefined'));assert.ok(!buildLeadTelegramMessage({type:'contact'}).text.includes('شماره:'));
  const huge=Object.fromEntries(Object.keys(event).map(key=>[key,'<&"'.repeat(2000)]));
  huge.type='contact';assert.ok(buildLeadTelegramMessage(huge).text.length<=4096);
  assert.equal(buildLeadWhatsappParameters({type:'test'}).length,8);
});
test('persisted Product enquiry and Order use actual fields, safe Admin links and no payment secrets',()=>{
  const enquiry=persistedLeadEvent('purchase_request',{customer:{name:'Owner',phone:'123'},productName:'Bag',quantity:2,priceAed:50,createdAt:new Date(),productUrl:event.productUrl},'https://example.test');
  assert.equal(enquiry.amountAed,50);assert.equal(enquiry.product,'Bag × 2');assert.equal(enquiry.adminUrl,'https://example.test/admin/leads');
  const order=persistedLeadEvent('order',{customerNameSnapshot:'Buyer',orderCode:'ORD-123',totalToman:500,items:[{name:'Laptop',quantity:1}],payments:[{secret:'secret'}],createdAt:new Date()},'https://example.test');
  assert.equal(order.product,'Laptop × 1');assert.equal(order.orderId,'ORD-123');assert.ok(!JSON.stringify(order).includes('secret'));
});
test('only a newly committed event schedules, duplicate/replayed event skips',async()=>{
  const tasks=[];let sends=0;const deps={after:fn=>tasks.push(fn),run:async()=>{sends++}};
  assert.equal(scheduleNewLead({created:true,type:'order',id:'record'},deps),true);
  assert.equal(scheduleNewLead({created:false,type:'order',id:'record'},deps),false);
  assert.equal(scheduleNewLead({created:true,type:'unsupported',id:'record'},deps),false);
  await Promise.all(tasks.map(fn=>fn()));assert.equal(sends,1);
});
test('scheduler and background failures cannot escape into accepted customer submission',async()=>{
  assert.doesNotThrow(()=>scheduleNewLead({created:true,type:'order',id:'r'},{after:()=>{throw new Error('Unavailable')},run:async()=>{}}));
  let task; scheduleNewLead({created:true,type:'order',id:'r'},{after:fn=>{task=fn},run:async()=>{throw new Error('Provider failure')}});await assert.doesNotReject(task());
});
test('private Telegram checks chat type before sending; rejects group/channel without sends',async()=>{
  for(const type of ['channel','supergroup','group']) {
    const calls=[];const client=createTelegramClient({token:'fake',fetchImpl:async(url)=>{calls.push(url.split('/').at(-1));return {ok:true,json:async()=>({ok:true,result:{id:123456789,type}})};}});
    await assert.rejects(client.sendPrivateLead('123456789',buildLeadTelegramMessage(event)),{code:'TELEGRAM_PRIVATE_CHAT_REQUIRED'});assert.deepEqual(calls,['getChat']);
  }
});
test('private Telegram verify sends no message; send checks private chat then sends exactly once',async()=>{
  const calls=[];const client=createTelegramClient({token:'fake',fetchImpl:async(url,options)=>{calls.push({method:url.split('/').at(-1),body:JSON.parse(options.body)});return {ok:true,json:async()=>({ok:true,result:{id:123456789,type:'private',message_id:7}})};}});
  await client.verifyPrivateChat('123456789');assert.deepEqual(calls.map(c=>c.method),['getChat']);calls.length=0;
  await client.sendPrivateLead('123456789',buildLeadTelegramMessage(event));assert.deepEqual(calls.map(c=>c.method),['getChat','sendMessage']);assert.equal(calls[1].body.chat_id,'123456789');
  calls.length=0;await client.sendPrivateLead('123456789',{...buildLeadTelegramMessage(event),chat_id:'@dubaikharid'});assert.equal(calls[1].body.chat_id,'123456789');
});
test('WhatsApp uses official template endpoint, eight parameters and environment-only bearer',async()=>{
  const calls=[];const client=createWhatsappLeadClient({token:'fake-token',phoneNumberId:'123456',version:'v23.0',fetchImpl:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({messages:[{id:'wamid.fake'}]})};}});
  await client.sendTemplate(leadConfiguration(settings,env).whatsapp,buildLeadWhatsappParameters(event));
  assert.equal(calls[0].url,'https://graph.facebook.com/v23.0/123456/messages');
  const body=JSON.parse(calls[0].options.body);assert.equal(body.type,'template');assert.equal(body.to,'971527556964');assert.equal(body.template.components[0].parameters.length,8);
  assert.equal(calls[0].options.headers.Authorization,'Bearer fake-token');assert.ok(!calls[0].url.includes('fake-token'));
});
test('uncertain provider errors never retry or disclose original response',async()=>{
  let sends=0;const client=createWhatsappLeadClient({token:'secret',phoneNumberId:'123456',version:'v23.0',fetchImpl:async()=>{sends++;throw new Error('Bearer secret');}});
  await assert.rejects(client.sendTemplate(leadConfiguration(settings,env).whatsapp,[]),{code:'WHATSAPP_DELIVERY_UNCERTAIN'});assert.equal(sends,1);
});
test('configuration returned to Admin contains no credentials',()=>{
  const text=JSON.stringify(leadConfiguration(settings,env));assert.ok(!text.includes('fake-token'));assert.ok(!text.includes('fake-wa-token'));assert.ok(!text.includes('ACCESS_TOKEN'));
});
test('storage outage records sanitized failure and never rejects the notifier',async()=>{
  const outcomes=[];const h=harness({getSettings:async()=>{throw new Error('database secret')},recordOutcome:async result=>outcomes.push(result)});
  const result=await h.notify(event);assert.equal(result.telegram.status,'FAILED');assert.equal(outcomes.length,1);assert.ok(!JSON.stringify(outcomes).includes('database secret'));assert.equal(h.calls.length,0);
});
test('lead service cannot read product channel or create Product publication records',()=>{
  const service=readFileSync('src/lib/leadNotifications/service.js','utf8');
  assert.ok(!service.includes('telegramChannel'));assert.ok(!service.includes('telegramPublication'));
  assert.ok(!LEAD_SETTING_KEYS.includes('telegramChannel'));
  const followup=readFileSync('src/app/api/account/purchase-requests/[id]/pay/route.js','utf8');assert.ok(!followup.includes('scheduleOwnerLeadNotification'));
});

async function routeWithDependencies(path, dependencies) {
  // Execute the actual Route Handler body; only framework/auth/storage/transport boundaries are mocked.
  const source=readFileSync(path,'utf8').replace(/import\s*{([^}]+)}\s*from\s*'([^']+)';/g,
    (_,names,module)=>`const {${names}}=dependencies[${JSON.stringify(module)}];`).replace(/export /g,'');
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  return new AsyncFunction('dependencies',source+'\nreturn {POST, '+(source.includes('function GET(')?'GET':'')+'};')(dependencies);
}
const next={NextResponse:{json:(data,options={})=>Response.json(data,options)}};
const permissions={ADMIN_PERMISSIONS:{SETTINGS_VIEW:'view',SETTINGS_EDIT:'edit'}};
test('unauthorized notification GET/POST reject before settings or transports are touched',async()=>{
  const seen=[];const route=await routeWithDependencies('src/app/api/admin/lead-notifications/route.js',{
    'next/server':next,'@/lib/adminPermissions':permissions,
    '@/lib/adminApiAuth':{authorizeAdminApiRequest:async (_req,permission)=>{seen.push(permission);return {response:Response.json({error:'Unauthorized'},{status:401})};}},
    '@/lib/adminActivity':{logAdminActivity:async()=>assert.fail('audit not expected')},
    '@/lib/leadNotifications/service':{getOwnerLeadConfiguration:async()=>assert.fail('settings not expected'),ownerLeadTestAction:async()=>assert.fail('send not expected')},
    '@/lib/leadNotifications/domain':await import('../src/lib/leadNotifications/domain.js'),
  });
  const request=new Request('https://example.test/api/admin/lead-notifications');
  assert.equal((await route.GET(request)).status,401);assert.equal((await route.POST(request)).status,401);assert.deepEqual(seen,['view','edit']);
});
test('Admin test requires confirmation, saved destination only, same origin, and sanitizes errors',async()=>{
  let calls=0;
  const route=await routeWithDependencies('src/app/api/admin/lead-notifications/route.js',{
    'next/server':next,'@/lib/adminPermissions':permissions,
    '@/lib/adminApiAuth':{authorizeAdminApiRequest:async()=>({admin:{id:'admin'},response:null})},
    '@/lib/adminActivity':{logAdminActivity:async()=>{}},
    '@/lib/leadNotifications/service':{getOwnerLeadConfiguration:async()=>leadConfiguration(settings,env),ownerLeadTestAction:async()=>{calls++;throw new Error('Bearer secret-token');}},
    '@/lib/leadNotifications/domain':await import('../src/lib/leadNotifications/domain.js'),
  });
  const req=(body,origin='https://example.test')=>new Request('https://example.test/api/admin/lead-notifications',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(body)});
  for(const body of [{provider:'telegram',action:'test'}, {provider:'telegram',action:'test',confirm:true,chatId:'111111'}, {provider:'whatsapp',action:'verify'}]) assert.equal((await route.POST(req(body))).status,400);
  assert.equal((await route.POST(req({provider:'telegram',action:'test',confirm:true},'https://attacker.test'))).status,403);assert.equal(calls,0);
  const response=await route.POST(req({provider:'telegram',action:'test',confirm:true}));assert.equal(response.status,422);assert.ok(!(await response.text()).includes('secret-token'));assert.equal(calls,1);
  const config=await (await route.GET(new Request('https://example.test'))).text();assert.ok(!config.includes(env.TELEGRAM_BOT_TOKEN));
});
for(const type of ['order','purchase_request']) test(`${type} actual customer handler accepts lead despite both provider failures and replay never schedules twice`,async()=>{
  const tasks=[];let created=true,sends=0;
  const notify=createOwnerLeadNotifier({getSettings:async()=>settings,env,
    telegram:{sendPrivateLead:async()=>{sends++;throw new Error('secret')}},whatsapp:{sendTemplate:async()=>{sends++;throw new Error('secret')}}});
  const scheduling={scheduleOwnerLeadNotification:info=>scheduleNewLead(info,{after:fn=>tasks.push(fn),run:async()=>notify(event)})};
  const common={'next/server':next,'@/lib/adminActivity':{logAdminActivity:async()=>{}},
    '@/lib/customerAuth':{getCurrentCustomer:async()=>null},'@/lib/leadNotifications/service':scheduling,
    '@/lib/publicRequestGuard':{publicRequestGuard:()=>null,readIdempotencyKey:()=> 'valid-key'}};
  let route,body;
  if(type==='order') {
    const order={id:'order-1',orderCode:'ORD-1',type:'CATALOG',paymentMethod:'ONLINE',totalToman:100};
    route=await routeWithDependencies('src/app/api/orders/route.js',{...common,
      '@/lib/publicOrders':{createPublicOrder:async()=>({order,created}),serializePublicOrder:x=>x,PublicOrderError:class extends Error{}},
      '@/lib/manualPayments':{buildManualPaymentAccess:async()=>null}});body={};
  } else {
    const record={id:'request-1',requestCode:'REQ-1',customerId:'buyer',status:'pending',finalToman:null};
    const tx={purchaseRequest:{findUnique:async()=>created?null:record,create:async()=>record},
      customer:{findUnique:async()=>({id:'buyer',email:'buyer@example.test'}),update:async()=>({id:'buyer'})}};
    route=await routeWithDependencies('src/app/api/purchase-requests/route.js',{...common,
      'node:crypto':await import('node:crypto'), '@/lib/adminCustomers':{normalizeCustomerPhone:x=>x},
      '@/lib/externalUrls':{normalizeProductSourceUrl:x=>x},'@/lib/prisma':{prisma:{$transaction:fn=>fn(tx),telegramPublication:{create:()=>assert.fail('Lead must not create TelegramPublication')}}}});
    body={customer:{name:'Buyer',phone:'+989171234567'},productName:'Bag',productUrl:'https://example.test/bag',priceAed:10,weight:1};
  }
  const req=()=>new Request('https://example.test/api/'+type,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await route.POST(req())).status,201);assert.equal(tasks.length,1);
  await assert.doesNotReject(tasks[0]());assert.equal(sends,2);
  created=false;assert.equal((await route.POST(req())).status,200);assert.equal(tasks.length,1);
});
