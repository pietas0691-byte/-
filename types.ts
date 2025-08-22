
export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ChapterData {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export interface Book {
  name: string;
  chapters: number;
}

export interface SelectedVerse {
  reference: string;
  text: string;
}

export interface DailyVerse {
  reference: string;
  text: string;
}
