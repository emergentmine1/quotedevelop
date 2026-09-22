export const SHIPPING_MODE_OPTIONS = [
  {
	id: 'air',
	name: 'Air',
	description: 'Fastest global transit for urgent cargo',
	eta: '3-9 days',
	icon: 'plane',
	enabled: true,
	portDataset: 'airports',
  },
];

export const CARGO_TYPE_OPTIONS = [
  {
	id: 'packages',
	name: 'Packages & Pallets',
	description: 'Per-unit dimensions and weight',
	icon: 'boxes',
	enabled: true,
	entryMode: 'unit',
  },
];

export const CALCULATION_METHODS = [
  { id: 'per-unit', label: 'Per Unit' },
  { id: 'total', label: 'Total Shipment' },
];

export const PACKAGE_TYPE_OPTIONS = [
  'Boxes/Crates',
  'Pallets',
  'Drums',
  'Bags',
  'Rolls',
  'Cases',
];

export const CONTAINER_TYPE_OPTIONS = [
  '20GP',
  '40GP',
  '40HQ',
  '45HQ',
  '20RF',
  '40RF',
  '20OT',
  '40OT',
];
