import React from 'react';
import type { Project, Dataset } from '../types/database';

interface HeaderProps {
  activeProject: Project | null;
  activeDataset: Dataset | null;
}

const Header: React.FC<HeaderProps> = ({ activeProject, activeDataset }) => {
  return (
    <header className="h-10 bg-[#f8f9fa] flex items-center justify-between px-10 sticky top-0">
      <nav className="flex items-center gap-2 text-sm font-medium">
        <a className="text-slate-400 hover:text-slate-600" href="#">#</a>
        <span className="text-slate-300">/</span>

        {activeProject ? (
          activeDataset ? (
            <>
              <span className="text-slate-400">{activeProject.name}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900">{activeDataset.name || activeDataset.file_name}</span>
            </>
          ) : (
            <span className="text-slate-900">{activeProject.name}</span>
          )
        ) : (
          <span className="text-slate-900">Select a KVK</span>
        )}
      </nav>
    </header>
  );
};

export default Header;
