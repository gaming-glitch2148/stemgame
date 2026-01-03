import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { level, subject, difficulty, history } = await req.json();

    let gradeKey = level === 'Kindergarten' ? 'K' : (level.match(/\d+/) ? `G${level.match(/\d+/)[0]}` : level);
    let subjectKey = subject.replace('Mathematics', 'Maths').replace('Space & Physics', 'SpacePhysics').replace('Coding & Logic', 'CodingLogic');
    let diffKey = difficulty === 'Intermediate' ? 'Intermediate' : (difficulty === 'Expert' ? 'Hard' : 'Easy');

    const fileName = `${gradeKey}_${subjectKey}_${diffKey}.csv`;
    const filePath = path.join(process.cwd(), 'data', 'questions', fileName);

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsedData = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      let questions = parsedData.data as any[];

      if (history && history.length > 0) {
        const unseen = questions.filter(q => !history.includes(Object.values(q)[4])); // Assuming Question is 5th col
        if (unseen.length > 0) questions = unseen;
      }

      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      
      // DYNAMIC HEADER MATCHING
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

      // If Correct Ans is a letter, map it to the choice text
      const map: any = { 'A': optA, 'B': optB, 'C': optC, 'D': optD };
      if (map[correct.trim().toUpperCase()]) {
        correct = map[correct.trim().toUpperCase()];
      }

      return NextResponse.json({
        question: questionText.replace(/^[A-Z]?\d+[:.]\s*/i, '').trim(),
        options: [optA, optB, optC, optD].filter(o => o && o.trim()),
        correctAnswer: correct.trim(),
        emoji: "🧠",
        type: getVal(randomQ, 'Topic') || subject,
        source: 'csv'
      });

    } catch (fileErr: any) {
      return NextResponse.json({
        question: `Preparing new challenges for ${level} ${subject}!`,
        options: ["Try another subject", "Go Back"],
        correctAnswer: "Try another subject",
        emoji: "🛠️"
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
