
import React, { useMemo } from 'react';
import type { Dataset } from '../types/database';

interface GovernorStatsModalProps {
    governor: any;
    initDataset: Dataset;
    rank?: number;
    onClose: () => void;
}

const GovernorStatsModal: React.FC<GovernorStatsModalProps> = ({ governor, initDataset, rank, onClose }) => {

    // Find matching governor in initDataset
    const initGov = useMemo(() => {
        if (!initDataset.json_data) return null;

        // Try ID match first
        const id = governor['governor_id'] || governor['id'] || governor['ID'];
        if (id) {
            const match = initDataset.json_data.find((row: any) => {
                const initId = row['governor_id'] || row['id'] || row['ID'];
                return String(initId) === String(id);
            });
            if (match) return match;
        }

        // Fallback to Name match (riskier but useful)
        const name = governor['govExact_name'] || governor['name'] || governor['Name'] || governor['governor_name'];
        if (name) {
            return initDataset.json_data.find((row: any) => {
                const initName = row['govExact_name'] || row['name'] || row['Name'] || row['governor_name'];
                return String(initName).toLowerCase() === String(name).toLowerCase();
            });
        }

        return null;
    }, [governor, initDataset]);

    // Helper to parse numbers
    const parseNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return parseFloat(val.replace(/,/g, '') || '0');
        return 0;
    };

    const formatNum = (num: number) => new Intl.NumberFormat('en-US').format(num);

    // Calculate Stats
    const stats = useMemo(() => {
        // IDs for keys might vary, need robust getter
        const getVal = (row: any, keys: string[]) => {
            if (!row) return 0;
            for (const k of keys) {
                if (row[k] !== undefined) return parseNum(row[k]);
            }
            return 0;
        };

        const powerKeys = ['power', 'Power', 'POWER'];
        const kpKeys = ['total_kp', 'Total KP', 'KP', 'kp', 'Kill Points'];
        const deadKeys = ['dead_troops', 'Dead', 'Deads', 'dead'];

        const curPower = getVal(governor, powerKeys);
        const initPower = getVal(initGov, powerKeys);

        const curKp = getVal(governor, kpKeys);
        const initKp = getVal(initGov, kpKeys);

        const curDead = getVal(governor, deadKeys);
        const initDead = getVal(initGov, deadKeys);

        const diffPower = curPower - initPower;
        const diffKp = curKp - initKp;
        const diffDead = curDead - initDead;

        // DKP Calculation
        // Target KP Gain = Init Power * 3 (300%)
        const targetKpGain = initPower * 3;
        const actualKpGain = diffKp; // Assuming KP only goes up. If it went down, this is negative, which is correct.

        // Avoid division by zero
        const completionPercent = targetKpGain > 0 ? (actualKpGain / targetKpGain) * 100 : 0;

        return {
            curPower, initPower, diffPower,
            curKp, initKp, diffKp,
            curDead, initDead, diffDead,
            targetKpGain,
            completionPercent
        };
    }, [governor, initGov]);

    // Safe Name Display
    const govName = governor['govExact_name'] || governor['name'] || governor['Name'] || 'Unknown Governor';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-800">{govName}</h3>
                            {rank && (
                                <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200 shadow-sm">
                                    Rank #{rank}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {initGov ? 'Comparison Data Found' : 'No Initial Data Found'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Progress Section */}
                    {initGov && (
                        <div className="flex flex-col items-center justify-center mb-6">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                {/* Simple CSS Conic Gradient for Circular Progress */}
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: `conic-gradient(${stats.completionPercent >= 100 ? '#22c55e' : '#3b82f6'} ${Math.min(stats.completionPercent, 100) * 3.6}deg, #f1f5f9 0deg)`
                                    }}
                                ></div>
                                <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                                    <span className={`text-2xl font-bold ${stats.completionPercent >= 100 ? 'text-green-600' : 'text-slate-800'}`}>
                                        {stats.completionPercent.toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completion</span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-500 text-center max-w-[200px]">
                                Target: <span className="font-semibold text-slate-700">{formatNum(stats.targetKpGain)}</span> KP
                                <br />(300% of Initial Power)
                            </p>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Power */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Power</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stats.diffPower >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {stats.diffPower >= 0 ? '+' : ''}{formatNum(stats.diffPower)}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-slate-700">{formatNum(stats.curPower)}</span>
                                {initGov && (
                                    <span className="text-xs text-slate-400 line-through">{formatNum(stats.initPower)}</span>
                                )}
                            </div>
                        </div>

                        {/* KP */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kill Points</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stats.diffKp >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {stats.diffKp >= 0 ? '+' : ''}{formatNum(stats.diffKp)}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-blue-600">{formatNum(stats.curKp)}</span>
                                {initGov && (
                                    <span className="text-xs text-slate-400 line-through">{formatNum(stats.initKp)}</span>
                                )}
                            </div>
                        </div>

                        {/* Dead */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dead Troops</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stats.diffDead >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {stats.diffDead >= 0 ? '+' : ''}{formatNum(stats.diffDead)}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-red-600">{formatNum(stats.curDead)}</span>
                                {initGov && (
                                    <span className="text-xs text-slate-400 line-through">{formatNum(stats.initDead)}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GovernorStatsModal;
