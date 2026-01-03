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
      
      // PapaParse with better config to handle hidden characters
      const parsedData = Papa.parse(fileContent.trim(), { 
        header: true, 
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase() // Normalize headers to lowercase/trimmed
      });
      
      let questions = parsedData.data as any[];
      if (questions.length > 0) {
        console.log("Available Normalized Headers:", Object.keys(questions[0]).join(", "));
      }

      // Filter out history
      if (history && history.length > 0) {
        const unseen = questions.filter(q => {
          const qText = q['question'];
          return !history.includes(qText);
        });
        if (unseen.length > 0) questions = unseen;
      }

      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      if (!randomQ) throw new Error("Question selection failed");

      // Robust extraction based on normalized headers
      // Headers in CSV: Grade, Subject, Topic, Difficulty, Question, A, B, C, D, Correct Answer
      const questionText = randomQ['question'] || "";
      const optA = randomQ['a'] || "";
      const optB = randomQ['b'] || "";
      const optC = randomQ['c'] || "";
      const optD = randomQ['d'] || "";
      
      // Look for "correct answer" specifically as provided by user
      let correct = randomQ['correct answer'] || randomQ['correct ans'] || randomQ['correctans'] || randomQ['answer'] || "";

      // Logic: If 'Correct Answer' matches a header name (A, B, C, D), use that choice's text
      const choiceMap: any = { 'a': optA, 'b': optB, 'c': optC, 'd': optD };
      const normalizedCorrect = correct.toString().trim().toLowerCase();
      
      if (choiceMap[normalizedCorrect]) {
        console.log(`Mapping Letter Answer '${correct}' to Text: '${choiceMap[normalizedCorrect]}'`);
        correct = choiceMap[normalizedCorrect];
      }

      console.log("FINAL SERVER QUESTION:", questionText);
      console.log("FINAL SERVER CORRECT ANSWER:", correct);
      console.log("--- FETCH REQUEST END ---");

      return NextResponse.json({
        question: questionText.replace(/^[A-Z]?\d+[:.]\s*/i, '').trim(),
        options: [optA, optB, optC, optD].filter(o => o && o.toString().trim().length > 0),
        correctAnswer: correct.toString().trim(),
        emoji: "🧠",
        type: randomQ['topic'] || subject
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
