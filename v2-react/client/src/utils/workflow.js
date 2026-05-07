import { ROLE_LABELS, STATUS_LABELS, ORDER_STATUSES } from './constants';

const ORDER_FLOW = [
  ORDER_STATUSES.DRAFT,
  ORDER_STATUSES.SUPPLIER_REVIEWING,
  ORDER_STATUSES.SUPPLIER_ACCEPTED,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.SHIPPING,
  ORDER_STATUSES.RECEIVING_REVIEW,
  ORDER_STATUSES.COMPLETED,
];

const ACTION_CONFIG = {
  submit: {
    label: 'Submit to Supplier',
    success: 'submitted',
    helper: 'Submits the order for the supplier store to review and confirm quantities.',
    riskLevel: 'normal',
  },
  accept: {
    label: 'Review & Accept',
    success: 'accepted',
    helper: 'Review the requested quantities, adjust if needed, and accept the order.',
    riskLevel: 'normal',
    usesModal: true,
  },
  reject: {
    label: 'Reject Order',
    success: 'rejected',
    helper: 'Reject this order if you cannot fulfill it.',
    riskLevel: 'danger',
    confirmation: {
      title: 'Reject this order?',
      confirmText: 'Reject Order',
      description: 'This will notify the requesting store that their order cannot be fulfilled.',
    },
  },
  prepare: {
    label: 'Start Preparing',
    success: 'moved to preparing',
    helper: 'Start packing based on the confirmed quantities.',
    riskLevel: 'normal',
  },
  ship: {
    label: 'Mark as Shipped',
    success: 'shipped',
    helper: 'Confirm the items have been dispatched to the destination store.',
    riskLevel: 'high',
    confirmation: {
      title: 'Ship this order?',
      confirmText: 'Ship Order',
      description: 'This marks the transfer as shipped and hands the next step to the destination store.',
    },
  },
  receive: {
    label: 'Confirm Receipt',
    success: 'received',
    helper: 'Enter the quantities you actually received and confirm receipt.',
    riskLevel: 'normal',
    usesModal: true,
  },
  complete: {
    label: 'Complete Order',
    success: 'completed',
    helper: 'Finalizes the order and locks pricing for reconciliation.',
    riskLevel: 'high',
    confirmation: {
      title: 'Complete this order?',
      confirmText: 'Complete Order',
      description: 'This will freeze the price snapshot and include the order in summary calculations.',
    },
  },
  cancel: {
    label: 'Cancel Order',
    success: 'cancelled',
    helper: 'Use only when this transfer should stop completely.',
    riskLevel: 'danger',
    confirmation: {
      title: 'Cancel this order?',
      confirmText: 'Cancel Order',
      description: 'This stops the workflow and may require the team to create a replacement order.',
    },
  },
  edit: {
    label: 'Edit Draft',
    success: 'edited',
    helper: 'Draft orders can still be updated safely.',
    riskLevel: 'normal',
  },
};

const TRANSITION_RULES = {
  draft: {
    primary: 'submit',
    secondary: ['edit', 'cancel'],
  },
  supplier_reviewing: {
    primary: 'accept',
    secondary: ['reject', 'cancel'],
  },
  supplier_accepted: {
    primary: 'prepare',
    secondary: ['cancel'],
  },
  preparing: {
    primary: 'ship',
    secondary: ['cancel'],
  },
  shipping: {
    primary: 'receive',
    secondary: [],
  },
  receiving_review: {
    primary: 'complete',
    secondary: [],
  },
  discrepancy_review: {
    primary: 'complete',
    secondary: ['cancel'],
  },
  completed: {
    primary: null,
    secondary: [],
  },
  supplier_rejected: {
    primary: null,
    secondary: [],
  },
  cancelled: {
    primary: null,
    secondary: [],
  },
};

export function canPerformAction(userRole, orderStatus, action, order = null) {
  const fromCode = order?.fromStore?.code;
  const toCode = order?.toStore?.code;

  const permissions = {
    // submit/edit: only the requester (to_store) can act on their own draft
    submit:  { statuses: ['draft'],              roles: ['admin', 'b1', 'b2', 'b3'], side: 'to' },
    edit:    { statuses: ['draft'],              roles: ['admin', 'b1', 'b2', 'b3'], side: 'to' },
    // supplier-side actions
    accept:  { statuses: ['supplier_reviewing'], roles: ['admin', 'b1', 'b3'], side: 'from' },
    reject:  { statuses: ['supplier_reviewing'], roles: ['admin', 'b1', 'b3'], side: 'from' },
    prepare: { statuses: ['supplier_accepted'],  roles: ['admin', 'b1', 'b3'], side: 'from' },
    ship:    { statuses: ['preparing'],          roles: ['admin', 'b1', 'b3'], side: 'from' },
    // destination-side actions
    receive: { statuses: ['shipping'],           roles: ['admin', 'b1', 'b2', 'b3'], side: 'to' },
    complete:{ statuses: ['receiving_review', 'discrepancy_review'], roles: ['admin', 'b1', 'b2', 'b3', 'accountant'], side: 'to' },
    // cancel: any involved store (from or to) can cancel at early stages
    cancel:  { statuses: ['draft', 'supplier_reviewing', 'supplier_accepted', 'preparing'], roles: ['admin', 'b1', 'b2', 'b3'], side: 'either' },
  };

  const perm = permissions[action];
  if (!perm) return false;
  if (!perm.statuses.includes(orderStatus) || !perm.roles.includes(userRole)) return false;
  if (!order || userRole === 'admin' || userRole === 'accountant') return true;

  if (['b1', 'b2', 'b3'].includes(userRole)) {
    if (perm.side === 'from')   return fromCode?.toLowerCase() === userRole;
    if (perm.side === 'to')     return toCode?.toLowerCase() === userRole;
    if (perm.side === 'either') return fromCode?.toLowerCase() === userRole || toCode?.toLowerCase() === userRole;
  }

  return true;
}

export function getBlockedReason(user, order) {
  if (!order) return null;
  if (order.status === ORDER_STATUSES.COMPLETED) return 'Completed orders are locked.';
  if (order.status === ORDER_STATUSES.CANCELLED) return 'Cancelled orders are locked. Create a new order if needed.';
  if (order.status === ORDER_STATUSES.SUPPLIER_REJECTED) return 'This order was rejected by the supplier. Create a new order to try again.';

  const role = user?.role;
  const fromCode = order?.fromStore?.code?.toLowerCase();
  const toCode = order?.toStore?.code?.toLowerCase();

  if (['supplier_reviewing', 'supplier_accepted', 'preparing'].includes(order.status)) {
    if (['b1', 'b3'].includes(role) && fromCode !== role) {
      return `Only ${order.fromStore?.code} staff can continue this step.`;
    }
  }
  if (['shipping'].includes(order.status)) {
    if (['b1', 'b2', 'b3'].includes(role) && toCode !== role) {
      return `Only ${order.toStore?.code} staff can receive this order.`;
    }
  }
  if (['receiving_review', 'discrepancy_review'].includes(order.status)) {
    if (['b1', 'b2', 'b3'].includes(role) && toCode !== role) {
      return `Only ${order.toStore?.code} staff can complete this step.`;
    }
  }

  const transition = TRANSITION_RULES[order.status];
  if (transition?.primary) {
    const actionCfg = ACTION_CONFIG[transition.primary];
    return `${actionCfg.label} is the next workflow step once the correct store opens this order.`;
  }

  return null;
}

export function getPrimaryAction(order, user) {
  const transition = TRANSITION_RULES[order?.status];
  if (!transition?.primary) return null;

  if (!canPerformAction(user?.role, order.status, transition.primary, order)) {
    return null;
  }

  return {
    key: transition.primary,
    ...ACTION_CONFIG[transition.primary],
  };
}

export function getSecondaryActions(order, user) {
  const transition = TRANSITION_RULES[order?.status];
  if (!transition) return [];

  return transition.secondary
    .filter((action) => canPerformAction(user?.role, order.status, action, order))
    .map((action) => ({
      key: action,
      ...ACTION_CONFIG[action],
    }));
}

export function getRecommendedMessage(order, user) {
  const primary = getPrimaryAction(order, user);

  if (primary) {
    return {
      tone: primary.riskLevel === 'high' ? 'warning' : primary.riskLevel === 'danger' ? 'error' : 'info',
      title: `Next action: ${primary.label}`,
      description: primary.helper,
    };
  }

  return {
    tone: 'info',
    title: 'No action required right now',
    description: getBlockedReason(user, order) || 'This order is waiting on another store or is already finished.',
  };
}

export function getWorkflowSteps(order) {
  const timestamps = {
    draft:               order?.created_at,
    supplier_reviewing:  order?.submitted_at,
    supplier_accepted:   order?.accepted_at,
    preparing:           order?.prepared_at,
    shipping:            order?.shipped_at,
    receiving_review:    order?.received_at,
    completed:           order?.completed_at,
  };

  const currentIndex = ORDER_FLOW.indexOf(order?.status);
  const isTerminal = ['cancelled', 'supplier_rejected'].includes(order?.status);

  return ORDER_FLOW.map((step, index) => ({
    key: step,
    label: STATUS_LABELS[step],
    state: isTerminal
      ? (timestamps[step] ? 'complete' : 'upcoming')
      : index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
    timestamp: timestamps[step] || null,
    actorLabel: index === 0 ? order?.creator?.full_name || 'System' : timestamps[step] ? 'Recorded' : null,
  }));
}

export function getRoleDashboardConfig(user) {
  const configs = {
    admin: {
      headline: 'Oversee operational flow, exceptions, and reconciliations.',
      helper: 'Focus on blocked transfers, discrepancies, and final reporting quality.',
    },
    accountant: {
      headline: 'Review completed work, summaries, and finance-impacting exceptions.',
      helper: 'Only completed orders affect monthly summary and reconciliation.',
    },
    b1: {
      headline: 'Create outgoing transfers, prepare shipments, and track what B1 has sent.',
      helper: 'Your highest-value work is drafting, accepting, preparing, and shipping orders from B1.',
    },
    b2: {
      headline: 'Receive incoming work and confirm transfers safely for B2.',
      helper: 'You should mainly focus on shipments sent to B2 and any receiving confirmations.',
    },
    b3: {
      headline: 'Manage B3 transfers and keep outgoing orders moving without delays.',
      helper: 'Your main work is accepting, preparing, shipping, and receiving B3-related orders.',
    },
  };

  return configs[user?.role] || {
    headline: 'See what needs action now.',
    helper: 'The dashboard highlights the next safe step for your role.',
  };
}

export function getAttentionCards(orders, user) {
  const role = user?.role;
  const userStoreCode = user?.store?.code;
  const isOperator = ['b1', 'b2', 'b3'].includes(role);
  const ownStore = userStoreCode?.toLowerCase();

  const filters = {
    drafts: (order) => order.status === 'draft' && (role === 'admin' || order.fromStore?.code?.toLowerCase() === ownStore),
    waitingForMe: (order) => Boolean(getPrimaryAction(order, user)),
    incoming: (order) => order.status === 'shipping' && order.toStore?.code?.toLowerCase() === ownStore,
    needsReview: (order) => ['supplier_reviewing'].includes(order.status) && (role === 'admin' || order.fromStore?.code?.toLowerCase() === ownStore),
    needsConfirmation: (order) => ['receiving_review', 'discrepancy_review'].includes(order.status) && (role === 'admin' || order.toStore?.code?.toLowerCase() === ownStore),
    discrepancies: (order) => order.status === 'discrepancy_review',
    stuck: (order) => {
      const updatedAt = new Date(order.updated_at || order.created_at).getTime();
      return Date.now() - updatedAt > 1000 * 60 * 60 * 24 * 2 && !['completed', 'cancelled', 'supplier_rejected'].includes(order.status);
    },
  };

  const cards = [
    {
      key: 'waitingForMe',
      title: 'Needs My Action',
      description: 'Orders where you can safely take the next step now.',
      count: orders.filter(filters.waitingForMe).length,
      color: 'bg-amber-50 text-amber-900 ring-amber-200',
      query: { statusGroup: 'needs-my-action' },
    },
    {
      key: 'incoming',
      title: 'Incoming Shipments',
      description: 'Shipped orders heading to your store and waiting for receipt.',
      count: isOperator ? orders.filter(filters.incoming).length : orders.filter((o) => o.status === 'shipping').length,
      color: 'bg-sky-50 text-sky-900 ring-sky-200',
      query: { statusGroup: 'incoming' },
    },
    {
      key: 'discrepancies',
      title: 'Discrepancies',
      description: 'Orders with quantity differences that need resolution.',
      count: orders.filter(filters.discrepancies).length,
      color: 'bg-amber-50 text-amber-900 ring-amber-200',
      query: { statusGroup: 'discrepancy' },
    },
    {
      key: 'needsConfirmation',
      title: 'Need Completion',
      description: 'Received orders waiting for a final completion step.',
      count: orders.filter(filters.needsConfirmation).length,
      color: 'bg-violet-50 text-violet-900 ring-violet-200',
      query: { statusGroup: 'needs-confirmation' },
    },
    {
      key: 'drafts',
      title: 'Drafts Not Submitted',
      description: 'Still editable. Review and submit when ready.',
      count: orders.filter(filters.drafts).length,
      color: 'bg-slate-100 text-slate-900 ring-slate-200',
      query: { statusGroup: 'drafts' },
    },
    {
      key: 'stuck',
      title: 'Delayed or Stuck',
      description: 'Orders that have been inactive for more than 2 days.',
      count: orders.filter(filters.stuck).length,
      color: 'bg-rose-50 text-rose-900 ring-rose-200',
      query: { statusGroup: 'problems' },
    },
  ];

  return cards.filter((card) => role !== 'accountant' || ['needsConfirmation', 'stuck', 'incoming', 'discrepancies'].includes(card.key));
}

export function getOrderListGroups(orders, user) {
  const groups = [
    {
      key: 'needs-my-action',
      label: 'Needs My Action',
      helper: 'Orders where you can take the next valid step right now.',
      empty: 'You currently have no actions pending.',
      filter: (order) => Boolean(getPrimaryAction(order, user)),
    },
    {
      key: 'in-progress',
      label: 'In Progress',
      helper: 'Active orders moving through the workflow.',
      empty: 'No active transfers are currently moving through the workflow.',
      filter: (order) => ['supplier_reviewing', 'supplier_accepted', 'preparing', 'receiving_review'].includes(order.status),
    },
    {
      key: 'incoming',
      label: 'Waiting on Other Store',
      helper: 'Transfers moving but needing another store to continue.',
      empty: 'No transfers are currently waiting on another store.',
      filter: (order) => order.status === 'shipping',
    },
    {
      key: 'discrepancy',
      label: 'Discrepancy Review',
      helper: 'Orders with quantity discrepancies that need admin resolution.',
      empty: 'No discrepancy orders at this time.',
      filter: (order) => order.status === 'discrepancy_review',
    },
    {
      key: 'completed',
      label: 'Completed',
      helper: 'Finished transfers kept for review and reconciliation.',
      empty: 'No completed transfers match this filter yet.',
      filter: (order) => order.status === 'completed',
    },
    {
      key: 'problems',
      label: 'Problems',
      helper: 'Cancelled, rejected, or long-inactive work that may need intervention.',
      empty: 'No blocked or risky orders detected right now.',
      filter: (order) => ['cancelled', 'supplier_rejected'].includes(order.status) || isOrderDelayed(order),
    },
    {
      key: 'drafts',
      label: 'Drafts',
      helper: 'Editable work that has not been submitted yet.',
      empty: 'No draft orders yet. Create a new order to request items from another store.',
      filter: (order) => order.status === 'draft',
    },
  ];

  return groups;
}

export function isOrderDelayed(order) {
  const updatedAt = new Date(order.updated_at || order.created_at).getTime();
  return Date.now() - updatedAt > 1000 * 60 * 60 * 24 * 2 && !['completed', 'cancelled', 'supplier_rejected'].includes(order.status);
}

export function getOrderRowInsights(order, user) {
  const primary = getPrimaryAction(order, user);

  return {
    nextAction: primary?.label || (['completed'].includes(order.status) ? 'Done' : 'Waiting'),
    riskLabel: ['cancelled', 'supplier_rejected'].includes(order.status) ? 'Blocked' : isOrderDelayed(order) ? 'Delayed' : null,
    guidance: primary?.helper || getBlockedReason(user, order),
  };
}

export function getOnboardingSteps(user) {
  return [
    `Check "What Needs Your Attention" to find work for ${ROLE_LABELS[user?.role] || 'your role'}.`,
    'Open one assigned order and follow the workflow panel at the top.',
    'Use the single primary action button to move the order safely to the next step.',
    'Complete only the work your store owns. Hidden actions mean another team must continue.',
  ];
}
