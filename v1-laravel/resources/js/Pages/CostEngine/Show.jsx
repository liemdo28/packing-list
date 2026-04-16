import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import {
    CalculatorIcon,
    PencilSquareIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    BeakerIcon,
} from '@heroicons/react/24/outline';

export default function CostEngineShow({ item, recipe, breakdown, latestCalc, costHistory }) {
    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '$0.00';
        return '$' + Number(val).toFixed(2);
    };

    const handleCalculate = () => {
        router.post(`/cost-engine/${item.id}/calculate`);
    };

    const handleApprove = () => {
        if (!latestCalc) return;
        if (confirm('Approve this cost calculation? This will update the item price in Price Master.')) {
            router.post(`/cost-engine/calculations/${latestCalc.id}/approve`);
        }
    };

    return (
        <Layout>
            <Head title={`Cost Engine - ${item.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/cost-engine"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <BeakerIcon className="h-7 w-7 text-cyan-400" />
                                {item.name}
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                {item.code} | {item.unit} | {item.category} | Current Price: {formatCurrency(item.current_price)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/cost-engine/${item.id}/recipe`}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                        >
                            <PencilSquareIcon className="h-4 w-4 mr-2" />
                            Edit Recipe
                        </Link>
                        {recipe && (
                            <button
                                onClick={handleCalculate}
                                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-2" />
                                Recalculate
                            </button>
                        )}
                        {latestCalc && latestCalc.status === 'draft' && (
                            <button
                                onClick={handleApprove}
                                className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
                            >
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Approve
                            </button>
                        )}
                    </div>
                </div>

                {!recipe ? (
                    <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-12 text-center">
                        <BeakerIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No Recipe Found</h3>
                        <p className="text-gray-500 mb-6">Create a recipe to start calculating costs for this item.</p>
                        <Link
                            href={`/cost-engine/${item.id}/recipe`}
                            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                        >
                            <PencilSquareIcon className="h-4 w-4 mr-2" />
                            Create Recipe
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Recipe Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                                <p className="text-xs text-gray-400 uppercase">Output</p>
                                <p className="text-lg font-bold text-white mt-1">{recipe.output_qty} {recipe.output_unit}</p>
                            </div>
                            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                                <p className="text-xs text-gray-400 uppercase">Waste</p>
                                <p className="text-lg font-bold text-yellow-400 mt-1">{recipe.waste_percent}%</p>
                            </div>
                            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                                <p className="text-xs text-gray-400 uppercase">Markup</p>
                                <p className="text-lg font-bold text-cyan-400 mt-1">{recipe.markup_percent}%</p>
                            </div>
                            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                                <p className="text-xs text-gray-400 uppercase">Labor Hours</p>
                                <p className="text-lg font-bold text-purple-400 mt-1">{recipe.labor_hours}h</p>
                            </div>
                            <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                                <p className="text-xs text-gray-400 uppercase">Labor Rate</p>
                                <p className="text-lg font-bold text-purple-400 mt-1">{formatCurrency(recipe.labor_rate)}/hr</p>
                            </div>
                        </div>

                        {/* Ingredients Table */}
                        <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-700/50">
                                <h2 className="text-lg font-semibold text-white">Ingredients (BOM)</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700/50">
                                    <thead className="bg-[#252540]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Raw Material</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Qty Required</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unit</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Unit Price</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Line Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {recipe.lines.map((line, i) => (
                                            <tr key={i} className="hover:bg-gray-800/50">
                                                <td className="px-6 py-3 text-sm text-gray-500">{i + 1}</td>
                                                <td className="px-6 py-3 text-sm text-white font-medium">
                                                    <span className="text-gray-500 font-mono text-xs mr-2">{line.raw_material_code}</span>
                                                    {line.raw_material_name}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-right text-gray-300">{line.qty_required}</td>
                                                <td className="px-6 py-3 text-sm text-gray-400">{line.unit}</td>
                                                <td className="px-6 py-3 text-sm text-right text-gray-300">{formatCurrency(line.unit_price)}</td>
                                                <td className="px-6 py-3 text-sm text-right font-medium text-white">{formatCurrency(line.line_cost)}</td>
                                            </tr>
                                        ))}
                                        {/* Total row */}
                                        <tr className="bg-[#252540]">
                                            <td colSpan={5} className="px-6 py-3 text-sm font-semibold text-gray-300 text-right">
                                                Total Ingredient Cost
                                            </td>
                                            <td className="px-6 py-3 text-sm text-right font-bold text-emerald-400">
                                                {breakdown ? formatCurrency(breakdown.total_ingredient_cost) : '-'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        {breakdown && (
                            <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-700/50">
                                    <h2 className="text-lg font-semibold text-white">Cost Breakdown</h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-400">Ingredient Cost</span>
                                        <span className="text-white font-medium">{formatCurrency(breakdown.total_ingredient_cost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-400">Labor Cost ({recipe.labor_hours}h x {formatCurrency(recipe.labor_rate)})</span>
                                        <span className="text-purple-400 font-medium">{formatCurrency(breakdown.labor_cost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-400">Waste ({recipe.waste_percent}%)</span>
                                        <span className="text-yellow-400 font-medium">{formatCurrency(breakdown.waste_amount)}</span>
                                    </div>
                                    <div className="border-t border-gray-700/50 flex justify-between items-center py-3">
                                        <span className="text-gray-300 font-medium">Subtotal</span>
                                        <span className="text-white font-semibold">{formatCurrency(breakdown.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-400">Markup ({recipe.markup_percent}%)</span>
                                        <span className="text-cyan-400 font-medium">{formatCurrency(breakdown.markup_amount)}</span>
                                    </div>
                                    <div className="border-t-2 border-emerald-500/30 flex justify-between items-center py-4 mt-2">
                                        <span className="text-lg font-bold text-white">Final Cost</span>
                                        <span className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                                            {formatCurrency(breakdown.final_cost)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-emerald-500/5 rounded-lg px-4 -mx-2">
                                        <span className="text-sm font-medium text-gray-300">Cost Per Unit ({recipe.output_qty} {recipe.output_unit})</span>
                                        <span className="text-lg font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                                            {formatCurrency(breakdown.cost_per_unit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Latest Calculation Status */}
                        {latestCalc && (
                            <div className={`rounded-lg border p-4 ${
                                latestCalc.status === 'approved'
                                    ? 'bg-emerald-500/5 border-emerald-500/30'
                                    : 'bg-yellow-500/5 border-yellow-500/30'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircleIcon className={`h-5 w-5 ${
                                            latestCalc.status === 'approved' ? 'text-emerald-400' : 'text-yellow-400'
                                        }`} />
                                        <div>
                                            <p className={`text-sm font-medium ${
                                                latestCalc.status === 'approved' ? 'text-emerald-300' : 'text-yellow-300'
                                            }`}>
                                                Latest Calculation: {latestCalc.status.charAt(0).toUpperCase() + latestCalc.status.slice(1)}
                                            </p>
                                            <p className="text-xs text-gray-500">{latestCalc.calculated_at}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Final: {formatCurrency(latestCalc.final_cost)}</p>
                                        <p className="text-sm text-gray-400">Per Unit: {formatCurrency(latestCalc.cost_per_unit)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cost History */}
                        {costHistory && costHistory.length > 0 && (
                            <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-700/50">
                                    <h2 className="text-lg font-semibold text-white">Cost History</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700/50">
                                        <thead className="bg-[#252540]">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ingredients</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Labor</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Waste</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Markup</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Final</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Per Unit</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Approved By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {costHistory.map((calc) => (
                                                <tr key={calc.id} className="hover:bg-gray-800/50">
                                                    <td className="px-4 py-3 text-sm text-gray-300">{calc.calculated_at}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-300">{formatCurrency(calc.total_ingredient_cost)}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-300">{formatCurrency(calc.labor_cost)}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-300">{formatCurrency(calc.waste_amount)}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-300">{formatCurrency(calc.markup_amount)}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-white">{formatCurrency(calc.final_cost)}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-cyan-400">{formatCurrency(calc.cost_per_unit)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                                            calc.status === 'approved'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                                : calc.status === 'draft'
                                                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                                                : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                        }`}>
                                                            {calc.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-400">{calc.approved_by_name || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
