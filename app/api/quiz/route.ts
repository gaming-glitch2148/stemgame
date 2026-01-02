import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey && apiKey !== 'your-api-key-here' ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    
    // Create a much larger and more complex random seed string
    const randomSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().getTime();

    if (!openai) {
      return NextResponse.json({
        question: `How many 🍎 do you see? (Level: ${level})`,
        options: ["1", "3", "5", "2"],
        correctAnswer: "3",
        emoji: "🍎",
        type: "math"
      });
    }

    const topics = [
      "Physics (Forces, Light, Sound, Electricity)",
      "Chemistry (Atoms, Reactions, Periodic Table, States of Matter)",
      "Biology (Cells, Genetics, Human Body, Plants, Animals)",
      "Earth Science (Rocks, Weather, Space, Oceans, Volcanoes)",
      "Computer Science (Coding, Hardware, Internet, Algorithms)",
      "Engineering (Buildings, Bridges, Machines, Problem Solving)",
      "Astrobiology (Life on other planets)",
      "Environmental Science (Renewable energy, Conservation)"
    ];

    const complexityPrompt = `
      - For Kindergarten to 2nd Grade: Use simple words, focus on basic counting, shapes, and easy nature facts.
      - For 3rd to 5th Grade: Include multiplication, basic science cycles (water/plants), and simple anatomy.
      - For 6th to 8th Grade: Use middle school concepts like variables, cell biology, and physical forces.
      - For 9th to 12th Grade: Provide advanced high-school level challenges in Chemistry, Physics, advanced Math (Calculus/Trig), and Computer Science.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are an expert STEM educator. Generate a UNIQUE, creative, and highly specific multiple-choice question for a student in ${level}.
          
          CRITICAL RULES:
          1. Strictly adjust complexity for the grade level: ${complexityPrompt}
          2. Topic diversity: Choose a random topic from this list: ${topics.join(", ")}.
          3. Avoid common/generic questions. Be specific.
          4. Ensure all options are plausible but only one is correct.
          
          Return ONLY valid JSON: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "emoji": "...", "type": "..."}` 
        },
        { 
          role: "user", 
          content: `Generate a new question that is DIFFERENT from previous ones. 
          Current context: ${randomSeed} / ${timestamp}` 
        }
      ],
      temperature: 0.9, // INCREASED TO 0.9 FOR MORE VARIETY
      presence_penalty: 0.6, // ENCOURAGES NEW TOPICS
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({
      question: "What is 10 + 10?",
      options: ["15", "20", "25", "30"],
      correctAnswer: "20",
      emoji: "➕",
      type: "math"
    });
  }
}
