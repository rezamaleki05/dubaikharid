export const emptyLaptopForm = () => ({
  brand: '', series: '', model: '', displayNameFa: '', displayNameEn: '', serial: '',
  cpu: '', ram: '', storageSize: '', storageType: '', storage2Size: '', storage2Type: 'none',
  gpu: '', screenSize: '', manufactureYear: '', color: '', batteryHealth: '', weight: '',
  buyingPrice: '', extraCosts: '0', sellingPrice: '', internalNotes: '', customerNotes: '',
  hardwareTests: { keyboard: false, speaker: false, display: false, usb: false, battery: false, wifi: false, camera: false, charge: false },
  accessories: { charger: false, box: false }, physicalStatus: 'good', stockStatus: 'available',
  dateEntered: '', internalSku: '', warrantyDays: '', warrantyExpiry: '', lastService: '', nextService: '',
});
