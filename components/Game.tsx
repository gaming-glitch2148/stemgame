'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Lock, Zap, RefreshCw, ChevronDown, CheckCircle2, AlertCircle, BookOpen, FlaskConical, Code, Atom } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameState = 'onboarding' | 'playing' | 'gameover';

const LEVELS = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', 
  '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
  '10th Grade', '11th Grade', '12th Grade'
];

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: Zap, color: 'text-blue-500' },
  { id: 'science', name: 'Science', icon: FlaskConical, color: 'text-green-500' },
  { id: 'coding', name: 'Coding & Logic', icon: Code, color: 'text-purple-500' },
  { id: 'space', name: 'Space & Physics', icon: Atom, color: 'text-orange-500' }
];

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('onboarding');
  const [level, setLevel] = useState<string>('Kindergarten');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, [gameState, isPremium, subject]);

  const fetchQuestion = async (selectedLevel = level, currentSubject = subject.name, currentScore = score) => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    try {
      const res = await fetch(`/api/quiz?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          level: selectedLevel,
          subject: currentSubject,
          score: currentScore,
          history: history.slice(-10)
        }),
      });
      
      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      
      if (data && data.question) {
        setQuestion(data);
        setHistory(prev => [...prev, data.question]);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setQuestion({
        question: "What is 2 + 2?",
        options: ["3", "4", "5"],
        correctAnswer: "4",
        emoji: "➕"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    setGameState('playing');
    setHistory([]);
    // Score is NOT reset if just changing subjects, but we clear it when starting fresh from onboarding
    // unless they came from a sub-menu. Actually, per requirements:
    // Change subjects WITHOUT resetting score within the grade level.
    // Reset score ONLY if grade changes.
    setGameState('playing');
    fetchQuestion(level, subject.name, score);
  };

  const handleResetRequest = () => {
    if (gameState === 'playing' && score > 0) {
      setShowResetConfirm(true);
    } else {
      setGameState('onboarding');
    }
  };

  const confirmReset = () => {
    setScore(0);
    setHistory([]);
    setGameState('onboarding');
    setShowResetConfirm(false);
  };

  const handleSubjectChange = (newSub: typeof SUBJECTS[0]) => {
    setSubject(newSub);
    setShowSubjectDropdown(false);
    if (gameState === 'playing') {
      fetchQuestion(level, newSub.name, score);
    }
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer || !question) return; 
    setSelectedAnswer(answer);
    
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      const newScore = score + 10;
      setScore(newScore);
      setTimeout(() => fetchQuestion(level, subject.name, newScore), 2000); 
    } else {
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 1500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20">
      
      {/* Reset Confirmation Overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-800 rounded-[2rem] p-8 text-center shadow-2xl border border-white/10">
              <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Switch Grade?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 font-medium">This will reset your score and progress for {level}.</p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmReset} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-bold">Yes, Reset Progress</button>
                <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-700 font-bold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="flex justify-between items-center p-6 pb-2">
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="font-bold text-yellow-700">{score}</span>
        </div>
        
        {/* Playing Subject Switcher */}
        {gameState === 'playing' && (
          <div className="relative">
            <button onClick={() => setShowSubjectDropdown(!showSubjectDropdown)} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700">
              <subject.icon className={`w-4 h-4 ${subject.color}`} />
              <span className="text-xs font-bold">{subject.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showSubjectDropdown && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 rounded-2xl shadow-xl z-50">
                  {SUBJECTS.map((sub) => (
                    <button key={sub.id} onClick={() => handleSubjectChange(sub)} className="w-full p-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 first:rounded-t-2xl last:rounded-b-2xl">
                      <sub.icon className={`w-4 h-4 ${sub.color}`} />
                      <span className="text-sm font-semibold">{sub.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={handleResetRequest} className="p-2 text-zinc-400"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {gameState === 'onboarding' ? (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 text-center py-4">
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white">STEM BLAST!</h1>
                <p className="text-zinc-500 font-medium">Select your path to wisdom</p>
              </div>

              {/* Grade Selector */}
              <div className="relative">
                <button onClick={() => setShowLevelDropdown(!showLevelDropdown)} className="w-full p-5 bg-white border-2 border-zinc-100 rounded-3xl flex items-center justify-between font-bold text-zinc-700">
                  <span className="flex items-center gap-3"><Zap className="w-5 h-5 text-blue-500" />{level}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showLevelDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showLevelDropdown && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute z-50 w-full mt-2 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl max-h-48 overflow-y-auto">
                      {LEVELS.map((lvl) => (
                        <button key={lvl} onClick={() => { setLevel(lvl); setShowLevelDropdown(false); }} className={`w-full p-4 text-left font-semibold ${level === lvl ? 'text-blue-600 bg-blue-50' : 'text-zinc-600'}`}>{lvl}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Subject Selector */}
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((sub) => (
                  <button 
                    key={sub.id} 
                    onClick={() => setSubject(sub)}
                    className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${subject.id === sub.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-100 text-zinc-600'}`}
                  >
                    <sub.icon className={`w-6 h-6 ${subject.id === sub.id ? 'text-white' : sub.color}`} />
                    <span className="text-xs font-bold">{sub.name}</span>
                  </button>
                ))}
              </div>

              <button onClick={handleStartGame} className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black text-xl shadow-lg mt-4">
                PLAY NOW
              </button>
            </motion.div>
          ) : (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              {loading || !question ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin opacity-30" />
                  <p className="text-zinc-400 font-bold uppercase text-[10px]">Asking the AI Specialist...</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="text-center mb-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${subject.color} bg-white border-current`}>
                      {level} • {subject.name}
                    </span>
                  </div>
                  <div className="bg-white rounded-3xl p-8 shadow-sm mb-6 text-center border-2 border-zinc-50 min-h-[200px] flex flex-col justify-center items-center">
                    <span className="text-7xl mb-4">{question.emoji}</span>
                    <h2 className="text-2xl font-bold text-zinc-800 leading-tight">{question.question}</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {question.options.map((opt: string, i: number) => {
                      const isAnswerCorrect = opt === question.correctAnswer;
                      const isSelected = selectedAnswer === opt;
                      let variant = "bg-white border-zinc-100 text-zinc-700";
                      if (selectedAnswer) {
                        if (isAnswerCorrect) variant = "bg-green-500 border-green-600 text-white shadow-lg";
                        else if (isSelected) variant = "bg-red-500 border-red-600 text-white";
                        else variant = "opacity-40";
                      }
                      return (
                        <motion.button key={i} onClick={() => handleAnswer(opt)} disabled={!!selectedAnswer} className={`p-5 rounded-2xl font-bold text-lg border-2 transition-all text-left ${variant}`}>
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isPremium && (
        <div className="p-4 bg-zinc-50 border-t border-zinc-100">
          <div className="bg-white rounded-2xl p-4 text-center mb-4 border border-zinc-200 min-h-[100px] flex items-center justify-center overflow-hidden">
             <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-9141375569651908" data-ad-slot="9452334599" data-ad-format="auto" data-full-width-responsive="true"></ins>
          </div>
          <button onClick={() => setIsPremium(true)} className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10">
            <Lock className="w-4 h-4" /> GO AD-FREE ($0.99/mo)
          </button>
        </div>
      )}
    </div>
  );
}
