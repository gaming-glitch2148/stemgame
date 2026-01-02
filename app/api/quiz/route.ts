import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey.startsWith('sk-') ? new OpenAI({ apiKey }) : null;

// Helper to get a random subject to force diversity
const SUBJECTS = [
  "Mathematics", "Biology", "Physics", "Chemistry", "Space Science", 
  "Computer Science", "Engineering", "Environmental Science", "Robotics",
  "Geology", "Anatomy", "Renewable Energy", "Invention History"
];

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    
    // Create a very noisy seed combining multiple random sources
    const randomSeed = [
      Math.random().toString(36).substring(2),
      Date.now().toString(),
      SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
    ].join('-');

    if (!openai) {
      // Significantly expanded mock pool for local testing
      const mockPool = [
        { question: "Which planet is the Red Planet?", options: ["Mars", "Venus", "Earth"], correctAnswer: "Mars", emoji: "🔴" },
        { question: "What is 10 + 5?", options: ["12", "15", "20"], correctAnswer: "15", emoji: "➕" },
        { question: "Which part of a plant is underground?", options: ["Stem", "Roots", "Leaves"], correctAnswer: "Roots", emoji: "🌱" },
        { question: "How many legs does a spider have?", options: ["6", "8", "10"], correctAnswer: "8", emoji: "🕷️" },
        { question: "Which gas do we breathe out?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen"], correctAnswer: "Carbon Dioxide", emoji: "🌬️" },
        { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond"], correctAnswer: "Diamond", emoji: "💎" }
      ];
      return NextResponse.json(mockPool[Math.floor(Math.random() * mockPool.length)]);
    }

    const randomSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Upgrading to GPT-4 for much better variety if available
      messages: [
        { 
          role: "system", 
          content: `You are an expert STEM teacher. Generate a UNIQUE and CREATIVE multiple-choice question for a student in ${level}.
          
          MANDATORY RULES:
          1. Complexity must match ${level} exactly.
          2. Topic for this specific question: ${randomSubject}.
          3. Do NOT repeat common questions. Be specific and interesting.
          4. Use the following random seed to ensure uniqueness: ${randomSeed}.
          5. Return ONLY JSON: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "emoji": "...", "type": "..."}` 
        },
        { 
          role: "user", 
          content: `Generate a new ${randomSubject} question for ${level}. Use seed: ${randomSeed}` 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 1.0, // Maximum randomness
      presence_penalty: 0.6, // Encourage new topics
      frequency_penalty: 0.3 // Discourage repeated words
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty AI response");

    return NextResponse.json(JSON.parse(content));

  } catch (error: any) {
    console.error("Quiz API Error:", error);
    return NextResponse.json({
      question: "What is 10 + 10?",
      options: ["15", "20", "25"],
      correctAnswer: "20",
      emoji: "➕"
    });
  }
}
