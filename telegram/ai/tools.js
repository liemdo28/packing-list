require('dotenv').config();

const axios = require('axios');

// Ensure trailing slash so axios resolves 'orders' relative to '/api/'
const BASE = (process.env.API_BASE_URL || 'http://localhost:3001/api').replace(/\/?$/, '/');

function apiClient(token) {
  return axios.create({
    baseURL: BASE,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Tool definitions for Anthropic tool_use ────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    name: 'get_my_tasks',
    description: 'Get the list of pending tasks and orders for the current user\'s store. Returns orders that need attention.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_order_status',
    description: 'Get the current status and details of a specific order by ID.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'number', description: 'The order ID to look up' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'get_blocked_reason',
    description: 'Explain why an order cannot proceed to the next step.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'number', description: 'The order ID' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'list_delayed_orders',
    description: 'List orders that have been in the same status for more than 24 hours.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_dashboard_summary',
    description: 'Get a high-level summary of store activity: pending, in-transit, completed today.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// ── Tool executor ───────────────────────────────────────────────────────────

async function executeTool(toolName, toolInput, session) {
  const api = apiClient(session.api_token);

  try {
    switch (toolName) {
      case 'get_my_tasks': {
        const res = await api.get('orders', { params: { status: 'submitted,processing,ready_to_ship,in_transit,received_pending_confirmation', limit: 10 } });
        const orders = res.data?.data?.orders || res.data?.data || [];
        if (!orders.length) return 'No pending tasks at the moment.';
        return orders.map(o => `• Order #${o.id} (${o.order_number}) — status: ${o.status} — from ${o.fromStore?.name || '?'} to ${o.toStore?.name || '?'}`).join('\n');
      }

      case 'get_order_status': {
        const res = await api.get(`orders/${toolInput.order_id}`);
        const o   = res.data?.data;
        if (!o) return `Order #${toolInput.order_id} not found.`;
        return `Order #${o.id} (${o.order_number})\nStatus: ${o.status}\nFrom: ${o.fromStore?.name}\nTo: ${o.toStore?.name}\nCreated: ${new Date(o.created_at).toLocaleDateString()}`;
      }

      case 'get_blocked_reason': {
        const res = await api.get(`orders/${toolInput.order_id}`);
        const o   = res.data?.data;
        if (!o) return `Order #${toolInput.order_id} not found.`;

        const LOCK_STATES = ['completed', 'cancelled', 'disputed'];
        if (LOCK_STATES.includes(o.status)) {
          return `Order #${o.id} is in "${o.status}" state — no further transitions are allowed.`;
        }
        return `Order #${o.id} is in "${o.status}" state. The next allowed action depends on your role and the store's responsibility at this stage. Open the Mini App for guided next steps.`;
      }

      case 'list_delayed_orders': {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const res = await api.get('orders', { params: { status: 'submitted,processing,ready_to_ship,in_transit', limit: 20 } });
        const all  = res.data?.data?.orders || res.data?.data || [];
        const delayed = all.filter(o => new Date(o.updated_at) < new Date(cutoff));
        if (!delayed.length) return 'No delayed orders found.';
        return delayed.map(o => `• Order #${o.id} — status: ${o.status} — unchanged since ${new Date(o.updated_at).toLocaleDateString()}`).join('\n');
      }

      case 'get_dashboard_summary': {
        const res = await api.get('orders', { params: { limit: 1 } });
        const total = res.data?.pagination?.total ?? '?';
        const resCompleted = await api.get('/orders', { params: { status: 'completed', limit: 1 } });
        const completed = resCompleted.data?.pagination?.total ?? '?';
        const resTransit = await api.get('/orders', { params: { status: 'in_transit', limit: 1 } });
        const inTransit = resTransit.data?.pagination?.total ?? '?';
        return `Dashboard Summary:\n• Total Orders: ${total}\n• In Transit: ${inTransit}\n• Completed: ${completed}`;
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return 'Session expired. Please /login again.';
    if (status === 403) return 'You do not have permission to view this information.';
    return `Data unavailable: ${err.message}`;
  }
}

module.exports = { TOOL_DEFINITIONS, executeTool };
