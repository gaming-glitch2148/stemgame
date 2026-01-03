import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { level, subject, difficulty, history } = await req.json();

    // 1. Map Grade to File Format
    // We try 'K' first (from image) then 'kindergarten' (from text)
    let gradeKey = level === 'Kindergarten' ? 'K' : (level.match(/\d+/) ? `G${level.match(/\d+/)[0]}` : level);
    let subjectKey = subject.replace('Mathematics', 'Maths').replace('Space & Physics', 'SpacePhysics').replace('Coding & Logic', 'CodingLogic');
    
    let diffKey = 'Easy';
    if (difficulty === 'Intermediate') diffKey = 'Intermediate';
    else if (difficulty === 'Expert' || difficulty === 'Hard') diffKey = 'Hard';

    let fileName = `${gradeKey}_${subjectKey}_${diffKey}.csv`;
    let filePath = path.join(process.cwd(), 'data', 'questions', fileName);

    console.log("--- FETCH REQUEST START ---");
    console.log("Primary Target File:", fileName);

    let fileContent;
    try {
      fileContent = await fs.readFile(filePath, 'utf8');
    } catch (e) {
      // Try fallback for Kindergarten if K didn't work
      if (level === 'Kindergarten') {
        fileName = `kindergarten_${subjectKey}_${diffKey}.csv`;
        filePath = path.join(process.cwd(), 'data', 'questions', fileName);
        console.log("Retrying with fallback filename:", fileName);
        fileContent = await fs.readFile(filePath, 'utf8');
      } else {
        throw e;
      }
    }

    // 2. Parse CSV
    const parsedData = Papa.parse(fileContent.trim(), { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase() // Crucial for matching "Correct Answer"
    });
    
    let questions = parsedData.data as any[];
    if (questions.length === 0) throw new Error("File is empty");

    // Log headers to debug "Correct Answer" column
    console.log("Parsed Headers (normalized):", Object.keys(questions[0]).join(", "));

    // 3. Filter History
    if (history && history.length > 0) {
      const unseen = questions.filter(q => {
        const qText = q['question'];
        return !history.includes(qText);
      });
      if (unseen.length > 0) questions = unseen;
    }

    const randomQ = questions[Math.floor(Math.random() * questions.length)];

    // 4. Robust Value Extraction
    // We look for 'correct answer' based on the user's reconfirmation
    const questionText = randomQ['question'] || "";
    const optA = randomQ['a'] || "";
    const optB = randomQ['b'] || "";
    const optC = randomQ['c'] || "";
    const optD = randomQ['d'] || "";
    let correctValue = randomQ['correct answer'] || randomQ['correct ans'] || randomQ['answer'] || "";

    // 5. Letter-to-Text Mapping
    // If CSV says "A" but UI clicked "Mars", we must return "Mars"
    const choiceMap: Record<string, string> = { 
      'a': optA, 
      'b': optB, 
      'c': optC, 
      'd': optD 
    };
    
    const normalizedCorrect = correctValue.toString().trim().toLowerCase();
    let finalCorrectAnswer = correctValue;

    if (choiceMap[normalizedCorrect]) {
      console.log(`Mapped letter '${correctValue}' to full text: '${choiceMap[normalizedCorrect]}'`);
      finalCorrectAnswer = choiceMap[normalizedCorrect];
    }

    console.log("Sending Question:", questionText);
    console.log("Sending Correct Ans:", finalCorrectAnswer);
    console.log("--- FETCH REQUEST END ---");

    return NextResponse.json({
      question: questionText.replace(/^[A-Z]?\d+[:.]\s*/i, '').trim(),
      options: [optA, optB, optC, optD].filter(o => o && o.toString().trim().length > 0),
      correctAnswer: finalCorrectAnswer.toString().trim(),
      emoji: "🧠",
      type: randomQ['topic'] || subject
    });

  } catch (error: any) {
    console.error("Quiz API Error:", error.message);
    return NextResponse.json({
      question: `Coming Soon: ${subject} curriculum for this level!`,
      options: ["Go Back", "Change Level"],
      correctAnswer: "Go Back",
      emoji: "🛠️"
    });
  }
}
