import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeftIcon, PlusIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';

export default function EditRecipe({ item, recipe, rawMaterials, units }) {
    const isEdit = !!recipe;

    const { data, setData, post, processing, errors } = useForm({
        name: recipe?.name || `${item.name} Recipe`,
        output_qty: recipe?.output_qty || 1,
        output_unit: recipe?.output_unit || 'L',
        labor_hours: recipe?.labor_hours || 0,
        labor_rate: recipe?.labor_rate || 16,
        waste_percent: recipe?.waste_percent || 0,
        markup_percent: recipe?.markup_percent || 30,
        notes: recipe?.notes || '',
        lines: recipe?.lines?.length > 0
            ? recipe.lines.map(l => ({
                raw_material_id: l.raw_material_id,
                qty_required: l.qty_required,
                unit: l.unit,
                notes: l.notes || '',
            }))
            : [{ raw_material_id: '', qty_required: '', unit: '', notes: '' }],
    });

    const addLine = () => {
        setData('lines', [...data.lines, { raw_material_id: '', qty_required: '', unit: '', notes: '' }]);
    };

    const removeLine = (index) => {
        if (data.lines.length <= 1) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const updateLine = (index, field, value) => {
        const updated = [...data.lines];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-fill unit from raw material base_unit if selecting material
        if (field === 'raw_material_id' && value) {
            const mat = rawMaterials.find(m => m.id === parseInt(value));
            if (mat && !updated[index].unit) {
                updated[index].unit = mat.base_unit;
            }
        }

        setData('lines', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/cost-engine/${item.id}/recipe`);
    };

    const inputClass = 'block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm';
    const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

    return (
        <Layout>
            <Head title={`${isEdit ? 'Edit' : 'Create'} Recipe - ${item.name}`} />

            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/cost-engine/${item.id}`}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BeakerIcon className="h-7 w-7 text-cyan-400" />
                            {isEdit ? 'Edit' : 'Create'} Recipe
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {item.code} - {item.name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Recipe Details */}
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white border-b border-gray-700/50 pb-3">Recipe Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Recipe Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Output Qty</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.output_qty}
                                        onChange={(e) => setData('output_qty', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    {errors.output_qty && <p className="mt-1 text-sm text-red-400">{errors.output_qty}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Output Unit</label>
                                    <select
                                        value={data.output_unit}
                                        onChange={(e) => setData('output_unit', e.target.value)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    {errors.output_unit && <p className="mt-1 text-sm text-red-400">{errors.output_unit}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className={labelClass}>Labor Hours</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={data.labor_hours}
                                    onChange={(e) => setData('labor_hours', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                                {errors.labor_hours && <p className="mt-1 text-sm text-red-400">{errors.labor_hours}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Labor Rate ($/hr)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.labor_rate}
                                    onChange={(e) => setData('labor_rate', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                                {errors.labor_rate && <p className="mt-1 text-sm text-red-400">{errors.labor_rate}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Waste %</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={data.waste_percent}
                                    onChange={(e) => setData('waste_percent', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                                {errors.waste_percent && <p className="mt-1 text-sm text-red-400">{errors.waste_percent}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Markup %</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={data.markup_percent}
                                    onChange={(e) => setData('markup_percent', e.target.value)}
                                    className={inputClass}
                                    required
                                />
                                {errors.markup_percent && <p className="mt-1 text-sm text-red-400">{errors.markup_percent}</p>}
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Notes</label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className={inputClass}
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Ingredient Lines */}
                    <div className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-between border-b border-gray-700/50 pb-3 mb-4">
                            <h2 className="text-lg font-semibold text-white">Ingredients</h2>
                            <button
                                type="button"
                                onClick={addLine}
                                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Add Ingredient
                            </button>
                        </div>

                        {errors.lines && <p className="mb-3 text-sm text-red-400">{errors.lines}</p>}

                        <div className="space-y-3">
                            {data.lines.map((line, index) => (
                                <div key={index} className="flex gap-3 items-start bg-[#252540] rounded-lg p-3">
                                    <div className="flex items-center text-gray-500 text-sm font-mono pt-7 w-6">
                                        {index + 1}.
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Raw Material</label>
                                        <select
                                            value={line.raw_material_id}
                                            onChange={(e) => updateLine(index, 'raw_material_id', e.target.value)}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">Select material...</option>
                                            {rawMaterials.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.code} - {m.name} ({m.base_unit})
                                                </option>
                                            ))}
                                        </select>
                                        {errors[`lines.${index}.raw_material_id`] && (
                                            <p className="mt-1 text-xs text-red-400">{errors[`lines.${index}.raw_material_id`]}</p>
                                        )}
                                    </div>
                                    <div className="w-28">
                                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={line.qty_required}
                                            onChange={(e) => updateLine(index, 'qty_required', e.target.value)}
                                            className={inputClass}
                                            placeholder="0"
                                            required
                                        />
                                        {errors[`lines.${index}.qty_required`] && (
                                            <p className="mt-1 text-xs text-red-400">{errors[`lines.${index}.qty_required`]}</p>
                                        )}
                                    </div>
                                    <div className="w-28">
                                        <label className="block text-xs text-gray-500 mb-1">Unit</label>
                                        <select
                                            value={line.unit}
                                            onChange={(e) => updateLine(index, 'unit', e.target.value)}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">Unit...</option>
                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                        {errors[`lines.${index}.unit`] && (
                                            <p className="mt-1 text-xs text-red-400">{errors[`lines.${index}.unit`]}</p>
                                        )}
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={() => removeLine(index)}
                                            disabled={data.lines.length <= 1}
                                            className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href={`/cost-engine/${item.id}`}
                            className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Saving...' : (isEdit ? 'Update Recipe' : 'Create Recipe')}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
