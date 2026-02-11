import React, { useState, useMemo } from 'react';
import type { Dataset } from '../types/database';

interface DKPViewerProps {
    initDataset: Dataset;
    latestDataset: Dataset;
    onBack: () => void;
}

const DKPViewer: React.FC<DKPViewerProps> = ({ initDataset, latestDataset, onBack }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
        key: 'score',
        direction: 'desc',
    });
    const [selectedGovernor, setSelectedGovernor] = useState<any | null>(null);

    // Helper to parse numbers
    const parseNumber = (v: any) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            const num = parseFloat(v.replace(/,/g, ''));
            return isNaN(num) ? 0 : num;
        }
        return 0;
    };

    // calculate Comparison Data
    const data = useMemo(() => {
        const latestData = latestDataset.json_data || [];
        const initData = initDataset.json_data || [];

        const kpKeys = ['total_kp', 'Total KP', 'KP', 'kp', 'Kill Points', 'Total Kill Points'];
        const deadKeys = ['dead_troops', 'Dead', 'Deads', 'dead', 'Dead Troops'];
        const powerKeys = ['power', 'Power', 'POWER'];
        const t4Keys = ['t4_kills', 'T4 Kills', 'T4-Kills', 't4-kills', 'T4Kills'];
        const t5Keys = ['t5_kills', 'T5 Kills', 'T5-Kills', 't5-kills', 'T5Kills'];
        const idKeys = ['governor_id', 'id', 'ID', 'Governor ID', 'uid', 'UID'];
        const nameKeys = ['govExact_name', 'name', 'Name', 'governor_name', 'Username', 'exactName', 'Nickname', 'NICKNAME'];

        const getValue = (row: any, keys: string[]) => {
            if (!row) return 0;
            for (const k of keys) {
                if (row[k] !== undefined) return parseNumber(row[k]);
            }
            return 0;
        };

        const getString = (row: any, keys: string[]) => {
            if (!row) return '';
            for (const k of keys) {
                if (row[k] !== undefined) return String(row[k]);
            }
            return '';
        };

        // Helper to find init governor
        const findInit = (gov: any) => {
            // Try ID match
            const id = getString(gov, idKeys);
            if (id) {
                const cleanId = id.replace(/,/g, '').trim();
                return initData.find((row: any) => {
                    const initId = getString(row, idKeys);
                    return initId.replace(/,/g, '').trim() === cleanId;
                });
            }
            // Fallback to Name match
            const name = getString(gov, nameKeys);
            if (name) {
                const cleanName = name.trim().toLowerCase();
                return initData.find((row: any) => {
                    const initName = getString(row, nameKeys);
                    return initName.trim().toLowerCase() === cleanName;
                });
            }
            return null;
        };

        const results: any[] = [];
        latestData.forEach((gov: any) => {
            const init = findInit(gov);
            if (!init) return;

            const id = getString(gov, idKeys);
            const name = getString(gov, nameKeys);
            const power = getValue(gov, powerKeys);

            const currentKp = getValue(gov, kpKeys);
            const initKp = getValue(init, kpKeys);
            const kp_gained = currentKp - initKp;

            const currentDead = getValue(gov, deadKeys);
            const initDead = getValue(init, deadKeys);
            const dead_gained = currentDead - initDead;

            const currentT4 = getValue(gov, t4Keys);
            const initT4 = getValue(init, t4Keys);
            const t4_gained = currentT4 - initT4;

            const currentT5 = getValue(gov, t5Keys);
            const initT5 = getValue(init, t5Keys);
            const t5_gained = currentT5 - initT5;

            const score = (t4_gained * 10) + (t5_gained * 20) + (dead_gained * 10);

            results.push({
                id,
                name,
                power,
                score,
                kp_gained,
                dead_gained,
                t4_gained,
                t5_gained,
                currentKp,
                currentDead,
                initPower: getValue(init, powerKeys),
                initKp,
                powerDrop: getValue(init, powerKeys) - power
            });
        });
        return results;
    }, [latestDataset, initDataset]);

    // Sorting and Ranking
    const processedData = useMemo(() => {
        // Calculate absolute ranks FIRST from the full dataset
        const sortedByKp = [...data].sort((a, b) => b.kp_gained - a.kp_gained);
        const dataWithRanks = data.map(row => {
            const rank = sortedByKp.findIndex(r => r.id === row.id) + 1;
            return { ...row, rank };
        });

        // Then apply filtering
        let result = [...dataWithRanks];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(row =>
                row.name.toLowerCase().includes(lower) ||
                row.id.toLowerCase().includes(lower)
            );
        }

        // Then apply sorting
        if (sortConfig.key) {
            result.sort((a: any, b: any) => {
                const valA = a[sortConfig.key!];
                const valB = b[sortConfig.key!];

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = processedData.slice(startIndex, startIndex + itemsPerPage);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const headers = [
        { key: 'rank', label: 'Rank', numeric: true },
        { key: 'id', label: 'ID', numeric: false },
        { key: 'name', label: 'Name', numeric: false },
        { key: 'power', label: 'Power', numeric: true },
        { key: 'kp_gained', label: 'KP Gained', numeric: true },
        { key: 'dead_gained', label: 'Dead Gained', numeric: true },
        { key: 'score', label: 'Score', numeric: true },
    ];

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">DKP Tracker</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>{new Date(initDataset.created_at).toLocaleDateString()}</span>
                            <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            <span>{new Date(latestDataset.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0">
                {/* Toolbar */}
                <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white shrink-0 gap-3 sm:gap-4">
                    <div className="relative w-full sm:max-w-sm">
                        <input
                            type="text"
                            placeholder="Search by Name or ID..."
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

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 font-semibold border-b border-slate-200 bg-slate-50 w-16 text-center">#</th>
                                {headers.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-6 py-3 font-semibold border-b border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none ${col.numeric ? 'text-right' : 'text-left'}`}
                                        onClick={() => requestSort(col.key)}
                                    >
                                        <div className={`flex items-center gap-1 ${col.numeric ? 'justify-end' : ''}`}>
                                            {col.label}
                                            {sortConfig.key === col.key && (
                                                <span className="material-symbols-outlined text-sm">
                                                    {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentData.length > 0 ? (
                                currentData.map((row, index) => (
                                    <tr
                                        key={index}
                                        onClick={() => setSelectedGovernor(row)}
                                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-3 border-r border-slate-50 text-slate-400 text-xs text-center font-mono">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-6 py-3 text-center font-bold text-indigo-600">
                                            #{row.rank}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-slate-600">{row.id}</td>
                                        <td className="px-6 py-3 font-medium text-slate-800">{row.name}</td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-600">{row.power.toLocaleString()}</td>
                                        <td className={`px-6 py-3 text-right font-mono font-bold ${row.kp_gained > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                            {row.kp_gained > 0 ? '+' : ''}{row.kp_gained.toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-3 text-right font-mono font-bold ${row.dead_gained > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                            {row.dead_gained > 0 ? '+' : ''}{row.dead_gained.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-indigo-600">
                                            {row.score.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="flex items-center text-xs text-slate-500">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
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

            {/* Governor Detail Modal */}
            {selectedGovernor && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedGovernor(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedGovernor(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>

                        {/* Header */}
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Governor Details</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="font-mono">{selectedGovernor.id}</span>
                                <span>•</span>
                                <span className="font-medium">{selectedGovernor.name}</span>
                            </div>
                        </div>

                        {/* Circular Progress */}
                        <div className="flex flex-col items-center mb-6">
                            {(() => {
                                const completion = selectedGovernor.initPower > 0
                                    ? Math.min((selectedGovernor.kp_gained / (selectedGovernor.initPower * 3)) * 100, 100)
                                    : 0;
                                const radius = 85;
                                const circumference = 2 * Math.PI * radius;
                                const offset = circumference - (completion / 100) * circumference;

                                // Calculate color based on percentage (red -> yellow -> green)
                                const getProgressColor = (percent: number) => {
                                    if (percent >= 100) return { start: '#10b981', end: '#059669' }; // Green
                                    if (percent >= 75) return { start: '#84cc16', end: '#65a30d' }; // Lime
                                    if (percent >= 50) return { start: '#eab308', end: '#ca8a04' }; // Yellow
                                    if (percent >= 25) return { start: '#f97316', end: '#ea580c' }; // Orange
                                    return { start: '#ef4444', end: '#dc2626' }; // Red
                                };

                                const colors = getProgressColor(completion);
                                const textColor = completion >= 75 ? 'text-green-600' :
                                    completion >= 50 ? 'text-yellow-600' :
                                        completion >= 25 ? 'text-orange-600' : 'text-red-600';
                                const glowColor = completion >= 75 ? '#10b98120' :
                                    completion >= 50 ? '#eab30820' :
                                        completion >= 25 ? '#f9731620' : '#ef444420';

                                return (
                                    <>
                                        <div className="relative w-56 h-56 mb-3">
                                            <svg className="transform -rotate-90 w-56 h-56 filter drop-shadow-lg">
                                                {/* Outer glow circle */}
                                                <circle
                                                    cx="112"
                                                    cy="112"
                                                    r={radius}
                                                    stroke={glowColor}
                                                    strokeWidth="20"
                                                    fill="none"
                                                />
                                                {/* Background circle */}
                                                <circle
                                                    cx="112"
                                                    cy="112"
                                                    r={radius}
                                                    stroke="#f1f5f9"
                                                    strokeWidth="16"
                                                    fill="none"
                                                />
                                                {/* Progress circle with gradient */}
                                                <defs>
                                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor={colors.start} />
                                                        <stop offset="100%" stopColor={colors.end} />
                                                    </linearGradient>
                                                </defs>
                                                <circle
                                                    cx="112"
                                                    cy="112"
                                                    r={radius}
                                                    stroke="url(#progressGradient)"
                                                    strokeWidth="16"
                                                    fill="none"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={offset}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-700 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div className="text-center">
                                                    <span className={`text-5xl font-black tracking-tight ${textColor}`}>
                                                        {completion.toFixed(0)}
                                                    </span>
                                                    <span className={`text-2xl font-bold ${textColor.replace('600', '500')}`}>%</span>
                                                </div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Completion</span>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-full px-4 py-2 border border-slate-200">
                                            <p className="text-xs font-medium text-slate-600 text-center">
                                                <span className="font-bold text-slate-800">{selectedGovernor.kp_gained.toLocaleString()}</span>
                                                {' / '}
                                                <span className="text-slate-500">{(selectedGovernor.initPower * 3).toLocaleString()}</span>
                                                {' KP'}
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="text-xs text-slate-500 mb-1">Power Change</div>
                                <div className={`text-lg font-bold font-mono ${selectedGovernor.powerDrop > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {selectedGovernor.powerDrop > 0 ? '-' : '+'}{Math.abs(selectedGovernor.powerDrop).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="text-xs text-slate-500 mb-1">KP Gained</div>
                                <div className="text-lg font-bold font-mono text-green-600">
                                    +{selectedGovernor.kp_gained.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DKPViewer;
