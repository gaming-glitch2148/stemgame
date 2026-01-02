import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

const SYSTEM_PROMPT = `
You are a playful and educational AI assistant for a kids' STEM game. 
Generate a single multiple-choice question based on the provided grade level.
Return ONLY valid JSON in the following format:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The exact string of the correct option",
  "emoji": "A single relevant emoji",
  "type": "math|science|pattern|coding"
}
`;

export async function POST(req: Request) {
  try {
    const { level } = await req.json();

    // Fallback if no API key is set yet
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key') {
      return NextResponse.json({
        question: `What is a cool STEM topic for ${level}?`,
        options: ["Robots", "Stars", "Dinosaurs", "Plants"],
        correctAnswer: "Robots",
        emoji: "🤖",
        type: "science"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a question for ${level}.` }
      ],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(completion.choices[0].message.content || '{}'));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
