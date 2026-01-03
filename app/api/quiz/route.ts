import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey.startsWith('sk-') ? new OpenAI({ apiKey }) : null;

const PERSONAS = [
  "a quirky mad scientist", "a futuristic robot teacher", "a wise space explorer", 
  "an enthusiastic marine biologist", "a high-tech computer engineer"
];

export async function POST(req: Request) {
  try {
    const { level, history, score, subject } = await req.json();
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const chosenPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];

    // Use the subject passed from the UI, or fallback
    const finalSubject = subject || "STEM";

    let difficulty = "beginner";
    if (score > 120) difficulty = "expert";
    else if (score > 50) difficulty = "intermediate";

    if (!openai) {
      return NextResponse.json({
        question: `What is a core concept in ${finalSubject}?`,
        options: ["Option A", "Option B", "Option C"],
        correctAnswer: "Option A",
        emoji: "🧠"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", 
      messages: [
        { 
          role: "system", 
          content: `You are ${chosenPersona} teaching ${finalSubject} to a ${level} student. 
          
          STRICT RULES:
          1. TOPIC: You MUST generate a question specifically about ${finalSubject}.
          2. EXCLUSION: Do NOT repeat these previous questions or exact concepts: ${history && history.length > 0 ? history.join(" | ") : 'None'}.
          3. DIFFICULTY: Complexity must be ${difficulty} for a ${level} student.
          4. FORMAT: Return JSON: {"question": "...", "options": ["...", "...", "..."], "correctAnswer": "...", "emoji": "..."}
          5. NO PREFIXES: Return only the question text.` 
        },
        { role: "user", content: `Give me a unique ${finalSubject} question for ${level}. Use seed ${randomSeed}` }
      ],
      response_format: { type: "json_object" },
      temperature: 1.0,
      presence_penalty: 0.9,
      frequency_penalty: 0.6
    });

    const content = completion.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || '{}'));

  } catch (error: any) {
    return NextResponse.json({
      question: "What is 2 + 2?",
      options: ["3", "4", "5"],
      correctAnswer: "4",
      emoji: "➕"
    });
  }
}
