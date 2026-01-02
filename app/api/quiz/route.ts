import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.OPENAI_API_KEY;
// Log to terminal to help debug if the key is missing (check your Vercel logs!)
if (!apiKey) console.warn("WARNING: OPENAI_API_KEY is not defined!");

const openai = apiKey && apiKey !== 'your-api-key-here' ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    const randomSeed = Math.random().toString(36).substring(2, 10);

    if (!openai) {
      // Significantly expanded mock data so fallback doesn't feel repetitive
      const mockPool = [
        { q: "Which planet is known as the Red Planet?", o: ["Mars", "Venus", "Jupiter", "Saturn"], a: "Mars", e: "🔴" },
        { q: "What is 12 + 15?", o: ["25", "26", "27", "28"], a: "27", e: "➕" },
        { q: "What part of the plant grows underground?", o: ["Leaves", "Stem", "Roots", "Flower"], a: "Roots", e: "🌱" },
        { q: "How many legs does a spider have?", o: ["6", "8", "10", "12"], a: "8", e: "🕷️" },
        { q: "Which gas do humans need to breathe?", o: ["Oxygen", "Nitrogen", "Carbon", "Helium"], a: "Oxygen", e: "🌬️" },
        { q: "What is the hardest natural substance?", o: ["Gold", "Iron", "Diamond", "Glass"], a: "Diamond", e: "💎" }
      ];
      const randomMock = mockPool[Math.floor(Math.random() * mockPool.length)];
      return NextResponse.json({ ...randomMock, type: "mock-fallback" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are a creative STEM teacher. Generate a UNIQUE question for ${level}. 
          IMPORTANT: Use this random seed to influence the TOPIC and make it unique: ${randomSeed}.
          Vary between Biology, Physics, Coding, and Engineering.
          Return valid JSON: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "emoji": "...", "type": "..."}` 
        },
        { role: "user", content: `New unique question for ${level}. Seed: ${randomSeed}` }
      ],
      temperature: 1.0, // Maximum randomness
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(completion.choices[0].message.content || '{}'));

  } catch (error: any) {
    return NextResponse.json({
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
      emoji: "➕",
      type: "error-fallback"
    });
  }
}
