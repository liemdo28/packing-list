import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  BellIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { getDashboardStats } from '../api/dashboard';
import { getOrders } from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { ROLE_LABELS } from '../utils/constants';
import {
  getAttentionCards,
  getOnboardingSteps,
  getOrderRowInsights,
  getPrimaryAction,
  getRoleDashboardConfig,
} from '../utils/workflow';

function AttentionCard({ card }) {
  return (
    <Link
      to={`/orders?tab=${card.query.statusGroup}`}
      className={`rounded-2xl p-5 ring-1 transition-transform duration-200 hover:-translate-y-0.5 ${card.color}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium opacity-80">{card.title}</p>
          <p className="mt-3 text-3xl font-bold">{card.count}</p>
        </div>
        <ArrowRightIcon className="mt-1 h-5 w-5 opacity-60" />
      </div>
      <p className="mt-3 text-sm leading-6 opacity-80">{card.description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => localStorage.getItem('dashboard-onboarding-dismissed') === '1');
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getOrders({ page: 1, limit: 50 }),
    ])
      .then(([statsRes, ordersRes]) => {
        setStats(statsRes.data.data);
        setOrders(ordersRes.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  const roleConfig = getRoleDashboardConfig(user);
  const attentionCards = getAttentionCards(orders, user);
  const activeOrders = orders.filter((order) => ['draft', 'submitted', 'preparing', 'shipping', 'received'].includes(order.status));
  const priorityOrders = activeOrders
    .filter((order) => getPrimaryAction(order, user))
    .slice(0, 5);
  const recentOrders = stats?.recentOrders || [];
  const onboardingSteps = getOnboardingSteps(user);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-6 py-7 text-white shadow-xl sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200">Action-first home</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              What should {user?.store?.code || ROLE_LABELS[user?.role] || 'you'} do next?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              {roleConfig.headline}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              {roleConfig.helper}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link to="/orders?tab=needs-my-action" className="inline-flex items-center rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100">
                Open my queue
              </Link>
              <Link to="/orders?tab=problems" className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 font-medium text-white transition hover:bg-white/10">
                Review risks
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[24px] bg-white/8 p-5 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">Today at a glance</p>
              <BellIcon className="h-5 w-5 text-sky-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Waiting</p>
                <p className="mt-2 text-2xl font-semibold">{attentionCards.find((card) => card.key === 'waitingForMe')?.count || 0}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Incoming</p>
                <p className="mt-2 text-2xl font-semibold">{attentionCards.find((card) => card.key === 'incoming')?.count || 0}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Completed</p>
                <p className="mt-2 text-2xl font-semibold">{stats?.completedThisMonth || 0}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Monthly total</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(stats?.monthlyTotal || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!onboardingDismissed && (
        <section className="rounded-2xl border border-sky-100 bg-sky-50 px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-900">First time here?</p>
              <p className="mt-1 text-sm text-sky-800">Use this quick guide to understand your workflow without training documents.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {onboardingSteps.map((step) => (
                  <div key={step} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-sky-100">
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('dashboard-onboarding-dismissed', '1');
                setOnboardingDismissed(true);
              }}
              className="btn-secondary h-fit"
            >
              Dismiss helper
            </button>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">What Needs Your Attention</p>
            <p className="mt-1 text-sm text-gray-500">Open a filtered list directly from the card that matches your current work.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {attentionCards.map((card) => (
            <AttentionCard key={card.key} card={card} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Orders ready for you</p>
              <p className="mt-1 text-sm text-gray-500">Only show work where the next valid action belongs to your role.</p>
            </div>
            <Link to="/orders?tab=needs-my-action" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              View queue
            </Link>
          </div>

          {priorityOrders.length > 0 ? (
            <div className="space-y-3">
              {priorityOrders.map((order) => {
                const insight = getOrderRowInsights(order, user);
                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="block rounded-2xl border border-gray-200 p-4 transition hover:border-sky-200 hover:bg-sky-50/40"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{order.order_number}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {order.fromStore?.code} &rarr; {order.toStore?.code} · Updated {formatDateTime(order.updated_at || order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {insight.riskLabel && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">{insight.riskLabel}</span>}
                        <Badge status={order.status} />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Next action</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{insight.nextAction}</p>
                        <p className="mt-1 text-sm text-gray-500">{insight.guidance}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                        Open order
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="You currently have no actions pending."
              description="No incoming shipments, confirmations, or workflow steps need your attention right now."
              ctaLabel="Review all orders"
              ctaTo="/orders"
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Operational summary</p>
                <p className="text-sm text-gray-500">Keep this area readable in one scan.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total orders</span>
                <span className="font-semibold text-gray-900">{stats?.totalOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Pending orders</span>
                <span className="font-semibold text-gray-900">{stats?.pendingOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Unread notifications</span>
                <span className="font-semibold text-gray-900">{stats?.unreadNotifications || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Monthly value</span>
                <span className="font-semibold text-gray-900">{formatCurrency(stats?.monthlyTotal || 0)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Recently touched orders</p>
                <p className="text-sm text-gray-500">Quick access to the latest movement in your scope.</p>
              </div>
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-2xl border border-gray-200 px-4 py-3 transition hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                        <p className="mt-1 text-xs text-gray-500">{order.fromStore?.code} &rarr; {order.toStore?.code}</p>
                      </div>
                      <Badge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No recent orders yet."
                description="Create a new order or wait for the first incoming transfer to start building history here."
                ctaLabel={['admin', 'b1', 'b3'].includes(user?.role) ? 'Create order' : null}
                ctaTo={['admin', 'b1', 'b3'].includes(user?.role) ? '/orders/new' : null}
              />
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                <ChartBarIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Reminder</p>
                <p className="text-sm text-gray-500">Only completed orders affect monthly summary.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              Keep your team focused on the single next action. Hidden buttons mean another role or store should continue the workflow.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
