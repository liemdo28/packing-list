const TRANSFER_RULES = [
  { from: 'B1', to: 'B2' },
  { from: 'B1', to: 'B3' },
  { from: 'B3', to: 'B1' },
  { from: 'B3', to: 'B2' },
];

const ORDER_STATUSES = {
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

const STATUS_TRANSITIONS = {
  draft:               ['supplier_reviewing', 'cancelled'],
  supplier_reviewing:  ['supplier_accepted', 'supplier_rejected', 'cancelled'],
  supplier_accepted:   ['preparing', 'cancelled'],
  preparing:           ['shipping'],
  shipping:            ['receiving_review'],
  receiving_review:    ['completed', 'discrepancy_review'],
  discrepancy_review:  ['completed', 'cancelled'],
  completed:           [],
  supplier_rejected:   [],
  cancelled:           [],
};

const ROLES = {
  ADMIN: 'admin',
  B1: 'b1',
  B2: 'b2',
  B3: 'b3',
  ACCOUNTANT: 'accountant',
};

const STORE_CODES = ['B1', 'B2', 'B3'];

function isValidTransfer(fromCode, toCode) {
  return TRANSFER_RULES.some(r => r.from === fromCode && r.to === toCode);
}

function canTransitionTo(currentStatus, newStatus) {
  const allowed = STATUS_TRANSITIONS[currentStatus];
  return allowed && allowed.includes(newStatus);
}

function getStoresByRole(role) {
  switch (role) {
    case ROLES.ADMIN:
      return STORE_CODES;
    case ROLES.ACCOUNTANT:
      return STORE_CODES;
    case ROLES.B1:
      return ['B1'];
    case ROLES.B2:
      return ['B2'];
    case ROLES.B3:
      return ['B3'];
    default:
      return [];
  }
}

module.exports = {
  TRANSFER_RULES,
  ORDER_STATUSES,
  STATUS_TRANSITIONS,
  ROLES,
  STORE_CODES,
  isValidTransfer,
  canTransitionTo,
  getStoresByRole,
};
