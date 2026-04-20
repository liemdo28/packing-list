const TRANSFER_RULES = [
  { from: 'B1', to: 'B2' },
  { from: 'B1', to: 'B3' },
  { from: 'B3', to: 'B1' },
  { from: 'B3', to: 'B2' },
];

// Must match Laravel config/packinglist.php statuses
const ORDER_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PROCESSING: 'processing',           // B1 started preparing
  READY_TO_SHIP: 'ready_to_ship',     // quantities entered, ready
  IN_TRANSIT: 'in_transit',           // shipped
  RECEIVED_PENDING: 'received_pending_confirmation', // receiver acknowledged
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
};

const STATUS_TRANSITIONS = {
  // [current]: [allowed next states]
  [ORDER_STATUSES.DRAFT]:           [ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SUBMITTED]:       [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PROCESSING]:      [ORDER_STATUSES.READY_TO_SHIP, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.READY_TO_SHIP]:   [ORDER_STATUSES.IN_TRANSIT],
  [ORDER_STATUSES.IN_TRANSIT]:       [ORDER_STATUSES.RECEIVED_PENDING],
  [ORDER_STATUSES.RECEIVED_PENDING]:[ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DISPUTED],
  [ORDER_STATUSES.COMPLETED]:        [],
  [ORDER_STATUSES.CANCELLED]:        [],
  [ORDER_STATUSES.DISPUTED]:         [],
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
