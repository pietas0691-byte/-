
import type { ChapterData } from '../types';

export const fetchChapter = async (book: string, chapter: number): Promise<ChapterData> => {
  const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ChapterData = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch chapter:", error);
    throw new Error("Could not load the requested chapter. Please try another selection.");
  }
};
