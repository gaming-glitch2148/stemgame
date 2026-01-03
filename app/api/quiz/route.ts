import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { level, subject, difficulty, history } = await req.json();

    // 1. Map Grade to File Format
    let gradeKey = level === 'Kindergarten' ? 'K' : (level.match(/\d+/) ? `G${level.match(/\d+/)[0]}` : level);
    let subjectKey = subject.replace('Mathematics', 'Maths').replace('Space & Physics', 'SpacePhysics').replace('Coding & Logic', 'CodingLogic');
    
    // Normalize difficulty for filename
    let diffKey = 'Easy';
    if (difficulty === 'Intermediate') diffKey = 'Intermediate';
    else if (difficulty === 'Expert' || difficulty === 'Hard') diffKey = 'Hard';

    const fileName = `${gradeKey}_${subjectKey}_${diffKey}.csv`;
    const filePath = path.join(process.cwd(), 'data', 'questions', fileName);

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsedData = Papa.parse(fileContent, { 
        header: true, 
        skipEmptyLines: true,
        transform: (value) => value.trim() // Ensure all values are trimmed
      });
      
      let questions = parsedData.data as any[];

      // Helper to safely get value by key name (case insensitive)
      const getVal = (row: any, ...keys: string[]) => {
        const rowKeys = Object.keys(row);
        for (const k of keys) {
          const found = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
          if (found) return row[found];
        }
        return "";
      };

      // Filter out history
      if (history && history.length > 0) {
        const unseen = questions.filter(q => {
          const qText = getVal(q, 'Question');
          return !history.includes(qText);
        });
        if (unseen.length > 0) questions = unseen;
      }

      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      if (!randomQ) throw new Error("Question selection failed");

      const questionText = getVal(randomQ, 'Question');
      const optA = getVal(randomQ, 'A');
      const optB = getVal(randomQ, 'B');
      const optC = getVal(randomQ, 'C');
      const optD = getVal(randomQ, 'D');
      let correct = getVal(randomQ, 'Correct Ans', 'CorrectAns', 'Answer');

      // Map A, B, C, D to actual text if necessary
      const map: any = { 
        'A': optA, 
        'B': optB, 
        'C': optC, 
        'D': optD,
        'OPTION A': optA,
        'OPTION B': optB,
        'OPTION C': optC,
        'OPTION D': optD
      };
      
      const cleanCorrect = correct.toUpperCase();
      if (map[cleanCorrect]) {
        correct = map[cleanCorrect];
      }

      return NextResponse.json({
        question: questionText.replace(/^[A-Z]?\d+[:.]\s*/i, '').trim(),
        options: [optA, optB, optC, optD].filter(o => o && o.length > 0),
        correctAnswer: correct, // Keep the exact string for matching
        emoji: "🧠",
        type: getVal(randomQ, 'Topic') || subject
      });

    } catch (fileErr: any) {
      console.error(`CSV Error (${fileName}):`, fileErr.message);
      return NextResponse.json({
        question: `We are polishing the ${difficulty} curriculum for ${level} ${subject}. Try another topic!`,
        options: ["Change Subject", "Go Back"],
        correctAnswer: "Change Subject",
        emoji: "🛠️"
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
