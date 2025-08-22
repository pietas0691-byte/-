
import React, { useState, useEffect, useCallback } from 'react';
import { OLD_TESTAMENT_BOOKS, NEW_TESTAMENT_BOOKS } from '../constants';
import { fetchChapter } from '../services/bibleService';
import type { ChapterData, Book, SelectedVerse } from '../types';
import { LoadingSpinner } from './icons';

interface BibleReaderProps {
  onVerseSelect: (verse: SelectedVerse) => void;
  selectedVerse: SelectedVerse | null;
}

const BookSelector: React.FC<{ books: Book[], selectedBook: string, onChange: (bookName: string) => void, placeholder: string }> = ({ books, selectedBook, onChange, placeholder }) => (
  <select
    value={selectedBook}
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-3 border border-slate-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
  >
    <option value="">{placeholder}</option>
    {books.map((book) => (
      <option key={book.name} value={book.name}>{book.name}</option>
    ))}
  </select>
);


export const BibleReader: React.FC<BibleReaderProps> = ({ onVerseSelect, selectedVerse }) => {
  const [selectedBook, setSelectedBook] = useState<string>('Genesis');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const allBooks = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];
  const currentBook = allBooks.find(b => b.name === selectedBook);

  const loadChapter = useCallback(async (book: string, chapter: number) => {
    if (!book || !chapter) return;
    setLoading(true);
    setError(null);
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
    loadChapter(selectedBook, selectedChapter);
  }, [selectedBook, selectedChapter, loadChapter]);

  const handleBookChange = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
  };
  
  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BookSelector books={OLD_TESTAMENT_BOOKS} selectedBook={selectedBook} onChange={handleBookChange} placeholder="Select Old Testament Book" />
        <BookSelector books={NEW_TESTAMENT_BOOKS} selectedBook={selectedBook} onChange={handleBookChange} placeholder="Select New Testament Book" />
      </div>

      {currentBook && (
        <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Chapter</h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((chapter) => (
                <button
                    key={chapter}
                    onClick={() => handleChapterChange(chapter)}
                    className={`p-2 rounded-md text-sm font-medium transition ${
                    selectedChapter === chapter
                        ? 'bg-sky-600 text-white shadow'
                        : 'bg-slate-100 hover:bg-sky-100 text-slate-700'
                    }`}
                >
                    {chapter}
                </button>
                ))}
            </div>
        </div>
      )}

      <div className="border-t border-slate-200 pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner className="h-10 w-10 text-sky-600" />
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 text-red-700 rounded-md">
            <h3 className="font-bold text-lg">Error Loading Scripture</h3>
            <p>{error}</p>
          </div>
        ) : chapterData ? (
          <article className="bg-stone-50 p-4 sm:p-6 rounded-md">
            <h2 className="text-3xl font-serif font-bold text-slate-800 mb-4">{chapterData.reference}</h2>
            <div className="font-serif text-lg leading-relaxed text-slate-700 space-y-2">
              {chapterData.verses.map((verse) => {
                const reference = `${verse.book_name} ${verse.chapter}:${verse.verse}`;
                const isSelected = selectedVerse?.reference === reference;
                return (
                  <p key={verse.verse} className="inline">
                    <sup className="font-sans font-semibold text-sky-700 mr-1">{verse.verse}</sup>
                    <span 
                        onClick={() => onVerseSelect({ reference, text: verse.text })}
                        className={`cursor-pointer hover:bg-sky-100 p-1 rounded transition-colors ${isSelected ? 'bg-sky-200' : ''}`}
                    >
                        {verse.text}{' '}
                    </span>
                  </p>
                );
              })}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
};
