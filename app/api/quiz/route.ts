import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { level, subject, difficulty, history } = await req.json();

    // 1. Map Grade to File Format (K, G1, G2...)
    let gradeKey = level;
    if (level === 'Kindergarten') {
      gradeKey = 'K';
    } else if (level.includes('Grade')) {
      const match = level.match(/\d+/);
      if (match) gradeKey = `G${match[0]}`;
    }

    // 2. Map Subject to File Format
    let subjectKey = subject;
    if (subject === 'Mathematics') subjectKey = 'Maths';
    else if (subject === 'Science') subjectKey = 'Science';
    else if (subject === 'Coding & Logic') subjectKey = 'CodingLogic';
    else if (subject === 'Space & Physics') subjectKey = 'SpacePhysics';

    // 3. Map Difficulty to File Format (Easy, Intermediate, Hard)
    let diffKey = 'Easy';
    if (difficulty === 'Intermediate') diffKey = 'Intermediate';
    else if (difficulty === 'Expert') diffKey = 'Hard';

    // 4. Construct file path
    const fileName = `${gradeKey}_${subjectKey}_${diffKey}.csv`;
    const filePath = path.join(process.cwd(), 'data', 'questions', fileName);

    console.log(`Loading Question File: ${fileName}`);

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => value.trim() // TRIM ALL INCOMING DATA
      });

      let questions = parsedData.data as any[];

      // Filter out questions already seen in this session
      if (history && history.length > 0) {
        const unseen = questions.filter(q => !history.includes(q['Question']));
        if (unseen.length > 0) questions = unseen;
      }

      if (questions.length === 0) throw new Error("No questions available.");

      const randomQ = questions[Math.floor(Math.random() * questions.length)];

      // LOGIC: Handle CSVs where 'Correct Ans' is a letter (A, B, C, D)
      let correctAnswer = randomQ['Correct Ans'] || "";
      const optionsMap: Record<string, string> = {
        'A': randomQ['A'],
        'B': randomQ['B'],
        'C': randomQ['C'],
        'D': randomQ['D']
      };

      const upperAns = correctAnswer.toUpperCase();
      if (optionsMap[upperAns]) {
        correctAnswer = optionsMap[upperAns];
      }

      return NextResponse.json({
        question: randomQ['Question'],
        options: [randomQ['A'], randomQ['B'], randomQ['C'], randomQ['D']].filter(Boolean),
        correctAnswer: correctAnswer,
        emoji: "🧠",
        type: randomQ['Topic'] || subject,
        source: 'csv'
      });

    } catch (fileErr: any) {
      console.error(`FILE NOT FOUND OR EMPTY: ${fileName}`);
      return NextResponse.json({
        question: `Curriculum update in progress! The ${difficulty} challenges for ${level} ${subject} are coming soon.`,
        options: ["Try another subject", "Go Back"],
        correctAnswer: "Try another subject",
        emoji: "🛠️",
        type: "System"
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
