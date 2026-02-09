
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="h-10 bg-[#f8f9fa] flex items-center justify-between px-10 sticky top-0">
      <nav className="flex items-center gap-2 text-sm font-medium">
        <a className="text-slate-400 hover:text-slate-600" href="#">#</a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900">Scan 1</span>
      </nav>
    </header>
  );
};

export default Header;
