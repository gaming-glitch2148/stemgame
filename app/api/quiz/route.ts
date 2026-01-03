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
    
    let diffKey = 'Easy';
    if (difficulty === 'Intermediate') diffKey = 'Intermediate';
    else if (difficulty === 'Expert' || difficulty === 'Hard') diffKey = 'Hard';

    const fileName = `${gradeKey}_${subjectKey}_${diffKey}.csv`;
    const filePath = path.join(process.cwd(), 'data', 'questions', fileName);

    console.log("--- FETCH REQUEST START ---");
    console.log("Target File:", fileName);

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsedData = Papa.parse(fileContent, { 
        header: true, 
        skipEmptyLines: true,
        transform: (value) => value.trim()
      });
      
      let questions = parsedData.data as any[];
      if (questions.length > 0) {
        console.log("Found Columns:", Object.keys(questions[0]).join(", "));
      }

      // Filter out history
      if (history && history.length > 0) {
        const unseen = questions.filter(q => {
          const qText = q['Question'] || q['question'];
          return !history.includes(qText);
        });
        if (unseen.length > 0) questions = unseen;
      }

      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      if (!randomQ) throw new Error("Question selection failed");

      // Helper to safely get value by key name (case insensitive)
      const getVal = (row: any, ...keys: string[]) => {
        const rowKeys = Object.keys(row);
        for (const k of keys) {
          const found = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
          if (found) return row[found];
        }
        return "";
      };

      const questionText = getVal(randomQ, 'Question');
      const optA = getVal(randomQ, 'A');
      const optB = getVal(randomQ, 'B');
      const optC = getVal(randomQ, 'C');
      const optD = getVal(randomQ, 'D');
      let correct = getVal(randomQ, 'Correct Ans', 'CorrectAns', 'Answer');

      // Map A, B, C, D to actual text if necessary
      const map: any = { 'A': optA, 'B': optB, 'C': optC, 'D': optD };
      const cleanCorrect = correct.trim().toUpperCase();
      if (map[cleanCorrect]) {
        correct = map[cleanCorrect];
      }

      console.log("SERVER SELECTED QUESTION:", questionText);
      console.log("SERVER CORRECT ANSWER:", correct);
      console.log("--- FETCH REQUEST END ---");

      return NextResponse.json({
        question: questionText.replace(/^[A-Z]?\d+[:.]\s*/i, '').trim(),
        options: [optA, optB, optC, optD].filter(o => o && o.length > 0),
        correctAnswer: correct,
        emoji: "🧠",
        type: getVal(randomQ, 'Topic') || subject
      });

    } catch (fileErr: any) {
      console.error(`SERVER FILE ERROR: ${fileName}`, fileErr.message);
      return NextResponse.json({
        question: `Curriculum check: ${fileName} not found.`,
        options: ["Go Back"],
        correctAnswer: "Go Back",
        emoji: "🛠️"
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
