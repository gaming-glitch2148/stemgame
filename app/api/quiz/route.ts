import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { level, subject, difficulty, history } = await req.json();

    // 1. Map UI Grade labels to file naming convention
    let gradeKey = level.toLowerCase();
    if (level.includes('Grade')) {
      const match = level.match(/\d+/);
      if (match) {
        gradeKey = `G${match[0]}`;
      }
    }

    // 2. Map UI Subject labels to file naming convention
    let subjectKey = subject;
    if (subject === 'Space & Physics') {
      subjectKey = 'SpacePhysics';
    } else if (subject === 'Coding & Logic') {
      subjectKey = 'CodingLogic';
    }

    // 3. Construct file path based on user selections
    // Pattern: [Grade]_[Subject]_[Difficulty].csv
    const fileName = `${gradeKey}_${subjectKey}_${difficulty}.csv`.replace(/ /g, '_');
    const filePath = path.join(process.cwd(), 'data', 'questions', fileName);

    try {
      // 4. Try to read the local CSV file
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
      });

      let questions = parsedData.data as any[];

      // Filter by Difficulty if the file contains multiple
      questions = questions.filter(q => 
        q['Difficulty']?.toLowerCase() === difficulty.toLowerCase()
      );

      // Filter out questions already seen in this session
      if (history && history.length > 0) {
        const unseenQuestions = questions.filter(q => !history.includes(q['Question']));
        if (unseenQuestions.length > 0) {
          questions = unseenQuestions;
        }
      }

      if (questions.length === 0) {
        throw new Error("No new questions available in this CSV.");
      }

      // 5. Pick a random question from your CSV
      const randomQ = questions[Math.floor(Math.random() * questions.length)];

      return NextResponse.json({
        question: randomQ['Question'],
        options: [randomQ['A'], randomQ['B'], randomQ['C'], randomQ['D']].filter(Boolean),
        correctAnswer: randomQ['Correct Ans'],
        emoji: "🧪",
        type: randomQ['Topic'] || subject,
        source: 'csv'
      });

    } catch (fileErr: any) {
      console.warn(`CSV Error for ${fileName}:`, fileErr.message);
      
      return NextResponse.json({
        question: `Great job! You've mastered our current ${subject} challenges for ${level}. New questions are coming soon!`,
        options: ["Change Subject", "Try Again", "Go Back"],
        correctAnswer: "Change Subject",
        emoji: "🏆",
        type: "System"
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
