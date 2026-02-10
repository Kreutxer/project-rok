import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, projectId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [scanName, setScanName] = useState('');
    const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setScanName('');
            setScanDate(new Date().toISOString().split('T')[0]);
            setIsDragging(false);
            setIsUploading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (isUploading) return;
            handleFileProcess(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isUploading) return;
        if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
        }
    };

    const handleFileProcess = (selectedFile: File) => {
        if (selectedFile.name.toLowerCase().endsWith('.csv')) {
            setFile(selectedFile);
            if (!scanName) {
                // Auto-fill name from filename if empty
                const readableName = selectedFile.name.replace('.csv', '').replace(/[-_]/g, ' ');
                setScanName(readableName);
            }
        } else {
            toast.error("Only CSV files are allowed");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <style>{`
                @keyframes modal-pop {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fade-in {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .animate-modal-pop {
                    animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={!isUploading ? onClose : undefined}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-pop border border-white/20">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Upload Data</h2>
                        <p className="text-slate-500 text-sm mt-1">File supported: .csv, etc</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"
                        disabled={isUploading}
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 py-4 relative z-10 space-y-4">

                    {/* Metadata Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scan Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Q1 Sales"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400"
                                value={scanName}
                                onChange={(e) => setScanName(e.target.value)}
                                disabled={isUploading}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scan Date</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                value={scanDate}
                                onChange={(e) => setScanDate(e.target.value)}
                                disabled={isUploading}
                            />
                        </div>
                    </div>

                    {/* File Drop and Input */}
                    <div
                        className={`
                            relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                            ${isDragging
                                ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                                : file
                                    ? 'border-green-500 bg-green-50/30'
                                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                            }
                            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />

                        <div className="flex flex-col items-center justify-center gap-4 transition-transform group-hover:translate-y-[-2px]">
                            <div className={`
                                w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-colors duration-300
                                ${file
                                    ? 'bg-green-100 text-green-600'
                                    : isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                                }
                            `}>
                                <span className="material-symbols-outlined text-3xl">
                                    {file ? 'description' : 'cloud_upload'}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h3 className={`font-semibold text-lg ${file ? 'text-green-700' : 'text-slate-700'}`}>
                                    {file ? file.name : "Click to upload"}
                                </h3>
                                {!file && (
                                    <p className="text-slate-400 text-sm">
                                        or drag and drop your CSV file here
                                    </p>
                                )}
                            </div>

                            {file && (
                                <p className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-100">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 pt-4 flex gap-3 justify-end relative z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        className={`
                            px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2
                            ${file && !isUploading
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }
                        `}
                        disabled={!file || isUploading}
                        onClick={async () => {
                            if (!file) return;

                            try {
                                setIsUploading(true);

                                // 1. Parse CSV
                                Papa.parse(file, {
                                    header: true,
                                    skipEmptyLines: true,
                                    complete: async (results) => {
                                        try {
                                            const { data: rows, meta: { fields } } = results;

                                            // 2. Create Dataset Entry with JSON Data and Metadata
                                            const { error: datasetError } = await supabase
                                                .from('datasets')
                                                .insert([{
                                                    project_id: projectId,
                                                    name: scanName || file.name,
                                                    scan_date: scanDate,
                                                    file_name: file.name,
                                                    column_headers: fields,
                                                    json_data: rows
                                                }]);

                                            if (datasetError) throw datasetError;

                                            toast.success('Dataset imported successfully!');
                                            setTimeout(() => {
                                                onClose();
                                            }, 1000); // Wait for toast before closing
                                        } catch (error) {
                                            console.error('Error processing CSV:', error);
                                            toast.error('Failed to process CSV: ' + (error as any).message);
                                        } finally {
                                            setIsUploading(false);
                                        }
                                    },
                                    error: (error) => {
                                        console.error('CSV Parse Error:', error);
                                        toast.error('Failed to parse CSV');
                                        setIsUploading(false);
                                    }
                                });

                            } catch (error) {
                                console.error('Error initializing upload:', error);
                                toast.error('Upload failed');
                                setIsUploading(false);
                            }
                        }}
                    >
                        {isUploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <span>Start Scan</span>
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
