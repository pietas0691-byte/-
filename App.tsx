
import React, { useState } from 'react';
import { BibleReader } from './components/BibleReader';
import { AIAssistant } from './components/AIAssistant';
import { Header } from './components/Header';
import type { SelectedVerse } from './types';

const App: React.FC = () => {
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800">
      <Header />
      <main className="p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-screen-2xl mx-auto items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <BibleReader onVerseSelect={setSelectedVerse} selectedVerse={selectedVerse} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8">
          <AIAssistant selectedVerse={selectedVerse} />
        </div>
      </main>
    </div>
  );
};

export default App;
