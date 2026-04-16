export default function DataTable({ columns, data, emptyMessage = 'No records found.' }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-[#252540]">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-[#1e1e2e] divide-y divide-gray-700/50">
                    {data && data.length > 0 ? (
                        data.map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-gray-800/50">
                                {columns.map((col) => (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
