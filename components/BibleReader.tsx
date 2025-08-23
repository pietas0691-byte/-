import React, { useState, useEffect, useCallback } from 'react';
import { OLD_TESTAMENT_BOOKS, NEW_TESTAMENT_BOOKS } from '../constants';
import { fetchChapter } from '../services/bibleService';
import type { ChapterData, Book, SelectedVerse } from '../types';
import { LoadingSpinner, BookOpenIcon, CheckCircleIcon } from './icons';

interface BibleReaderProps {
  onVerseSelect: (verse: SelectedVerse | null) => void;
  selectedVerse: SelectedVerse | null;
}

type ReadChapters = Record<string, number[]>;

const useReadProgress = () => {
  const [readChapters, setReadChapters] = useState<ReadChapters>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('bibleReadProgress');
      if (savedProgress) {
        setReadChapters(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error("Failed to load reading progress from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('bibleReadProgress', JSON.stringify(readChapters));
      } catch (error) {
        console.error("Failed to save reading progress to localStorage", error);
      }
    }
  }, [readChapters, isLoaded]);

  const toggleChapterRead = (bookName: string, chapter: number) => {
    setReadChapters(prev => {
      const newProgress = { ...prev };
      const bookProgress = newProgress[bookName] ? [...newProgress[bookName]] : [];
      const chapterIndex = bookProgress.indexOf(chapter);

      if (chapterIndex > -1) {
        bookProgress.splice(chapterIndex, 1);
      } else {
        bookProgress.push(chapter);
        bookProgress.sort((a, b) => a - b);
      }

      if (bookProgress.length === 0) {
        delete newProgress[bookName];
      } else {
        newProgress[bookName] = bookProgress;
      }
      
      return newProgress;
    });
  };

  const isChapterRead = (bookName: string, chapter: number) => {
    return readChapters[bookName]?.includes(chapter) ?? false;
  };
  
  const getReadCountForBook = (bookName: string) => {
    return readChapters[bookName]?.length ?? 0;
  }

  return { readChapters, toggleChapterRead, isChapterRead, getReadCountForBook };
};


const BookSelector: React.FC<{ 
    id: string;
    books: Book[], 
    selectedBook: string, 
    onChange: (bookName: string) => void, 
    placeholder: string 
}> = ({ id, books, selectedBook, onChange, placeholder }) => (
  <select
    id={id}
    value={selectedBook}
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-3 border border-slate-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
    aria-label={placeholder}
  >
    <option value="">{placeholder}</option>
    {books.map((book) => (
      <option key={book.name} value={book.name}>{book.name}</option>
    ))}
  </select>
);

const ProgressTracker: React.FC<{
    books: Book[];
    title: string;
    readChapters: ReadChapters;
    toggleChapterRead: (bookName: string, chapter: number) => void;
    getReadCountForBook: (bookName: string) => number;
}> = ({ books, title, readChapters, toggleChapterRead, getReadCountForBook }) => {
    const [expandedBook, setExpandedBook] = useState<string | null>(null);

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-700 mb-4 font-serif">{title}</h3>
            <div className="space-y-2">
                {books.map(book => {
                    const readCount = getReadCountForBook(book.name);
                    const progress = (readCount / book.chapters) * 100;
                    const isExpanded = expandedBook === book.name;

                    return (
                        <div key={book.name} className="border border-slate-200 rounded-md">
                            <button 
                                className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 transition"
                                onClick={() => setExpandedBook(isExpanded ? null : book.name)}
                                aria-expanded={isExpanded}
                            >
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{book.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                                            <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 w-24 text-right">{readCount} / {book.chapters} 장</span>
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 ml-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isExpanded && (
                                <div className="p-3 border-t border-slate-200">
                                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                                        {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => {
                                            const isRead = readChapters[book.name]?.includes(chapter) ?? false;
                                            return (
                                                <button
                                                    key={chapter}
                                                    onClick={() => toggleChapterRead(book.name, chapter)}
                                                    className={`p-2 rounded-md text-sm font-medium transition flex items-center justify-center aspect-square ${
                                                        isRead 
                                                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-orange-100'
                                                    }`}
                                                    aria-pressed={isRead}
                                                >
                                                    {isRead ? <CheckCircleIcon className="h-5 w-5" /> : chapter}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


export const BibleReader: React.FC<BibleReaderProps> = ({ onVerseSelect, selectedVerse }) => {
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [activeView, setActiveView] = useState<'reader' | 'progress'>('reader');
  
  const { toggleChapterRead, isChapterRead, getReadCountForBook, readChapters } = useReadProgress();

  const versesPerPage = 3;
  const allBooks = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];
  const currentBook = allBooks.find(b => b.name === selectedBook);

  const loadChapter = useCallback(async (book: string, chapter: number) => {
    if (!book || !chapter) return;
    setLoading(true);
    setError(null);
    setChapterData(null);
    setCurrentVerseIndex(0);
    onVerseSelect(null);
    try {
      const data = await fetchChapter(book, chapter);
      setChapterData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }, [onVerseSelect]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
        loadChapter(selectedBook, selectedChapter);
    }
  }, [selectedBook, selectedChapter, loadChapter]);

  const handleBookChange = (bookName: string) => {
    if (bookName) {
        setSelectedBook(bookName);
        setSelectedChapter(1);
    } else {
        setSelectedBook('');
        setSelectedChapter(null);
        setChapterData(null);
    }
    onVerseSelect(null);
    setCurrentVerseIndex(0);
  };
  
  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
    onVerseSelect(null);
    setCurrentVerseIndex(0);
  };
  
  const handleNext = () => {
    if (chapterData && currentVerseIndex + versesPerPage < chapterData.verses.length) {
        setCurrentVerseIndex(currentVerseIndex + versesPerPage);
        onVerseSelect(null);
    }
  };

  const handlePrevious = () => {
    if (currentVerseIndex - versesPerPage >= 0) {
        setCurrentVerseIndex(currentVerseIndex - versesPerPage);
        onVerseSelect(null);
    }
  };

  const displayedVerses = chapterData ? chapterData.verses.slice(currentVerseIndex, currentVerseIndex + versesPerPage) : [];


  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-6">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
                onClick={() => setActiveView('reader')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeView === 'reader'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                성경 읽기
            </button>
            <button
                 onClick={() => setActiveView('progress')}
                 className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeView === 'progress'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                읽기 진행률
            </button>
        </nav>
      </div>

      {activeView === 'reader' ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="old-testament-select" className="block text-sm font-semibold text-slate-700 mb-2">구약 (Old Testament)</label>
                    <BookSelector id="old-testament-select" books={OLD_TESTAMENT_BOOKS} selectedBook={selectedBook} onChange={handleBookChange} placeholder="Select a book" />
                </div>
                <div>
                    <label htmlFor="new-testament-select" className="block text-sm font-semibold text-slate-700 mb-2">신약 (New Testament)</label>
                    <BookSelector id="new-testament-select" books={NEW_TESTAMENT_BOOKS} selectedBook={selectedBook} onChange={handleBookChange} placeholder="Select a book" />
                </div>
            </div>

            {!selectedBook ? (
                <div className="text-center p-12 bg-stone-50 rounded-lg border border-slate-200">
                    <BookOpenIcon className="h-16 w-16 mx-auto text-orange-400 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-700 mb-2 font-serif">Welcome to Digital Scripture</h2>
                    <p className="text-slate-500">Please select a book from the Old or New Testament to begin your study.</p>
                </div>
            ) : (
                <>
                {currentBook && (
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Chapter</h3>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                            {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((chapter) => (
                            <button
                                key={chapter}
                                onClick={() => handleChapterChange(chapter)}
                                className={`p-2 rounded-md text-sm font-medium transition relative ${
                                selectedChapter === chapter
                                    ? 'bg-orange-600 text-white shadow'
                                    : 'bg-slate-100 hover:bg-orange-100 text-slate-700'
                                }`}
                                aria-pressed={selectedChapter === chapter}
                            >
                                {isChapterRead(currentBook.name, chapter) && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-orange-400"></span>}
                                {chapter}
                            </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-slate-200 pt-6 min-h-[300px]">
                    {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner className="h-10 w-10 text-orange-600" />
                    </div>
                    ) : error ? (
                    <div className="text-center p-8 bg-red-50 text-red-700 rounded-md">
                        <h3 className="font-bold text-lg">Error Loading Scripture</h3>
                        <p>{error}</p>
                    </div>
                    ) : chapterData ? (
                    <article className="bg-stone-50 p-4 sm:p-6 rounded-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">{chapterData.reference}</h2>
                            {selectedBook && selectedChapter && (
                                <button
                                    onClick={() => toggleChapterRead(selectedBook, selectedChapter)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition ${
                                        isChapterRead(selectedBook, selectedChapter)
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    {isChapterRead(selectedBook, selectedChapter) ? '읽음' : '읽음으로 표시'}
                                </button>
                            )}
                        </div>
                        <div 
                            className="font-serif text-base md:text-lg leading-relaxed text-slate-700 space-y-2 min-h-[150px] cursor-pointer"
                            onClick={handleNext}
                            role="button"
                            tabIndex={0}
                            aria-label="Tap to view next verses"
                            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleNext()}
                        >
                        {displayedVerses.map((verse) => {
                            const reference = `${verse.book_name} ${verse.chapter}:${verse.verse}`;
                            const isSelected = selectedVerse?.reference === reference;
                            return (
                            <p key={verse.verse} className="indent-4">
                                <sup className="font-sans font-semibold text-orange-700 mr-1">{verse.verse}</sup>
                                <span 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onVerseSelect({ reference, text: verse.text })
                                    }}
                                    className={`cursor-pointer hover:bg-orange-100 p-1 rounded transition-colors ${isSelected ? 'bg-orange-200' : ''}`}
                                >
                                    {verse.text}
                                </span>
                            </p>
                            );
                        })}
                        </div>

                        {chapterData.verses.length > versesPerPage && (
                            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentVerseIndex === 0}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition"
                                >
                                    이전
                                </button>
                                <span className="text-sm text-slate-500 font-medium">
                                    {chapterData.verses.length}절 중 {currentVerseIndex + 1}-{Math.min(currentVerseIndex + versesPerPage, chapterData.verses.length)}절
                                </span>
                                <button
                                    onClick={handleNext}
                                    disabled={currentVerseIndex + versesPerPage >= chapterData.verses.length}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition"
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </article>
                    ) : null}
                </div>
                </>
            )}
        </>
      ) : (
        <div className="space-y-8">
            <ProgressTracker 
                title="구약 (Old Testament)"
                books={OLD_TESTAMENT_BOOKS}
                readChapters={readChapters}
                toggleChapterRead={toggleChapterRead}
                getReadCountForBook={getReadCountForBook}
            />
             <ProgressTracker 
                title="신약 (New Testament)"
                books={NEW_TESTAMENT_BOOKS}
                readChapters={readChapters}
                toggleChapterRead={toggleChapterRead}
                getReadCountForBook={getReadCountForBook}
            />
        </div>
      )}
    </div>
  );
};