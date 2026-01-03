import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey.startsWith('sk-') ? new OpenAI({ apiKey }) : null;

const SUBJECTS = [
  "Space and Astronomy", "Robotics and AI", "Chemistry and Molecules", 
  "Physics and Gravity", "Biology and DNA", "Earth and Volcanoes", 
  "Coding and Logic", "Engineering and Bridges", "Inventions", "Marine Biology",
  "Astrobiology", "Material Science", "Climate Science", "Quantum Basics"
];

const PERSONAS = [
  "a quirky mad scientist", "a futuristic robot teacher", "a wise space explorer", 
  "an enthusiastic marine biologist", "a high-tech computer engineer"
];

export async function POST(req: Request) {
  try {
    const { level, history, score } = await req.json();
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const chosenSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const chosenPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];

    // Determine internal difficulty
    let difficulty = "beginner";
    if (score > 120) difficulty = "expert";
    else if (score > 50) difficulty = "intermediate";

    if (!openai) {
      return NextResponse.json({
        question: "What is 5 x 5?",
        options: ["20", "25", "30"],
        correctAnswer: "25",
        emoji: "🧠"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", 
      messages: [
        { 
          role: "system", 
          content: `You are ${chosenPersona} teaching STEM. 
          Grade Level: ${level}.
          Student Proficiency: ${difficulty}.
          
          CRITICAL ANTI-REPETITION RULES:
          1. FORBIDDEN TOPICS/QUESTIONS: ${history && history.length > 0 ? history.join(" | ") : 'None'}.
          2. YOU MUST generate a question about ${chosenSubject} that is NOT related to common textbook examples.
          3. Be specific, creative, and slightly unusual to ensure uniqueness.
          4. Complexity must be perfectly tuned for ${level}.
          5. Return ONLY the question text in the "question" field. Do not include any prefixes like "Level:", "Grade:", or "Mock:".
          
          Return JSON: {"question": "...", "options": ["...", "...", "..."], "correctAnswer": "...", "emoji": "..."}` 
        },
        { role: "user", content: `As ${chosenPersona}, give me a unique ${chosenSubject} challenge for a ${level} student. Use seed ${randomSeed}` }
      ],
      response_format: { type: "json_object" },
      temperature: 1.0,
      presence_penalty: 0.8,
      frequency_penalty: 0.5
    });

    const content = completion.choices[0].message.content;
    const data = JSON.parse(content || '{}');

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({
      question: "What is 2 + 2?",
      options: ["3", "4", "5"],
      correctAnswer: "4",
      emoji: "➕"
    });
  }
}
