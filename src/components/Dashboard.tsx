import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import UploadModal from './UploadModal';
import { supabase } from '../lib/supabase';
import type { Project, Dataset } from '../types/database';

interface DashboardProps {
    activeProject: Project;
    onSelectDataset: (dataset: Dataset) => void;
    onLaunchDKP: (init: Dataset, latest: Dataset) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeProject, onSelectDataset, onLaunchDKP }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDatasets();
    }, [activeProject.id]);

    const fetchDatasets = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('datasets')
            .select('*')
            .eq('project_id', activeProject.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching datasets:', error);
            toast.error('Failed to load datasets');
        } else {
            setDatasets(data || []);
        }
        setIsLoading(false);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-medium text-slate-800">Delete this scan?</span>
                <span className="text-sm text-slate-500">This cannot be undone.</span>
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await deleteDataset(id);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            icon: '⚠️',
        });
    };

    const deleteDataset = async (id: string) => {
        const toastId = toast.loading('Deleting scan...');
        try {
            const { error } = await supabase
                .from('datasets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setDatasets(prev => prev.filter(d => d.id !== id));
            toast.success('Scan deleted successfully', { id: toastId });
        } catch (error) {
            console.error("Error deleting dataset:", error);
            toast.error("Failed to delete dataset", { id: toastId });
        }
    };

    // Identify Init and Latest Scans
    // datasets are already sorted by created_at desc (newest first)


    return (
        <>




            {/* DKP Tracker Card */}
            {datasets.length >= 2 && (
                <>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Features</h2>
                    <button
                        onClick={() => {
                            const latest = datasets[0];
                            const init = datasets[datasets.length - 1];
                            onLaunchDKP(init, latest);
                        }}
                        className="group bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl border-2 border-indigo-400/50 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center gap-4 text-left mb-6 w-full"
                    >
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0">
                            <span className="material-symbols-outlined text-2xl font-bold">monitoring</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-white mb-1">DKP Tracker</h3>
                            <p className="text-xs text-indigo-100">Compare first and latest scans to track governor progress</p>
                        </div>
                        <span className="material-symbols-outlined text-white text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </>
            )}

            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Scans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {isLoading ? (
                    // Skeleton Loaders
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 animate-pulse flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-md shrink-0"></div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    // Dataset Cards
                    datasets.map((dataset) => (
                        <div
                            key={dataset.id}
                            onClick={() => onSelectDataset(dataset)}
                            className="group bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 transition-all flex items-center gap-3 cursor-pointer relative"
                        >
                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDeleteClick(e, dataset.id)}
                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
                                title="Delete Scan"
                            >
                                <span className="material-symbols-outlined text-base">delete</span>
                            </button>

                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0 self-start mt-1">
                                <span className="material-symbols-outlined text-xl">table_chart</span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-slate-800 truncate" title={dataset.name || dataset.file_name}>
                                    {dataset.name || dataset.file_name}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                    {new Date(dataset.scan_date || dataset.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}

                {/* New Scan Card (Always visible or visible after loading?) */}
                {!isLoading && (
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="group bg-white p-3 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-center gap-3 text-left h-[66px]"
                    >
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-md flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
                            <span className="material-symbols-outlined text-xl font-bold">add</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">New Scan</h3>
                        </div>
                    </button>
                )}
            </div >

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    fetchDatasets();
                }}
                projectId={activeProject.id}
            />
        </>
    );
};

export default Dashboard;
