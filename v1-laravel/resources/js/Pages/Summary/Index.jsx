import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import {
    ArrowDownTrayIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    CurrencyDollarIcon,
    CubeIcon,
    ClockIcon,
    AdjustmentsHorizontalIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    TableCellsIcon,
} from '@heroicons/react/24/outline';

const MONTHS = [
    { value: 1, label: 'January', short: 'Jan' },
    { value: 2, label: 'February', short: 'Feb' },
    { value: 3, label: 'March', short: 'Mar' },
    { value: 4, label: 'April', short: 'Apr' },
    { value: 5, label: 'May', short: 'May' },
    { value: 6, label: 'June', short: 'Jun' },
    { value: 7, label: 'July', short: 'Jul' },
    { value: 8, label: 'August', short: 'Aug' },
    { value: 9, label: 'September', short: 'Sep' },
    { value: 10, label: 'October', short: 'Oct' },
    { value: 11, label: 'November', short: 'Nov' },
    { value: 12, label: 'December', short: 'Dec' },
];

function generateYears() {
    const current = new Date().getFullYear();
    const years = [];
    for (let y = current; y >= current - 5; y--) years.push(y);
    return years;
}

const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

const formatNumber = (n) =>
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color }) {
    const colorMap = {
        green: { border: 'border-emerald-500/40', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/10' },
        blue: { border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-blue-500/20', bg: 'bg-blue-500/10' },
        red: { border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20', bg: 'bg-red-500/10' },
        yellow: { border: 'border-yellow-500/40', text: 'text-yellow-400', glow: 'shadow-yellow-500/20', bg: 'bg-yellow-500/10' },
        purple: { border: 'border-purple-500/40', text: 'text-purple-400', glow: 'shadow-purple-500/20', bg: 'bg-purple-500/10' },
    };
    const c = colorMap[color] || colorMap.green;

    return (
        <div className={`bg-[#1e1e2e] border ${c.border} rounded-xl p-5 shadow-lg ${c.glow}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
                    <p className={`mt-2 text-2xl font-bold ${c.text}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${c.bg}`}>
                    <Icon className={`h-6 w-6 ${c.text}`} />
                </div>
            </div>
        </div>
    );
}

// ─── Overview Tab ────────────────────────────────────────────
function OverviewTab({ overview, year, month }) {
    const monthLabel = MONTHS.find((m) => m.value === month)?.label || '';

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-400">
                Overview for <span className="text-white font-medium">{monthLabel} {year}</span>
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Completed Orders" value={overview.totalCompleted} icon={ClipboardDocumentListIcon} color="green" />
                <StatCard title="Total Item Lines" value={overview.totalItems} icon={CubeIcon} color="blue" />
                <StatCard title="Total Value" value={formatCurrency(overview.totalAmount)} icon={CurrencyDollarIcon} color="red" />
                <StatCard title="Pending Orders" value={overview.pendingOrders} icon={ClockIcon} color="yellow" />
            </div>

            {/* Per-store breakdown */}
            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Per-Store Breakdown</h3>
                    <span className="text-xs text-gray-500">{monthLabel} {year}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700/50">
                        <thead className="bg-[#252540]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Store Direction</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Orders</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {(overview.byStore || []).length > 0 ? (
                                overview.byStore.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                                        <td className="px-6 py-3 text-sm text-gray-200">{row.store}</td>
                                        <td className="px-6 py-3 text-sm text-gray-300 text-right">{row.orders}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-emerald-400 text-right">{formatCurrency(row.amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No data for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjusted orders */}
            <div className="bg-[#1e1e2e] border border-purple-500/30 rounded-xl p-5 shadow-lg shadow-purple-500/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Orders with Adjustments</p>
                        <p className="text-xl font-bold text-purple-400">{overview.adjustedOrders}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Pair Tab ────────────────────────────────────────────────
function PairTab({ pairData, pair, year, month, onYearChange, onMonthChange }) {
    const [drillDown, setDrillDown] = useState(null);
    const [loading, setLoading] = useState(false);

    const items = pairData?.items || [];
    const grandTotal = pairData?.grand_total || 0;

    const handleDrillDown = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`/summary/pair-detail?year=${year}&month=${month}&pair=${pair}`);
            const data = await resp.json();
            setDrillDown(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleExport = () => {
        window.location.href = `/summary/export/excel?year=${year}&month=${month}&pair=${pair}&type=monthly`;
    };

    const monthLabel = MONTHS.find((m) => m.value === month)?.label || '';

    return (
        <div className="space-y-5">
            {/* Month/Year selector */}
            <div className="flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Year</label>
                    <select
                        value={year}
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        className="rounded-md bg-gray-800 border-gray-600 text-white text-sm focus:border-red-500 focus:ring-red-500"
                    >
                        {generateYears().map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Month</label>
                    <select
                        value={month}
                        onChange={(e) => onMonthChange(parseInt(e.target.value))}
                        className="rounded-md bg-gray-800 border-gray-600 text-white text-sm focus:border-red-500 focus:ring-red-500"
                    >
                        {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleDrillDown}
                    disabled={loading}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                    <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                    {loading ? 'Loading...' : 'Drill Down'}
                </button>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Export Excel
                </button>
            </div>

            <p className="text-sm text-gray-400">
                Pair <span className="text-white font-medium">{pair}</span> &mdash; {monthLabel} {year}
            </p>

            {/* Items table */}
            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700/50">
                        <thead className="bg-[#252540]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total Qty</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Unit Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {items.length > 0 ? (
                                items.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                                        <td className="px-6 py-3 text-sm text-gray-200">{row.item_name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400">{row.unit}</td>
                                        <td className="px-6 py-3 text-sm text-gray-200 text-right">{formatNumber(row.total_qty)}</td>
                                        <td className="px-6 py-3 text-sm text-gray-200 text-right">{formatCurrency(row.unit_price)}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-emerald-400 text-right">{formatCurrency(row.total)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No summary data available for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {items.length > 0 && (
                            <tfoot className="bg-[#252540]">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-sm font-bold text-white text-right">Grand Total</td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-400 text-right">{formatCurrency(grandTotal)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Drill-down modal */}
            {drillDown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDrillDown(null)}>
                    <div
                        className="bg-[#1e1e2e] border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
                            <h3 className="text-lg font-semibold text-white">
                                Order Details &mdash; {pair} &mdash; {monthLabel} {year}
                            </h3>
                            <button onClick={() => setDrillDown(null)} className="text-gray-400 hover:text-white">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {drillDown.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No orders found.</p>
                            ) : (
                                drillDown.map((order) => (
                                    <div key={order.id} className="border border-gray-700/30 rounded-lg overflow-hidden">
                                        <div className="bg-[#252540] px-4 py-3 flex flex-wrap gap-4 text-sm">
                                            <span className="text-white font-medium">{order.order_number}</span>
                                            <span className="text-gray-400">{order.from_store} &rarr; {order.to_store}</span>
                                            <span className="text-gray-400">{order.completed_at}</span>
                                            <span className="ml-auto text-emerald-400 font-medium">{formatCurrency(order.total)}</span>
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-700/30">
                                            <thead>
                                                <tr className="text-xs text-gray-500">
                                                    <th className="px-4 py-2 text-left">Item</th>
                                                    <th className="px-4 py-2 text-left">Unit</th>
                                                    <th className="px-4 py-2 text-right">Req Qty</th>
                                                    <th className="px-4 py-2 text-right">Final Qty</th>
                                                    <th className="px-4 py-2 text-right">Price</th>
                                                    <th className="px-4 py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700/20">
                                                {order.lines.map((line, li) => (
                                                    <tr key={li} className="hover:bg-gray-800/30">
                                                        <td className="px-4 py-2 text-sm text-gray-200">{line.item_name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-400">{line.unit}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-300 text-right">{formatNumber(line.requested_qty)}</td>
                                                        <td className={`px-4 py-2 text-sm text-right ${parseFloat(line.final_qty) !== parseFloat(line.requested_qty) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                            {formatNumber(line.final_qty)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-300 text-right">{formatCurrency(line.unit_price)}</td>
                                                        <td className="px-4 py-2 text-sm text-emerald-400 text-right">{formatCurrency(line.line_total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Yearly Statistics Tab ───────────────────────────────────
function YearlyTab({ yearlyData, year, pair, onYearChange }) {
    const handleExport = () => {
        window.location.href = `/summary/export/excel?year=${year}&pair=${pair}&type=yearly`;
    };

    const data = yearlyData || [];

    // Compute grand totals per month
    const monthTotals = {};
    for (let m = 1; m <= 12; m++) monthTotals[m] = 0;
    let grandTotal = 0;
    data.forEach((item) => {
        for (let m = 1; m <= 12; m++) {
            monthTotals[m] += item.months?.[m] || 0;
        }
        grandTotal += item.total || 0;
    });

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Year</label>
                    <select
                        value={year}
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        className="rounded-md bg-gray-800 border-gray-600 text-white text-sm focus:border-red-500 focus:ring-red-500"
                    >
                        {generateYears().map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Export Excel
                </button>
            </div>

            <p className="text-sm text-gray-400">
                Yearly statistics for <span className="text-white font-medium">{year}</span>
                {pair && <>, pair <span className="text-white font-medium">{pair}</span></>}
            </p>

            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700/50">
                        <thead className="bg-[#252540]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase sticky left-0 bg-[#252540] z-10">Item</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unit</th>
                                {MONTHS.map((m) => (
                                    <th key={m.value} className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase min-w-[60px]">
                                        {m.short}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {data.length > 0 ? (
                                data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-200 sticky left-0 bg-[#1e1e2e] z-10">{item.item_name}</td>
                                        <td className="px-3 py-3 text-sm text-gray-400">{item.unit}</td>
                                        {MONTHS.map((m) => (
                                            <td key={m.value} className="px-3 py-3 text-sm text-gray-300 text-right">
                                                {item.months?.[m.value] ? formatNumber(item.months[m.value]) : '-'}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-sm font-medium text-emerald-400 text-right">{formatNumber(item.total)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={15} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No yearly data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot className="bg-[#252540]">
                                <tr>
                                    <td className="px-4 py-3 text-sm font-bold text-white sticky left-0 bg-[#252540] z-10">Grand Total</td>
                                    <td className="px-3 py-3"></td>
                                    {MONTHS.map((m) => (
                                        <td key={m.value} className="px-3 py-3 text-sm font-bold text-emerald-400 text-right">
                                            {monthTotals[m.value] ? formatNumber(monthTotals[m.value]) : '-'}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-sm font-bold text-emerald-400 text-right">{formatNumber(grandTotal)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────
export default function SummaryIndex({
    overview = {},
    pairData = {},
    yearlyData = [],
    year,
    month,
    pair,
    view,
    pairs = [],
    stores = [],
}) {
    const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(month || new Date().getMonth() + 1);
    const [selectedPair, setSelectedPair] = useState(pair || (pairs.length > 0 ? pairs[0] : ''));
    const [activeTab, setActiveTab] = useState(view || 'overview');

    // Build all tab definitions
    const tabs = [
        { key: 'overview', label: 'Overview', icon: ChartBarIcon },
        ...pairs.map((p) => ({ key: `pair-${p}`, label: p, icon: TableCellsIcon })),
        { key: 'yearly', label: 'Yearly Statistics', icon: ChartBarIcon },
    ];

    const navigate = (overrides = {}) => {
        const params = {
            year: overrides.year ?? selectedYear,
            month: overrides.month ?? selectedMonth,
            pair: overrides.pair ?? selectedPair,
            view: overrides.view ?? activeTab,
        };

        // Map pair-XX tab keys back to view
        if (params.view.startsWith('pair-')) {
            params.pair = params.view.replace('pair-', '');
            params.view = 'monthly';
        }

        router.visit('/summary', {
            data: params,
            preserveState: true,
            replace: true,
        });
    };

    const handleTabClick = (tabKey) => {
        setActiveTab(tabKey);
        const overrides = { view: tabKey };
        if (tabKey.startsWith('pair-')) {
            const p = tabKey.replace('pair-', '');
            setSelectedPair(p);
            overrides.pair = p;
        }
        navigate(overrides);
    };

    const handleYearChange = (y) => {
        setSelectedYear(y);
        navigate({ year: y });
    };

    const handleMonthChange = (m) => {
        setSelectedMonth(m);
        navigate({ month: m });
    };

    // On mount, sync activeTab from view + pair props
    useEffect(() => {
        if (view === 'monthly' && pair) {
            setActiveTab(`pair-${pair}`);
        } else if (view === 'yearly') {
            setActiveTab('yearly');
        } else {
            setActiveTab('overview');
        }
    }, [view, pair]);

    return (
        <Layout>
            <Head title="Summary" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">Order Summary</h1>

                {/* Top filter bar for year/month (shown on overview) */}
                {activeTab === 'overview' && (
                    <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                    className="rounded-md bg-gray-800 border-gray-600 text-white text-sm focus:border-red-500 focus:ring-red-500"
                                >
                                    {generateYears().map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                                    className="rounded-md bg-gray-800 border-gray-600 text-white text-sm focus:border-red-500 focus:ring-red-500"
                                >
                                    {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab navigation */}
                <div className="border-b border-gray-700/50">
                    <nav className="-mb-px flex space-x-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.key;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabClick(tab.key)}
                                    className={`whitespace-nowrap flex items-center gap-1.5 border-b-2 py-3 px-4 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'border-red-500 text-red-400 bg-red-500/5'
                                            : 'border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-300'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab content */}
                {activeTab === 'overview' && (
                    <OverviewTab overview={overview} year={selectedYear} month={selectedMonth} />
                )}

                {activeTab.startsWith('pair-') && (
                    <PairTab
                        pairData={pairData}
                        pair={selectedPair}
                        year={selectedYear}
                        month={selectedMonth}
                        onYearChange={handleYearChange}
                        onMonthChange={handleMonthChange}
                    />
                )}

                {activeTab === 'yearly' && (
                    <YearlyTab
                        yearlyData={yearlyData}
                        year={selectedYear}
                        pair={selectedPair}
                        onYearChange={handleYearChange}
                    />
                )}
            </div>
        </Layout>
    );
}
