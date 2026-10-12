import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createLeadNotifier, scheduleNewLead } from '../src/lib/leadNotifications/delivery.js';
import { leadConfiguration, normalizeLeadGroupId, LEAD_SETTING_KEYS } from '../src/lib/leadNotifications/domain.js';
import { buildLeadTelegramMessage } from '../src/lib/leadNotifications/message.js';
import { persistedLeadEvent } from '../src/lib/leadNotifications/events.js';
import { defaultSettings, validateSettingValue, PUBLIC_SETTING_KEYS } from '../src/lib/settingsSchema.js';
import { telegramConfiguration } from '../src/lib/telegram/domain.js';

const load = source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const clientSource = readFileSync('src/lib/telegram/client.js','utf8').replace("import 'server-only';", '').replace("'../leadNotifications/domain.js'", JSON.stringify(pathToFileURL(process.cwd()+'/src/lib/leadNotifications/domain.js').href)).replace("'./domain.js'", JSON.stringify(pathToFileURL(process.cwd()+'/src/lib/telegram/domain.js').href));
const { createTelegramClient } = await load(clientSource);

const env={VERCEL_ENV:'production',TELEGRAM_ALLOW_SEND:'true',TELEGRAM_BOT_TOKEN:'fake-token'};
const settings={telegramLeadEnabled:true,telegramLeadChatId:'-100123456789',telegramChannel:'@dubaikharid'};
const event={type:'purchase_request',customerName:'خریدار',phone:'+989171234567',product:'کیف',productUrl:'https://example.test/bag',message:'قیمت نهایی؟',createdAt:'2026-10-13T00:00:00Z'};
function harness(overrides={}) {
 const calls=[],outcomes=[];
 const notify=createLeadNotifier({getSettings:async()=>settings,env,telegram:{sendLeadGroup:async(id,message)=>calls.push({id,message})},recordOutcome:async result=>outcomes.push(result),...overrides});
 return {notify,calls,outcomes};
}
test('lead settings default off, stay private, reject tokens and support negative group IDs',()=>{
 assert.equal(defaultSettings().telegramLeadEnabled,false);
 for(const key of LEAD_SETTING_KEYS)assert.ok(!PUBLIC_SETTING_KEYS.includes(key));
 assert.ok(validateSettingValue('TELEGRAM_BOT_TOKEN','secret').error);
 for(const good of ['-100123456789','-123',' -4503599627370495 '])assert.equal(normalizeLeadGroupId(good),good.trim());
 for(const bad of ['@dubaikharid','123456789','0','-0','-0123','-4503599627370496','-1e9',{},null])assert.equal(normalizeLeadGroupId(bad),null);
 assert.equal(validateSettingValue('telegramLeadChatId',' -100123456789 ').value,settings.telegramLeadChatId);
});
for(const type of ['contact','purchase_request','order'])test(type+' lead reaches only the configured group',async()=>{
 const h=harness();await h.notify({...event,type});assert.equal(h.calls.length,1);assert.equal(h.calls[0].id,settings.telegramLeadChatId);assert.ok(!JSON.stringify(h.calls).includes('@dubaikharid'));
});
test('disabled, missing credentials, invalid ID and all nonproduction environments block transport',async()=>{
 for(const [change,environment,code] of [
  [{telegramLeadEnabled:false},env,'TELEGRAM_LEAD_DISABLED'],
  [settings,{...env,TELEGRAM_ALLOW_SEND:'false'},'TELEGRAM_ENVIRONMENT_BLOCKED'],
  [settings,{...env,TELEGRAM_ALLOW_SEND:undefined},'TELEGRAM_ENVIRONMENT_BLOCKED'],
  [settings,{...env,VERCEL_ENV:'preview'},'TELEGRAM_ENVIRONMENT_BLOCKED'],
  [settings,{...env,VERCEL_ENV:'development'},'TELEGRAM_ENVIRONMENT_BLOCKED'],
  [settings,{...env,TELEGRAM_BOT_TOKEN:''},'TELEGRAM_NOT_CONFIGURED'],
  [{telegramLeadChatId:'@dubaikharid'},env,'TELEGRAM_PRIVATE_GROUP_REQUIRED']]) {
   const h=harness({getSettings:async()=>({...settings,...change}),env:environment});assert.equal((await h.notify(event)).code,code);assert.equal(h.calls.length,0);
 }
});
test('provider/storage/logging failures never reject customer notification and are sanitized',async()=>{
 for(const overrides of [
 {telegram:{sendLeadGroup:async()=>{throw new Error('token secret')}}},
 {getSettings:async()=>{throw new Error('database secret')}}]) {
  const h=harness(overrides);assert.equal((await h.notify(event)).status,'FAILED');assert.ok(!JSON.stringify(h.outcomes).includes('secret'));assert.ok(!JSON.stringify(h.outcomes).includes(event.customerName));
 }
 await assert.doesNotReject(harness({recordOutcome:async()=>{throw new Error('log')}}).notify(event));
});
function groupClient(chat={id:Number(settings.telegramLeadChatId),type:'supergroup',permissions:{can_send_messages:true}},member={status:'member'},failure=false) {
 const calls=[];const client=createTelegramClient({token:'fake',fetchImpl:async(url,options)=>{
  const method=url.split('/').at(-1);calls.push({method,body:JSON.parse(options.body)});
  if(failure&&method==='sendMessage')throw new Error('token secret');
  return {ok:true,json:async()=>({ok:true,result:method==='getChat'?chat:method==='getMe'?{id:123,is_bot:true}:method==='getChatMember'?member:{message_id:7}})};
 }});return {client,calls};
}
test('group verification sends nothing; lead send verifies and sends exactly once with locked destination',async()=>{
 const h=groupClient();assert.deepEqual(await h.client.verifyLeadGroup(settings.telegramLeadChatId),{connected:true,privateGroup:true,canSend:true});
 assert.deepEqual(h.calls.map(c=>c.method),['getChat','getMe','getChatMember']);h.calls.length=0;
 await h.client.sendLeadGroup(settings.telegramLeadChatId,{...buildLeadTelegramMessage(event),chat_id:'@dubaikharid'});
 assert.deepEqual(h.calls.map(c=>c.method),['getChat','getMe','getChatMember','sendMessage']);assert.equal(h.calls.at(-1).body.chat_id,settings.telegramLeadChatId);
});
for(const change of [{type:'channel'},{type:'private'},{username:'public'},{active_usernames:['public']},{linked_chat_id:-123},{is_direct_messages:true},{id:-123}])
test('refuse public/channel/wrong chat before sending: '+JSON.stringify(change),async()=>{
 const h=groupClient({id:Number(settings.telegramLeadChatId),type:'supergroup',...change});
 await assert.rejects(h.client.sendLeadGroup(settings.telegramLeadChatId,buildLeadTelegramMessage(event)),{code:'TELEGRAM_PRIVATE_GROUP_REQUIRED'});assert.deepEqual(h.calls.map(c=>c.method),['getChat']);
});
test('invalid group ID triggers no network and blocked membership refuses sends',async()=>{
 const h=groupClient();await assert.rejects(h.client.sendLeadGroup('@dubaikharid',{}));assert.equal(h.calls.length,0);
 for(const member of [{status:'left'},{status:'kicked'},{status:'restricted',is_member:false,can_send_messages:true},{status:'restricted',is_member:true,can_send_messages:false}]) {
  const h=groupClient(undefined,member);await assert.rejects(h.client.sendLeadGroup(settings.telegramLeadChatId,{}),{code:'TELEGRAM_FORBIDDEN'});assert.ok(!h.calls.some(c=>c.method==='sendMessage'));
 }
});
test('basic private group and administrator without default send permission are supported',async()=>{
 for(const [type,member] of [['group',{status:'member'}],['supergroup',{status:'administrator'}]]) {
 const h=groupClient({id:Number(settings.telegramLeadChatId),type,permissions:{can_send_messages:type==='group'}},member);
 await h.client.sendLeadGroup(settings.telegramLeadChatId,buildLeadTelegramMessage(event));assert.equal(h.calls.at(-1).method,'sendMessage');
 }
});
test('uncertain send never retries or exposes token',async()=>{
 const h=groupClient(undefined,undefined,true);await assert.rejects(h.client.sendLeadGroup(settings.telegramLeadChatId,buildLeadTelegramMessage(event)),{code:'TELEGRAM_DELIVERY_UNCERTAIN'});assert.equal(h.calls.filter(c=>c.method==='sendMessage').length,1);
});
test('Product publishing uses channel even when private lead settings are enabled',async()=>{
  const config=telegramConfiguration({...settings,telegramEnabled:true},env);
  assert.equal(config.channel,'@dubaikharid');assert.ok(!JSON.stringify(config).includes(settings.telegramLeadChatId));
  const calls=[];const client=createTelegramClient({token:'fake',fetchImpl:async (_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true,result:{message_id:1}})};}});
  await client.sendProductPost(config.channel,{text:'product',parse_mode:'HTML'});
  assert.equal(calls[0].chat_id,'@dubaikharid');assert.ok(!JSON.stringify(calls).includes(settings.telegramLeadChatId));
});
test('message escapes HTML, rejects unsafe links, and optional fields are omitted',()=>{
  const message=buildLeadTelegramMessage({...event,customerName:'<b>A&B</b>',productUrl:'javascript:alert(1)',adminUrl:'https://user:password@example.test'});
  assert.ok(message.text.includes('&lt;b&gt;A&amp;B&lt;/b&gt;'));assert.ok(!message.text.includes('javascript:'));assert.ok(!message.text.includes('password'));
  assert.ok(!message.text.includes('undefined'));assert.ok(!buildLeadTelegramMessage({type:'contact'}).text.includes('شماره:'));
  const huge=Object.fromEntries(Object.keys(event).map(key=>[key,'<&"'.repeat(2000)]));
  huge.type='contact';assert.ok(buildLeadTelegramMessage(huge).text.length<=4096);

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
test('configuration returned to Admin contains no credentials',()=>{
  const text=JSON.stringify(leadConfiguration(settings,env));assert.ok(!text.includes('fake-token'));assert.ok(!text.includes('ACCESS_TOKEN'));
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
  for(const body of [{action:'test'}, {action:'test',confirm:true,chatId:'111111'}, {action:'invalid'}]) assert.equal((await route.POST(req(body))).status,400);
  assert.equal((await route.POST(req({action:'test',confirm:true},'https://attacker.test'))).status,403);assert.equal(calls,0);
  const response=await route.POST(req({action:'test',confirm:true}));assert.equal(response.status,422);assert.ok(!(await response.text()).includes('secret-token'));assert.equal(calls,1);
  const config=await (await route.GET(new Request('https://example.test'))).text();assert.ok(!config.includes(env.TELEGRAM_BOT_TOKEN));
});
for(const type of ['order','purchase_request']) test(`${type} actual customer handler accepts lead despite Telegram failure and replay never schedules twice`,async()=>{
  const tasks=[];let created=true,sends=0;
  const notify=createLeadNotifier({getSettings:async()=>settings,env,
    telegram:{sendLeadGroup:async()=>{sends++;throw new Error('secret')}}});
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
  await assert.doesNotReject(tasks[0]());assert.equal(sends,1);
  created=false;assert.equal((await route.POST(req())).status,200);assert.equal(tasks.length,1);
});

test('notifier uses real group verification client, never creates product publication, and accepts safe group delivery',async()=>{
 const h=groupClient();
 const notify=createLeadNotifier({getSettings:async()=>settings,env,telegram:h.client});
 assert.equal((await notify(event)).status,'ACCEPTED');
 const send=h.calls.filter(call=>call.method==='sendMessage');assert.equal(send.length,1);assert.equal(send[0].body.chat_id,settings.telegramLeadChatId);
 assert.ok(!JSON.stringify(send).includes('@dubaikharid'));
});
test('read-only Admin is forbidden from group verify/test before touching Telegram',async()=>{
 const route=await routeWithDependencies('src/app/api/admin/lead-notifications/route.js',{
  'next/server':next,'@/lib/adminPermissions':permissions,
  '@/lib/adminApiAuth':{authorizeAdminApiRequest:async(_req,permission)=>{assert.equal(permission,'edit');return {response:Response.json({error:'Forbidden'},{status:403})};}},
  '@/lib/adminActivity':{logAdminActivity:async()=>assert.fail('audit not expected')},
  '@/lib/leadNotifications/service':{ownerLeadTestAction:async()=>assert.fail('send not expected')},
  '@/lib/leadNotifications/domain':await import('../src/lib/leadNotifications/domain.js'),
 });
 for(const action of ['verify','test'])assert.equal((await route.POST(new Request('https://example.test/api/admin/lead-notifications',{method:'POST',body:JSON.stringify({action,confirm:true})}))).status,403);
});
