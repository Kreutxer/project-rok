import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DatasetViewer from './components/DatasetViewer';
import DKPViewer from './components/DKPViewer';
// ComparisonViewer removed
import { supabase } from './lib/supabase';
import type { Project, Dataset } from './types/database';

const App: React.FC = () => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [dkpData, setDkpData] = useState<{ init: Dataset; latest: Dataset } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);
  // ... (keep fetchProjects logic, handled by startLine/endLine if contiguous, but here I'm replacing the top part and render logic. I need to be careful not to delete fetchProjects. I'll split this into 2 edits if needed, or use a larger range)

  // Let's look at the range. 1-124 is the whole file.
  // I will just replace the import and component state definition, and the render part.
  // Actually, I can use multi_replace to be safe.


  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setProjects(data);
        if (data.length > 0 && !activeProject) {
          setActiveProject(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name }]) // No owner_id needed
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProjects(prev => [...prev, data]);
        setActiveProject(data);
        toast.success('Project created successfully');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
        setActiveDataset(null);
      }
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        <span className="material-symbols-outlined text-slate-700">
          {isMobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          activeProject={activeProject}
          setActiveProject={(project) => {
            setActiveProject(project);
            setActiveDataset(null);
            setDkpData(null);
            setIsMobileMenuOpen(false);
          }}
          projects={projects}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        <Header activeProject={activeProject} activeDataset={activeDataset} />
        <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px] h-[calc(100vh-80px)] overflow-auto">
          {activeDataset ? (
            <DatasetViewer
              dataset={activeDataset}
              onBack={() => setActiveDataset(null)}
            />
          ) : dkpData ? (
            <DKPViewer
              initDataset={dkpData.init}
              latestDataset={dkpData.latest}
              onBack={() => setDkpData(null)}
            />
          ) : activeProject ? (
            <Dashboard
              key={activeProject.id}
              activeProject={activeProject}
              onSelectDataset={setActiveDataset}
              onLaunchDKP={(init, latest) => setDkpData({ init, latest })}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              {isLoading ? 'Loading...' : 'Create a project to get started'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
