import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// FORCE NEXT.JS TO ALWAYS FETCH FRESH DATA
export const dynamic = 'force-dynamic';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey !== 'your-api-key-here' ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    
    // Add a random seed to force variety in AI response
    const randomSeed = Math.random().toString(36).substring(7);

    if (!openai) {
      // Mock data variety
      const mockQuestions = [
        { q: `Count the 🍎 for ${level}`, o: ["1", "3", "5", "2"], a: "3", e: "🍎" },
        { q: `Which is bigger? (Level: ${level})`, o: ["🐜", "🐘", "🐭", "🐱"], a: "🐘", e: "🐘" },
        { q: `Solve for ${level}: 2 + 3 = ?`, o: ["4", "5", "6", "7"], a: "5", e: "➕" }
      ];
      const randomMock = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
      return NextResponse.json({
        question: randomMock.q,
        options: randomMock.o,
        correctAnswer: randomMock.a,
        emoji: randomMock.e,
        type: "math"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are a STEM teacher. Generate a UNIQUE, fun, multiple-choice question for ${level}. 
          Variety is key - use different topics like Math, Biology, Physics, or Coding. 
          Return ONLY valid JSON format: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "emoji": "...", "type": "..."}` 
        },
        { role: "user", content: `Generate a new question. Random Seed: ${randomSeed}` }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({
      question: "What is 5 + 5?",
      options: ["8", "9", "10", "11"],
      correctAnswer: "10",
      emoji: "➕",
      type: "math"
    });
  }
}
