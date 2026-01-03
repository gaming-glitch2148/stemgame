import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey.startsWith('sk-') ? new OpenAI({ apiKey }) : null;

const PERSONAS = [
  "a quirky scientist", "a space explorer", "a deep-sea diver", "a robot from 2099", "a nature expert"
];

const SUB_TOPICS = [
  "Inventions", "Microscopic world", "Outer space", "Animal behavior", "Energy and Heat",
  "Ocean life", "Volcanoes", "Human brain", "Coding logic", "Plants and Soil"
];

export async function POST(req: Request) {
  try {
    const { level, history, score, subject } = await req.json();
    const randomSeed = Math.random().toString(36).substring(2, 12);
    const chosenPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
    const chosenSubTopic = SUB_TOPICS[Math.floor(Math.random() * SUB_TOPICS.length)];
    const finalSubject = subject || "STEM";

    let difficulty = "beginner";
    if (score > 120) difficulty = "expert";
    else if (score > 50) difficulty = "intermediate";

    // 1. RANDOMIZED MOCK FALLBACK (If API Key is missing or failing)
    if (!openai) {
      console.warn("Using randomized mock fallback...");
      const mockPool = [
        { question: `In ${finalSubject}, what does a scientist use to see small things?`, options: ["Telescope", "Microscope", "Glasses"], correctAnswer: "Microscope", emoji: "🔬" },
        { question: `Which of these is part of ${finalSubject}?`, options: ["Cooking", "Gravity", "Reading"], correctAnswer: "Gravity", emoji: "🍎" },
        { question: `A cool fact about ${finalSubject}: How many states of matter are there?`, options: ["3", "1", "10"], correctAnswer: "3", emoji: "🧊" },
        { question: `Solving a ${finalSubject} mystery: What do plants need to grow?`, options: ["Candy", "Sunlight", "Music"], correctAnswer: "Sunlight", emoji: "☀️" },
        { question: `Basic ${finalSubject} math: What is 10 + 10?`, options: ["10", "20", "100"], correctAnswer: "20", emoji: "➕" }
      ];
      return NextResponse.json(mockPool[Math.floor(Math.random() * mockPool.length)]);
    }

    // 2. AI GENERATION WITH MAXIMUM RANDOMNESS
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", 
      messages: [
        { 
          role: "system", 
          content: `You are ${chosenPersona}. You are teaching ${finalSubject} to a ${level} student. 
          
          STRICT RULES:
          1. SPECIFICITY: Generate a unique question about ${finalSubject}, specifically focusing on ${chosenSubTopic}.
          2. EXCLUSION: Do NOT use any of these concepts or questions: ${history && history.length > 0 ? history.slice(-5).join(" | ") : 'None'}.
          3. DIFFICULTY: Complexity must be ${difficulty} for ${level}.
          4. NO PREFIXES: Just the question text. No "Question:", no "Level:".
          5. Return valid JSON: {"question": "...", "options": ["...", "...", "..."], "correctAnswer": "...", "emoji": "..."}` 
        },
        { role: "user", content: `As ${chosenPersona}, give me a new ${finalSubject} challenge about ${chosenSubTopic}. Unique seed: ${randomSeed}` }
      ],
      response_format: { type: "json_object" },
      temperature: 1.0,
      presence_penalty: 1.0,
      frequency_penalty: 1.0
    });

    const content = completion.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || '{}'));

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({
      question: "Which planet is the closest to the Sun?",
      options: ["Earth", "Mars", "Mercury"],
      correctAnswer: "Mercury",
      emoji: "☀️"
    });
  }
}
