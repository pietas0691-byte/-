import React, { useState, useEffect, useCallback } from 'react';
import { getDailyVerse, explainVerse, answerQuestion } from '../services/geminiService';
import type { DailyVerse, SelectedVerse } from '../types';
import { LoadingSpinner, SparklesIcon } from './icons';

interface AIAssistantProps {
  selectedVerse: SelectedVerse | null;
}

enum LoadingState {
  NONE,
  DAILY_VERSE,
  EXPLANATION,
  QUESTION,
}

const AIResponse: React.FC<{ content: string }> = ({ content }) => {
    // A simple markdown-like parser for bolding and newlines
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
      .replace(/\n/g, '<br />');
  
    return (
      <div 
        className="text-slate-600 font-serif leading-relaxed" 
        dangerouslySetInnerHTML={{ __html: formattedContent }} 
      />
    );
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ selectedVerse }) => {
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NONE);

  useEffect(() => {
    const fetchDailyVerse = async () => {
      setLoading(LoadingState.DAILY_VERSE);
      const verse = await getDailyVerse();
      setDailyVerse(verse);
      setLoading(LoadingState.NONE);
    };
    fetchDailyVerse();
  }, []);

  const handleExplainVerse = useCallback(async (verse: SelectedVerse) => {
    setExplanation('');
    setLoading(LoadingState.EXPLANATION);
    const result = await explainVerse(verse.reference, verse.text);
    setExplanation(result);
    setLoading(LoadingState.NONE);
  }, []);

  useEffect(() => {
    if (selectedVerse) {
      handleExplainVerse(selectedVerse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVerse]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAnswer('');
    setLoading(LoadingState.QUESTION);
    const result = await answerQuestion(question);
    setAnswer(result);
    setLoading(LoadingState.NONE);
  };
  
  return (
    <div className="space-y-6">
      {/* Daily Verse Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="flex items-center gap-2 font-bold text-lg md:text-xl text-slate-800 mb-4">
          <SparklesIcon className="h-6 w-6 text-orange-500" />
          Verse of the Day
        </h3>
        {loading === LoadingState.DAILY_VERSE ? (
            <div className="flex justify-center items-center h-24">
                <LoadingSpinner className="h-8 w-8 text-orange-600" />
            </div>
        ) : dailyVerse ? (
          <div className="space-y-3">
            <p className="font-serif text-base md:text-lg text-slate-700">"{dailyVerse.text}"</p>
            <p className="text-right font-semibold text-orange-700">{dailyVerse.reference}</p>
          </div>
        ) : <p>Could not load verse.</p>}
      </div>

      {/* Explanation Card */}
      {selectedVerse && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="flex items-center gap-2 font-bold text-lg md:text-xl text-slate-800 mb-4">
            <SparklesIcon className="h-6 w-6 text-orange-500" />
            Explanation for <span className="text-orange-600">{selectedVerse.reference}</span>
          </h3>
          {loading === LoadingState.EXPLANATION ? (
            <div className="flex justify-center items-center h-40">
                 <LoadingSpinner className="h-8 w-8 text-orange-600" />
            </div>
           ) : explanation ? (
            <AIResponse content={explanation} />
           ) : null}
        </div>
      )}

      {/* Ask a Question Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="flex items-center gap-2 font-bold text-lg md:text-xl text-slate-800 mb-4">
          <SparklesIcon className="h-6 w-6 text-orange-500" />
          Ask a Question
        </h3>
        <form onSubmit={handleAskQuestion} className="space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What does the Bible say about forgiveness?"
            className="w-full p-3 border border-slate-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={loading !== LoadingState.NONE}
            className="w-full bg-orange-600 text-white font-semibold py-3 rounded-md hover:bg-orange-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading === LoadingState.QUESTION ? <LoadingSpinner className="h-5 w-5"/> : 'Ask AI'}
          </button>
        </form>
        {answer && (
            <div className="mt-6 border-t border-slate-200 pt-4">
                 <AIResponse content={answer} />
            </div>
        )}
      </div>
    </div>
  );
};