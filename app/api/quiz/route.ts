import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

// Initialize OpenAI with better error checking
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey.startsWith('sk-') ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    const randomSeed = Math.random().toString(36).substring(7);

    // MOCK DATA FALLBACK
    if (!openai) {
      const mockPool = [
        { question: "Which planet is the Red Planet?", options: ["Mars", "Venus", "Earth"], correctAnswer: "Mars", emoji: "🔴" },
        { question: "What is 10 + 5?", options: ["12", "15", "20"], correctAnswer: "15", emoji: "➕" },
        { question: "Which part of a plant is underground?", options: ["Stem", "Roots", "Leaves"], correctAnswer: "Roots", emoji: "🌱" }
      ];
      const res = mockPool[Math.floor(Math.random() * mockPool.length)];
      return NextResponse.json(res);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Use specific model that supports JSON mode well
      messages: [
        { 
          role: "system", 
          content: "You are a STEM teacher. Generate a multiple-choice question for a student at " + level + ". Return the result in JSON format with fields: question, options (array of strings), correctAnswer (string), emoji (string)." 
        },
        { role: "user", content: "Generate a unique question. Seed: " + randomSeed }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty AI response");

    return NextResponse.json(JSON.parse(content));

  } catch (error: any) {
    console.error("Quiz API Error:", error);
    // SAFEST FALLBACK: Return a valid question even if everything fails
    return NextResponse.json({
      question: "What is 5 + 5?",
      options: ["10", "15", "20"],
      correctAnswer: "10",
      emoji: "➕"
    });
  }
}
