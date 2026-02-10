import React, { useState, useMemo } from 'react';
import type { Dataset } from '../types/database';
import GovernorStatsModal from './GovernorStatsModal';

interface ComparisonViewerProps {
    initDataset: Dataset;
    latestDataset: Dataset;
    onBack: () => void;
}

const ComparisonViewer: React.FC<ComparisonViewerProps> = ({ initDataset, latestDataset, onBack }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGovernor, setSelectedGovernor] = useState<any | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    // Use latestDataset for the table data
    // Compute Ranks based on KP Increase
    const data = useMemo(() => {
        const latestData = latestDataset.json_data || [];
        const initData = initDataset.json_data || [];

        // Helper to find init governor
        const findInit = (gov: any) => {
            const id = gov['governor_id'] || gov['id'] || gov['ID'];
            if (id) {
                return initData.find((row: any) => String(row['governor_id'] || row['id'] || row['ID']) === String(id));
            }
            const name = gov['govExact_name'] || gov['name'] || gov['Name'] || gov['governor_name'];
            if (name) {
                return initData.find((row: any) => {
                    const n = row['govExact_name'] || row['name'] || row['Name'] || row['governor_name'];
                    return String(n).toLowerCase() === String(name).toLowerCase();
                });
            }
            return null;
        };

        // Helper to parse
        const parse = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val.replace(/,/g, '') || '0');
            return 0;
        };
        const kpKeys = ['total_kp', 'Total KP', 'KP', 'kp', 'Kill Points'];
        const getKp = (row: any) => {
            if (!row) return 0;
            for (const k of kpKeys) if (row[k] !== undefined) return parse(row[k]);
            return 0;
        };

        // Calculate Increase for everyone
        const withDiffs = latestData.map((gov: any) => {
            const init = findInit(gov);
            const curKp = getKp(gov);
            const initKp = getKp(init);
            const increase = curKp - initKp;
            return { ...gov, _kp_increase: increase };
        });

        // Sort by Increase DESC to assign rank
        withDiffs.sort((a: any, b: any) => b._kp_increase - a._kp_increase);

        // Assign Rank and Return
        return withDiffs.map((gov: any, index: number) => ({
            ...gov,
            dkp_rank: index + 1
        }));
    }, [latestDataset, initDataset]);

    const headers = ['dkp_rank', ...(latestDataset.column_headers || []).filter(h => {
        const lower = h.toLowerCase();
        return lower !== 'id' && lower !== 'governor_name';
    })];

    // Helper to request a sort
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and Sort Data
    const processedData = useMemo(() => {
        let result = [...data];

        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter((row: any) => {
                return headers.some(header => {
                    const val = row[header];
                    return String(val).toLowerCase().includes(lowerTerm);
                });
            });
        }

        // 2. Sort
        if (sortConfig.key) {
            result.sort((a: any, b: any) => {
                const key = sortConfig.key!;
                const valA = a[key];
                const valB = b[key];

                const parseVal = (v: any) => {
                    if (typeof v === 'string') {
                        const num = parseFloat(v.replace(/,/g, ''));
                        return isNaN(num) ? v.toLowerCase() : num;
                    }
                    return v;
                };

                const parsedA = parseVal(valA);
                const parsedB = parseVal(valB);

                if (parsedA < parsedB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (parsedA > parsedB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, sortConfig, searchTerm, headers]);

    // Pagination Logic
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = processedData.slice(startIndex, startIndex + itemsPerPage);

    const getHeaderLabel = (header: string) => {
        const labels: Record<string, string> = {
            'dkp_rank': 'RANK',
            'governor_id': 'UID',
            'govExact_name': 'NICKNAME',
            'power': 'POWER',
            'total_kp': 'TOTAL KP',
            't4_kills': 'T4 KILLS',
            't5_kills': 'T5 KILLS',
            'dead_troops': 'DEAD',
            'rss_assistance': 'RSS ASSISTED',
            'alliance_tag': 'ALLIANCE'
        };
        return labels[header] || header;
    };

    const isNumericColumn = (header: string) => {
        const numericCols = ['dkp_rank', 'power', 'total_kp', 't4_kills', 't5_kills', 'dead_troops', 'rss_assistance', 't4-kills', 't5-kills'];
        return numericCols.includes(header.toLowerCase());
    };

    const formatCellValue = (header: string, value: any) => {
        if (header === 'dkp_rank') {
            return <span className="font-bold text-slate-800">#{value}</span>;
        }
        if (!value) return '-';
        if (isNumericColumn(header)) {
            const num = parseFloat(String(value).replace(/,/g, ''));
            return isNaN(num) ? value : num.toLocaleString();
        }
        return value;
    };

    const handleRowClick = (row: any) => {
        // Validation: Ensure we have an ID to match against
        const id = row['governor_id'] || row['id'] || row['ID']; // Adjust based on actual CSV headers
        if (!id) {
            console.warn("No ID found for row", row);
        }

        setSelectedGovernor(row);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Top Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">DKP Tracking</h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {latestDataset.name || latestDataset.file_name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0">
                {/* Table Toolbar */}
                <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Search Input */}
                        <div className="relative max-w-sm w-full">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                search
                            </span>
                        </div>

                        <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            Showing {processedData.length.toLocaleString()} rows
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rows:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors min-w-[70px]"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 font-semibold border-b border-slate-200 bg-slate-50 w-16 text-center">ID</th>
                                {headers.map((header, index) => (
                                    <th
                                        key={index}
                                        className={`px-6 py-3 font-semibold border-b border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none ${isNumericColumn(header) ? 'text-right' : 'text-left'}`}
                                        onClick={() => requestSort(header)}
                                    >
                                        <div className={`flex items-center gap-1 ${isNumericColumn(header) ? 'justify-end' : ''}`}>
                                            {getHeaderLabel(header)}
                                            {sortConfig.key === header && (
                                                <span className="material-symbols-outlined text-sm">
                                                    {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                                </span>
                                            )}
                                            {sortConfig.key !== header && (
                                                <span className="material-symbols-outlined text-sm text-slate-300 opacity-0 group-hover:opacity-100">
                                                    unfold_more
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentData.length > 0 ? (
                                currentData.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                                        onClick={() => handleRowClick(row)}
                                    >
                                        <td className="px-6 py-3 border-r border-slate-50 text-slate-400 text-xs text-center font-mono">
                                            {startIndex + rowIndex + 1}
                                        </td>
                                        {headers.map((header, colIndex) => (
                                            <td key={colIndex} className={`px-6 py-3 whitespace-nowrap max-w-[300px] truncate ${isNumericColumn(header) ? 'text-right font-mono text-slate-600' : ''}`} title={String(row[header] || '')}>
                                                {formatCellValue(header, row[header])}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={headers.length + 1} className="px-6 py-12 text-center text-slate-400">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <span className="text-xs text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{processedData.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, processedData.length)}</span> of <span className="font-semibold text-slate-700">{processedData.length}</span> entries
                    </span>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 3 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-7 h-7 flex items-center justify-center text-xs rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {selectedGovernor && (
                <GovernorStatsModal
                    governor={selectedGovernor}
                    initDataset={initDataset}
                    rank={selectedGovernor.dkp_rank}
                    onClose={() => setSelectedGovernor(null)}
                />
            )}
        </div>
    );
};

export default ComparisonViewer;
