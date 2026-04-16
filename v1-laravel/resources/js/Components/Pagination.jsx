import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    return (
        <nav className="flex items-center justify-between border-t border-gray-700/50 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                {links[0].url ? (
                    <Link href={links[0].url} className="relative inline-flex items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">
                        Previous
                    </Link>
                ) : (
                    <span className="relative inline-flex items-center rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-500">
                        Previous
                    </span>
                )}
                {links[links.length - 1].url ? (
                    <Link href={links[links.length - 1].url} className="relative ml-3 inline-flex items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">
                        Next
                    </Link>
                ) : (
                    <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-500">
                        Next
                    </span>
                )}
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        {links.map((link, index) => {
                            const label = link.label
                                .replace('&laquo;', '\u00AB')
                                .replace('&raquo;', '\u00BB');

                            if (!link.url) {
                                return (
                                    <span
                                        key={index}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                            link.active
                                                ? 'z-10 bg-red-600 text-white'
                                                : 'text-gray-500 ring-1 ring-inset ring-gray-700'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: label }}
                                    />
                                );
                            }

                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        link.active
                                            ? 'z-10 bg-red-600 text-white'
                                            : 'text-gray-300 ring-1 ring-inset ring-gray-700 hover:bg-gray-800'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: label }}
                                />
                            );
                        })}
                    </nav>
                </div>
            </div>
        </nav>
    );
}
