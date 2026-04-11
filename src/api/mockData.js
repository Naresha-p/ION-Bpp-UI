/**
 * Mock Beckn API responses — mirrors real on_search / on_confirm callbacks
 * Used when VITE_DEMO_MODE=true or network is unreachable
 */

export const mockProvider = {
  id:          'WBNDG123467',
  descriptor:  { name: 'Warung Sumber Rezeki', short_desc: 'Toko kebutuhan sehari-hari', images: [] },
  rating:      '4.2',
  locations: [{
    id: 'LOC1',
    gps: '-6.9175,107.6191',
    address: { street: 'Jl. Sukajadi No. 10', city: 'Bandung', state: 'West Java', country: 'IDN' },
  }],
  tags: [{ code: 'serviceability', list: [{ code: 'radius', value: '10' }] }],
}

export const mockCatalog = {
  descriptor: { name: 'ION Catalog' },
  providers: [mockProvider],
}

export const mockItems = [
  {
    id: 'ITEM001', provider_id: 'WBNDG123467',
    descriptor: { name: 'Beras Premium 5kg', short_desc: 'Beras putih premium kualitas terbaik', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200'] },
    price: { currency: 'IDR', value: '85000', maximum_value: '90000' },
    quantity: { available: { count: 150 }, maximum: { count: 10 } },
    category_id: 'staple',
    tags: [{ code: 'origin', list: [{ code: 'state', value: 'West Java' }] }],
    rating: '4.5',
  },
  {
    id: 'ITEM002', provider_id: 'WBNDG123467',
    descriptor: { name: 'Minyak Goreng 2L', short_desc: 'Minyak goreng kelapa sawit', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200'] },
    price: { currency: 'IDR', value: '38000', maximum_value: '42000' },
    quantity: { available: { count: 80 }, maximum: { count: 5 } },
    category_id: 'cooking',
    rating: '4.3',
  },
  {
    id: 'ITEM003', provider_id: 'WBNDG123467',
    descriptor: { name: 'Gula Pasir 1kg', short_desc: 'Gula pasir putih halus', images: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=200'] },
    price: { currency: 'IDR', value: '16000', maximum_value: '18000' },
    quantity: { available: { count: 200 }, maximum: { count: 20 } },
    category_id: 'staple',
    rating: '4.6',
  },
  {
    id: 'ITEM004', provider_id: 'WBNDG123467',
    descriptor: { name: 'Tepung Terigu 1kg', short_desc: 'Tepung terigu protein sedang', images: [] },
    price: { currency: 'IDR', value: '12500', maximum_value: '14000' },
    quantity: { available: { count: 120 }, maximum: { count: 10 } },
    category_id: 'baking',
    rating: '4.1',
  },
  {
    id: 'ITEM005', provider_id: 'WBNDG123467',
    descriptor: { name: 'Kecap Manis 600ml', short_desc: 'Kecap manis premium', images: [] },
    price: { currency: 'IDR', value: '22000', maximum_value: '25000' },
    quantity: { available: { count: 60 }, maximum: { count: 6 } },
    category_id: 'condiment',
    rating: '4.7',
  },
  {
    id: 'ITEM006', provider_id: 'WBNDG123467',
    descriptor: { name: 'Sabun Cuci Piring 750ml', short_desc: 'Cairan pembersih piring', images: [] },
    price: { currency: 'IDR', value: '18000', maximum_value: '20000' },
    quantity: { available: { count: 45 }, maximum: { count: 12 } },
    category_id: 'household',
    rating: '4.4',
  },
]

export const mockOrders = [
  {
    id: 'ORD-20240410-001',
    transaction_id: 'txn-abc-001',
    state: 'In-progress',
    beckn_state: 'ORDER-DELIVERED',
    provider: { id: 'WBNDG123467', descriptor: { name: 'Warung Sumber Rezeki' } },
    items: [
      { id: 'ITEM001', descriptor: { name: 'Beras Premium 5kg' }, quantity: { count: 2 }, price: { value: '85000', currency: 'IDR' } },
    ],
    billing: { name: 'Andi Prasetyo', phone: '08123456789', email: 'andi@email.com', address: { city: 'Bandung' } },
    fulfillment: {
      id: 'F001', type: 'Delivery', state: { descriptor: { code: 'Order-delivered' } },
      tracking: true,
      start: { location: { address: { city: 'Bandung' } }, time: { timestamp: '2024-04-10T08:00:00Z' } },
      end:   { location: { address: { city: 'Bandung' } }, time: { timestamp: '2024-04-10T12:00:00Z' } },
    },
    quote: { price: { currency: 'IDR', value: '175000' }, breakup: [
      { title: 'Beras Premium 5kg x2', price: { value: '170000' } },
      { title: 'Delivery Charges',      price: { value: '5000'   } },
    ]},
    payment: { type: 'PRE-FULFILLMENT', status: 'PAID', params: { amount: '175000', currency: 'IDR' } },
    created_at: '2024-04-10T08:00:00Z',
    updated_at: '2024-04-10T12:30:00Z',
  },
  {
    id: 'ORD-20240410-002',
    transaction_id: 'txn-abc-002',
    state: 'Active',
    beckn_state: 'ORDER-PICKED-UP',
    provider: { id: 'WBNDG123467', descriptor: { name: 'Warung Sumber Rezeki' } },
    items: [
      { id: 'ITEM002', descriptor: { name: 'Minyak Goreng 2L' }, quantity: { count: 3 }, price: { value: '38000', currency: 'IDR' } },
      { id: 'ITEM003', descriptor: { name: 'Gula Pasir 1kg'   }, quantity: { count: 2 }, price: { value: '16000', currency: 'IDR' } },
    ],
    billing: { name: 'Siti Rahayu', phone: '08234567890', email: 'siti@email.com', address: { city: 'Bandung' } },
    fulfillment: {
      id: 'F002', type: 'Delivery', state: { descriptor: { code: 'Order-picked-up' } },
      tracking: true,
    },
    quote: { price: { currency: 'IDR', value: '150000' }, breakup: [
      { title: 'Minyak Goreng 2L x3', price: { value: '114000' } },
      { title: 'Gula Pasir 1kg x2',   price: { value: '32000'  } },
      { title: 'Delivery Charges',     price: { value: '4000'   } },
    ]},
    payment: { type: 'PRE-FULFILLMENT', status: 'PAID', params: { amount: '150000', currency: 'IDR' } },
    created_at: '2024-04-10T09:00:00Z',
    updated_at: '2024-04-10T11:00:00Z',
  },
  {
    id: 'ORD-20240410-003',
    transaction_id: 'txn-abc-003',
    state: 'Active',
    beckn_state: 'ORDER-CONFIRMED',
    provider: { id: 'WBNDG123467', descriptor: { name: 'Warung Sumber Rezeki' } },
    items: [
      { id: 'ITEM005', descriptor: { name: 'Kecap Manis 600ml' }, quantity: { count: 4 }, price: { value: '22000', currency: 'IDR' } },
    ],
    billing: { name: 'Budi Santoso', phone: '08345678901', email: 'budi@email.com', address: { city: 'Bandung' } },
    fulfillment: {
      id: 'F003', type: 'Delivery', state: { descriptor: { code: 'Order-confirmed' } },
      tracking: false,
    },
    quote: { price: { currency: 'IDR', value: '93000' }, breakup: [
      { title: 'Kecap Manis 600ml x4', price: { value: '88000' } },
      { title: 'Delivery Charges',      price: { value: '5000'  } },
    ]},
    payment: { type: 'PRE-FULFILLMENT', status: 'PAID', params: { amount: '93000', currency: 'IDR' } },
    created_at: '2024-04-10T10:00:00Z',
    updated_at: '2024-04-10T10:05:00Z',
  },
]

export const mockStats = {
  activeProducts: 195,
  newOrders:      12,
  ordersShipped:  8,
  totalOrders:    325,
  revenue:        { today: 4250000, month: 87500000 },
  rating:         { average: 4.2, count: 215 },
}

export const mockCategories = [
  { id: 'staple',    name: 'Staple Foods',  count: 45 },
  { id: 'cooking',   name: 'Cooking',        count: 38 },
  { id: 'baking',    name: 'Baking',         count: 22 },
  { id: 'condiment', name: 'Condiments',     count: 31 },
  { id: 'household', name: 'Household',      count: 28 },
  { id: 'snacks',    name: 'Snacks',         count: 31 },
]

export const BECKN_ORDER_STATES = {
  'ORDER-CONFIRMED':  { label: 'Confirmed',   color: 'blue'   },
  'ORDER-PICKED-UP':  { label: 'Picked Up',   color: 'yellow' },
  'ORDER-DELIVERED':  { label: 'Delivered',   color: 'green'  },
  'ORDER-CANCELLED':  { label: 'Cancelled',   color: 'red'    },
  'ORDER-RETURNED':   { label: 'Returned',    color: 'gray'   },
}
