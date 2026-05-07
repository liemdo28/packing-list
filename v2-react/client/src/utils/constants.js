export const ORDER_STATUSES = {
  DRAFT:              'draft',
  SUPPLIER_REVIEWING: 'supplier_reviewing',
  SUPPLIER_ACCEPTED:  'supplier_accepted',
  PREPARING:          'preparing',
  SHIPPING:           'shipping',
  RECEIVING_REVIEW:   'receiving_review',
  DISCREPANCY_REVIEW: 'discrepancy_review',
  COMPLETED:          'completed',
  SUPPLIER_REJECTED:  'supplier_rejected',
  CANCELLED:          'cancelled',
};

export const STATUS_LABELS = {
  draft:               'Draft',
  supplier_reviewing:  'Awaiting Supplier',
  supplier_accepted:   'Supplier Accepted',
  preparing:           'Preparing',
  shipping:            'Shipping',
  receiving_review:    'Receiving Review',
  discrepancy_review:  'Discrepancy Review',
  completed:           'Completed',
  supplier_rejected:   'Rejected by Supplier',
  cancelled:           'Cancelled',
};

export const STATUS_COLORS = {
  draft:               'bg-gray-100 text-gray-700',
  supplier_reviewing:  'bg-blue-100 text-blue-700',
  supplier_accepted:   'bg-teal-100 text-teal-700',
  preparing:           'bg-yellow-100 text-yellow-700',
  shipping:            'bg-purple-100 text-purple-700',
  receiving_review:    'bg-indigo-100 text-indigo-700',
  discrepancy_review:  'bg-amber-100 text-amber-700',
  completed:           'bg-green-100 text-green-700',
  supplier_rejected:   'bg-red-100 text-red-700',
  cancelled:           'bg-red-100 text-red-700',
};

export const ROLES = {
  ADMIN: 'admin',
  B1: 'b1',
  B2: 'b2',
  B3: 'b3',
  ACCOUNTANT: 'accountant',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  b1: 'B1 Staff',
  b2: 'B2 Staff',
  b3: 'B3 Staff',
  accountant: 'Accountant',
};

export const TRANSFER_RULES = [
  { from: 'B1', to: 'B2' },
  { from: 'B1', to: 'B3' },
  { from: 'B3', to: 'B1' },
  { from: 'B3', to: 'B2' },
];

export const STORE_PAIRS = [
  { from: 'B1', to: 'B2', label: 'B1 -> B2' },
  { from: 'B1', to: 'B3', label: 'B1 -> B3' },
  { from: 'B3', to: 'B1', label: 'B3 -> B1' },
  { from: 'B3', to: 'B2', label: 'B3 -> B2' },
];

export const INVOICE_STATUSES = {
  PENDING: 'pending',
  RECONCILED: 'reconciled',
  DISPUTED: 'disputed',
};

export const INVOICE_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  reconciled: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
};

export const CATEGORIES = ['Beverages', 'Food', 'Supplies'];
