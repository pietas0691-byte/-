
import { GoogleGenAI, Type } from "@google/genai";
import type { DailyVerse } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getDailyVerse = async (): Promise<DailyVerse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Share a single, inspiring and well-known Bible verse. Provide the verse text and its reference (e.g., John 3:16).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reference: {
              type: Type.STRING,
              description: "The book, chapter, and verse reference (e.g., John 3:16)",
            },
            text: {
              type: Type.STRING,
              description: "The full text of the Bible verse.",
            },
          },
          required: ["reference", "text"],
        },
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);
    return parsed as DailyVerse;
  } catch (error) {
    console.error("Error fetching daily verse:", error);
    return {
        reference: "Genesis 1:1",
        text: "In the beginning God created the heavens and the earth."
    }
  }
};

export const explainVerse = async (reference: string, text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please provide a clear and concise explanation for the Bible verse: "${text}" (${reference}). Focus on its historical context, key theological meaning, and a brief application for modern life. Format the output with clear headings for 'Context', 'Meaning', and 'Application'.`,
            config: {
                temperature: 0.5,
            }
        });
        return response.text;
    } catch(error) {
        console.error("Error explaining verse:", error);
        return "Sorry, I was unable to generate an explanation for this verse. Please try again."
    }
};

export const answerQuestion = async (question: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the teachings of the Bible, please answer the following question: "${question}". Provide a thoughtful, balanced, and biblically-grounded response. If the Bible does not directly address the topic, explain the principles that could apply.`,
            config: {
                temperature: 0.7,
            }
        });
        return response.text;
    } catch(error) {
        console.error("Error answering question:", error);
        return "Sorry, I encountered an error trying to answer your question. Please check your connection and try again."
    }
};
