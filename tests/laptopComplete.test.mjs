import test from 'node:test';
import assert from 'node:assert/strict';
import { laptopPath } from '../src/lib/laptopUrl.js';
import { buildLaptopModelGroups, publicImageList, resolveLaptopModelSlug, searchLaptopModelGroups } from '../src/lib/laptopSeoDomain.js';
import { suggestedLaptopNames, laptopDisplayName, changeLaptopIdentity } from '../src/lib/laptopIdentity.js';
const unit={id:'laptop-5530',brand:'Dell',series:'Precision',model:'5530',status:'AVAILABLE',priceToman:'110000000',cpu:'Core i7',gpu:'Quadro',displayNameFa:'لپ تاپ استوک دل پرسیژن 5530',displayNameEn:'Dell Precision 5530',image:'https://example.com/cover.jpg',images:['https://example.com/cover.jpg','https://example.com/two.jpg','https://example.com/three.jpg','https://example.com/four.jpg'],updatedAt:new Date()};
for (const [brand,series,model,slug] of [['Dell','Precision','5530','dell-precision-5530'],['Dell','Precision','7510','dell-precision-7510'],['Lenovo','ThinkPad','P53','lenovo-thinkpad-p53'],['MSI','','Katana 15 B13V','msi-katana-15-b13v']]) test(`canonical identity ${slug}`,()=>assert.equal(laptopPath({brand,series,model}),'/laptops/'+slug));
test('same unit and group resolve to one detail path, independent of title',()=>{
 const [group]=buildLaptopModelGroups([unit]);assert.equal(laptopPath(unit),laptopPath(group));assert.equal(laptopPath({...unit,name:'arbitrary title'}),laptopPath(unit));
});
for(const query of ['Dell Precision 5530','Precision 5530','5530','دل پرسیژن 5530','Core i7','Quadro'])test(`bilingual/spec search ${query}`,()=>assert.equal(searchLaptopModelGroups(buildLaptopModelGroups([unit]),query)[0]?.units[0].id,unit.id));
test('legacy slug resolves only unambiguously and canonical target wins',()=>{
 const groups=buildLaptopModelGroups([{...unit,previousModelSlugs:['old-slug']}]);assert.equal(resolveLaptopModelSlug(groups,'old-slug').slug,'dell-precision-5530');assert.equal(resolveLaptopModelSlug([...groups,{...groups[0],slug:'other'}],'old-slug'),null);
});
for(const status of ['INACTIVE','SOLD','RESERVED'])test(`nonpublic ${status} excluded`,()=>assert.deepEqual(buildLaptopModelGroups([{...unit,status}]),[]));
test('archived, reserved and unpriced units excluded',()=>{for(const patch of [{archivedAt:new Date()},{reservedOrderId:'order'},{priceToman:'0'}])assert.deepEqual(buildLaptopModelGroups([{...unit,...patch}]),[])});
test('full gallery serializes all four in stable cover-first order without duplicates',()=>{
 const [group]=buildLaptopModelGroups([{...unit,images:[...unit.images,unit.images[1]]}]);assert.deepEqual(group.images,unit.images);assert.equal(group.image,unit.images[0]);assert.deepEqual(group.units[0].images,unit.images);
});
test('single image and missing image remain compatible',()=>{assert.deepEqual(publicImageList({image:'x',images:[]}),['x']);assert.deepEqual(publicImageList({}),[])});
test('manual bilingual names remain unchanged across identity change',()=>{const x=changeLaptopIdentity({...unit}, {model:'7510'},{displayNameFa:true,displayNameEn:true});assert.equal(x.displayNameFa,unit.displayNameFa);assert.equal(x.displayNameEn,unit.displayNameEn);assert.equal(laptopDisplayName(x),unit.displayNameFa);assert.equal(suggestedLaptopNames(unit).displayNameEn,'Dell Precision 5530')});
test('tri-state display specs survive public serialization',()=>{for(const isTouchscreen of [true,false,null]){const [g]=buildLaptopModelGroups([{...unit,isTouchscreen,displayResolution:'2560×1600'}]);assert.equal(g.units[0].isTouchscreen,isTouchscreen);assert.equal(g.units[0].displayResolution,'2560×1600')}});
