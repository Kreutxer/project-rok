import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { Project } from '../types/database';

interface SidebarProps {
    activeProject: Project | null;
    setActiveProject: (project: Project) => void;
    projects: Project[];
    onCreateProject: (name: string) => void;
    onDeleteProject: (id: string) => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeProject, setActiveProject, projects, onCreateProject, onDeleteProject }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleCreate = () => {
        if (newProjectName.trim()) {
            onCreateProject(newProjectName.trim());
            setNewProjectName('');
            setIsCreating(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();

        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-medium text-slate-800">Delete "{project.name}"?</span>
                <span className="text-sm text-slate-500">All data in this KVK will be lost.</span>
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            onDeleteProject(project.id);
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

    return (
        <aside
            className={`${isCollapsed ? 'w-20' : 'w-72'
                } bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out relative`}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-9 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm z-10 transition-colors"
            >
                <span className="material-symbols-outlined text-sm">
                    {isCollapsed ? 'chevron_right' : 'chevron_left'}
                </span>
            </button>

            {/* Header */}
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} transition-all`}>
                <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-blue-500/20 shadow-lg">
                    <span className="material-symbols-outlined">rocket_launch</span>
                </div>
                {!isCollapsed && (
                    <div className="min-w-0 overflow-hidden opacity-100 transition-opacity duration-300">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">Server #1</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Management</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-2 overflow-y-auto custom-scrollbar mt-2">

                {/* KVK STORY Label */}
                {!isCollapsed && (
                    <div className="px-4 pb-2 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        KVK List
                    </div>
                )}

                {projects.map((project) => (
                    <div className="relative group" key={project.id}>
                        <button
                            onClick={() => setActiveProject(project)}
                            title={isCollapsed ? project.name : undefined}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl font-semibold transition-all ${activeProject?.id === project.id
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <span className="material-symbols-outlined shrink-0">
                                {activeProject?.id === project.id ? 'grid_view' : 'folder'}
                            </span>
                            {!isCollapsed && (
                                <span className="text-sm truncate opacity-100 transition-opacity duration-300 flex-1 text-left">{project.name}</span>
                            )}
                        </button>

                        {!isCollapsed && (
                            <button
                                onClick={(e) => handleDelete(e, project)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                title="Delete KVK"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )}
                    </div>
                ))}

                {isCreating ? (
                    !isCollapsed && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-blue-200 animate-in fade-in slide-in-from-top-2 mx-1">
                            <input
                                autoFocus
                                type="text"
                                placeholder="KVK Name"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 mb-3"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    <button
                        onClick={() => !isCollapsed && setIsCreating(true)}
                        title={isCollapsed ? "Expand to create project" : undefined}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center border-transparent' : 'gap-3 border-dashed px-4'} py-3 rounded-xl border border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all group ${isCollapsed ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform shrink-0">add_circle</span>
                        {!isCollapsed && (
                            <span className="font-medium text-sm">New KVK</span>
                        )}
                    </button>
                )}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4">
                <div className={`flex items-center ${isCollapsed ? 'justify-center p-0 bg-transparent' : 'gap-3 bg-slate-100 p-3'} rounded-xl transition-all`}>
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-300 shrink-0">
                        <img
                            className="w-full h-full object-cover"
                            src="https://picsum.photos/seed/user123/100/100"
                            alt="Alex Rivard"
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden opacity-100 transition-opacity duration-300">
                            <p className="text-xs font-bold truncate text-slate-900">Alex Rivard</p>
                            <p className="text-[10px] text-slate-500 truncate font-medium">Business Manager</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <button className="text-slate-400 hover:text-slate-600 shrink-0">
                            <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
