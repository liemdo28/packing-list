import { ROLE_LABELS, STATUS_LABELS, ORDER_STATUSES } from './constants';

const ORDER_FLOW = [
  ORDER_STATUSES.DRAFT,
  ORDER_STATUSES.SUBMITTED,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.RECEIVED,
  ORDER_STATUSES.COMPLETED,
];

const ACTION_CONFIG = {
  submit: {
    label: 'Submit Order',
    success: 'submitted',
    helper: 'Draft orders are editable until submitted.',
    riskLevel: 'normal',
  },
  prepare: {
    label: 'Start Preparing',
    success: 'moved to preparing',
    helper: 'Start packing only when the order has been reviewed.',
    riskLevel: 'normal',
  },
  receive: {
    label: 'Confirm Receipt',
    success: 'received',
    helper: 'Only the destination store should confirm receipt of the items.',
    riskLevel: 'normal',
  },
  complete: {
    label: 'Complete Order',
    success: 'completed',
    helper: 'Only completed orders affect summaries and freeze pricing.',
    riskLevel: 'high',
    confirmation: {
      title: 'Complete this order?',
      confirmText: 'Complete Order',
      description: 'This will freeze price snapshot and include the order in summary calculations.',
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
  submitted: {
    primary: 'prepare',
    secondary: ['cancel'],
  },
  preparing: {
    primary: 'receive',
    secondary: ['cancel'],
  },
  received: {
    primary: 'complete',
    secondary: [],
  },
  completed: {
    primary: null,
    secondary: [],
  },
  cancelled: {
    primary: null,
    secondary: [],
  },
};

export function canPerformAction(userRole, orderStatus, action, order = null) {
  const storeCode = order?.toStore?.code;
  const fromCode = order?.fromStore?.code;

  const permissions = {
    submit: { statuses: ['draft'], roles: ['admin', 'b1', 'b3'] },
    prepare: { statuses: ['submitted'], roles: ['admin', 'b1', 'b3'] },
    receive: { statuses: ['preparing'], roles: ['admin', 'b1', 'b2', 'b3'] },
    complete: { statuses: ['received'], roles: ['admin', 'b1', 'b2', 'b3', 'accountant'] },
    cancel: { statuses: ['draft', 'submitted', 'preparing'], roles: ['admin', 'b1', 'b3'] },
    edit: { statuses: ['draft'], roles: ['admin', 'b1', 'b3'] },
  };

  const perm = permissions[action];
  if (!perm) return false;
  if (!perm.statuses.includes(orderStatus) || !perm.roles.includes(userRole)) return false;

  if (!order) return true;

  if ((action === 'receive' || action === 'complete') && ['b1', 'b2', 'b3'].includes(userRole)) {
    return storeCode?.toLowerCase() === userRole;
  }

  if (['submit', 'prepare', 'cancel', 'edit'].includes(action) && ['b1', 'b3'].includes(userRole)) {
    return fromCode?.toLowerCase() === userRole;
  }

  return true;
}

export function getBlockedReason(user, order) {
  if (!order) return null;
  if (order.status === ORDER_STATUSES.COMPLETED) return 'Completed orders are locked and no longer editable.';
  if (order.status === ORDER_STATUSES.CANCELLED) return 'Cancelled orders are locked. Create a new order if work must continue.';
  if (order.status === ORDER_STATUSES.PREPARING && order.toStore?.code?.toLowerCase() !== user?.role && ['b1', 'b2', 'b3'].includes(user?.role)) {
    return 'Only the destination store can confirm receipt of this order.';
  }
  if (order.status === ORDER_STATUSES.RECEIVED && order.toStore?.code?.toLowerCase() !== user?.role && ['b1', 'b2', 'b3'].includes(user?.role)) {
    return 'Only the destination store can complete this order.';
  }
  if (['draft', 'submitted', 'preparing'].includes(order.status) && order.fromStore?.code?.toLowerCase() !== user?.role && ['b1', 'b3'].includes(user?.role)) {
    return 'Only the sending store can continue this workflow step.';
  }

  const transition = TRANSITION_RULES[order.status];
  if (transition?.primary) {
    const action = ACTION_CONFIG[transition.primary];
    return `${action.label} is the next workflow step once the correct store opens this order.`;
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
      tone: primary.riskLevel === 'high' ? 'warning' : 'info',
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
    draft: order?.created_at,
    submitted: order?.submitted_at,
    preparing: order?.prepared_at,
    received: order?.received_at,
    completed: order?.completed_at,
  };

  const currentIndex = ORDER_FLOW.indexOf(order?.status);

  return ORDER_FLOW.map((step, index) => ({
    key: step,
    label: STATUS_LABELS[step],
    state: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
    timestamp: timestamps[step] || null,
    actorLabel: index === 0 ? order?.creator?.full_name || 'System' : timestamps[step] ? 'Recorded' : null,
  }));
}

export function getRoleDashboardConfig(user) {
  const configs = {
    admin: {
      headline: 'Oversee operational flow, exceptions, and reconciliations.',
      helper: 'Focus on blocked transfers, delayed work, and final reporting quality.',
    },
    accountant: {
      headline: 'Review completed work, summaries, and finance-impacting exceptions.',
      helper: 'Only completed orders affect monthly summary and reconciliation.',
    },
    b1: {
      headline: 'Create outgoing transfers, prepare shipments, and track what B1 has sent.',
      helper: 'Your highest-value work is drafting, preparing, and shipping orders from B1.',
    },
    b2: {
      headline: 'Receive incoming work and confirm transfers safely for B2.',
      helper: 'You should mainly focus on shipments sent to B2 and any receiving confirmations.',
    },
    b3: {
      headline: 'Manage B3 transfers and keep outgoing orders moving without delays.',
      helper: 'Your main work is creating, preparing, shipping, and receiving B3-related orders.',
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
    incoming: (order) => order.status === 'preparing' && order.toStore?.code?.toLowerCase() === ownStore,
    needsConfirmation: (order) => order.status === 'received' && (role === 'admin' || order.toStore?.code?.toLowerCase() === ownStore),
    stuck: (order) => {
      const updatedAt = new Date(order.updated_at || order.created_at).getTime();
      return Date.now() - updatedAt > 1000 * 60 * 60 * 24 * 2 && !['completed', 'cancelled'].includes(order.status);
    },
    problems: (order) => order.status === 'cancelled',
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
      count: isOperator ? orders.filter(filters.incoming).length : orders.filter((order) => order.status === 'preparing').length,
      color: 'bg-sky-50 text-sky-900 ring-sky-200',
      query: { statusGroup: 'incoming' },
    },
    {
      key: 'needsConfirmation',
      title: 'Need Confirmation',
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

  return cards.filter((card) => role !== 'accountant' || ['needsConfirmation', 'stuck', 'incoming'].includes(card.key));
}

export function getOrderListGroups(orders, user) {
  const groups = [
    {
      key: 'needs-my-action',
      label: 'Needs My Action',
      helper: 'The system is showing only orders where you can take the next valid step.',
      empty: 'You currently have no actions pending.',
      filter: (order) => Boolean(getPrimaryAction(order, user)),
    },
    {
      key: 'in-progress',
      label: 'In Progress',
      helper: 'Orders that are active but not yet waiting on another store.',
      empty: 'No active transfers are currently moving through your workflow.',
      filter: (order) => ['submitted', 'preparing'].includes(order.status),
    },
    {
      key: 'incoming',
      label: 'Waiting on Other Store',
      helper: 'Track transfers that are moving but need another store to continue.',
      empty: 'No transfers are currently waiting on another store.',
      filter: (order) => order.status === 'draft',
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
      helper: 'Cancelled or long-inactive work that may need intervention.',
      empty: 'No blocked or risky orders detected right now.',
      filter: (order) => order.status === 'cancelled' || isOrderDelayed(order),
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
  return Date.now() - updatedAt > 1000 * 60 * 60 * 24 * 2 && !['completed', 'cancelled'].includes(order.status);
}

export function getOrderRowInsights(order, user) {
  const primary = getPrimaryAction(order, user);

  return {
    nextAction: primary?.label || (order.status === 'completed' ? 'Done' : 'Waiting'),
    riskLabel: order.status === 'cancelled' ? 'Blocked' : isOrderDelayed(order) ? 'Delayed' : null,
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
