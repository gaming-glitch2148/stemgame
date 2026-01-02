import { NextResponse } from 'next/server';

// In a real app, you would use:
// import OpenAI from 'openai';
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock database of question templates for different levels
const TEMPLATES: Record<string, any[]> = {
  Kindergarten: [
    { type: 'count', text: 'How many 🍎 apples do you see?', options: ['1', '3', '5', '2'], answer: '3', emoji: '🍎', count: 3 },
    { type: 'shape', text: 'Which shape has 3 sides?', options: ['Circle', 'Triangle', 'Square', 'Star'], answer: 'Triangle', emoji: '🔺' },
    { type: 'color', text: 'What color is the sun?', options: ['Blue', 'Yellow', 'Green', 'Purple'], answer: 'Yellow', emoji: '☀️' },
    { type: 'math', text: '1 + 1 = ?', options: ['1', '2', '3', '11'], answer: '2', emoji: '1️⃣' },
  ],
  "1st Grade": [
    { type: 'math', text: '5 + 3 = ?', options: ['7', '8', '9', '10'], answer: '8', emoji: '➕' },
    { type: 'pattern', text: 'Complete the pattern: 🔴 🔵 🔴 🔵 ...', options: ['🔴', '🔵', '🟢', '🟡'], answer: '🔴', emoji: '🎨' },
    { type: 'science', text: 'What do plants need to grow?', options: ['Candy', 'Water', 'Toys', 'Sand'], answer: 'Water', emoji: '🌱' },
  ],
  "2nd Grade": [
    { type: 'math', text: 'What is 10 minus 4?', options: ['4', '5', '6', '7'], answer: '6', emoji: '➖' },
    { type: 'science', text: 'Which planet do we live on?', options: ['Mars', 'Earth', 'Venus', 'Jupiter'], answer: 'Earth', emoji: '🌍' },
    { type: 'coding', text: 'What does a loop do?', options: ['Repeats things', 'Stops things', 'Deletes things', 'Nothing'], answer: 'Repeats things', emoji: '💻' },
  ]
};

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    const templates = TEMPLATES[level as string] || TEMPLATES['Kindergarten'];
    
    // Pick a random template
    const randomQ = templates[Math.floor(Math.random() * templates.length)];
    
    // In a real AI implementation, we would call OpenAI here:
    // const completion = await openai.chat.completions.create({ messages: [...] });
    
    // Simulate network delay for "AI Thinking" effect
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({
      question: randomQ.text,
      options: randomQ.options,
      correctAnswer: randomQ.answer,
      emoji: randomQ.emoji,
      visualType: randomQ.type // 'count', 'shape' etc can trigger different UI
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
