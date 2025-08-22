import React, { useState, useEffect, useCallback } from 'react';
import { OLD_TESTAMENT_BOOKS, NEW_TESTAMENT_BOOKS } from '../constants';
import { fetchChapter } from '../services/bibleService';
import type { ChapterData, Book, SelectedVerse } from '../types';
import { LoadingSpinner, BookOpenIcon } from './icons';

interface BibleReaderProps {
  onVerseSelect: (verse: SelectedVerse | null) => void;
  selectedVerse: SelectedVerse | null;
}

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
  >
    <option value="">{placeholder}</option>
    {books.map((book) => (
      <option key={book.name} value={book.name}>{book.name}</option>
    ))}
  </select>
);


export const BibleReader: React.FC<BibleReaderProps> = ({ onVerseSelect, selectedVerse }) => {
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const allBooks = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];
  const currentBook = allBooks.find(b => b.name === selectedBook);

  const loadChapter = useCallback(async (book: string, chapter: number) => {
    if (!book || !chapter) return;
    setLoading(true);
    setError(null);
    setChapterData(null);
    try {
      const data = await fetchChapter(book, chapter);
      setChapterData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
  };
  
  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
    onVerseSelect(null);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-6">
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
                        className={`p-2 rounded-md text-sm font-medium transition ${
                        selectedChapter === chapter
                            ? 'bg-orange-600 text-white shadow'
                            : 'bg-slate-100 hover:bg-orange-100 text-slate-700'
                        }`}
                    >
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
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-4">{chapterData.reference}</h2>
                <div className="font-serif text-base md:text-lg leading-relaxed text-slate-700 space-y-2">
                  {chapterData.verses.map((verse) => {
                    const reference = `${verse.book_name} ${verse.chapter}:${verse.verse}`;
                    const isSelected = selectedVerse?.reference === reference;
                    return (
                      <p key={verse.verse} className="indent-4">
                        <sup className="font-sans font-semibold text-orange-700 mr-1">{verse.verse}</sup>
                        <span 
                            onClick={() => onVerseSelect({ reference, text: verse.text })}
                            className={`cursor-pointer hover:bg-orange-100 p-1 rounded transition-colors ${isSelected ? 'bg-orange-200' : ''}`}
                        >
                            {verse.text}
                        </span>
                      </p>
                    );
                  })}
                </div>
              </article>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};