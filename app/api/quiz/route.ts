import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI only if key exists
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey !== 'your-api-key-here' ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    console.log("Generating quiz for level:", level);

    // If no OpenAI key, return mock data immediately
    if (!openai) {
      console.log("No API key found. Returning mock question.");
      return NextResponse.json({
        question: `How many 🍎 do you see? (Level: ${level})`,
        options: ["1", "3", "5", "2"],
        correctAnswer: "3",
        emoji: "🍎",
        type: "math"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Generate a kid-friendly STEM multiple choice question in JSON format. Return ONLY the JSON object." 
        },
        { role: "user", content: `Grade level: ${level}` }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    console.log("AI Generated Result:", result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Quiz API Error:", error.message);
    // Return a safe fallback on error
    return NextResponse.json({
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
      emoji: "➕",
      type: "math"
    });
  }
}
