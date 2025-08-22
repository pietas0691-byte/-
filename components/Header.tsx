
import React from 'react';
import { BookOpenIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center gap-3">
        <BookOpenIcon className="h-8 w-8 text-sky-600" />
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Digital <span className="text-sky-600">Scripture</span>
        </h1>
      </div>
    </header>
  );
};
