'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Lock, Zap, RefreshCw, ChevronDown, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameState = 'onboarding' | 'playing' | 'gameover';

const LEVELS = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', 
  '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
  '10th Grade', '11th Grade', '12th Grade'
];

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('onboarding');
  const [level, setLevel] = useState<string>('Kindergarten');
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, [gameState, isPremium]);

  const fetchQuestion = async (selectedLevel = level) => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    try {
      const res = await fetch(`/api/quiz?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selectedLevel }),
      });
      
      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      
      // Safety: ensure we have a valid question object
      if (data && data.question) {
        setQuestion(data);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (e) {
      console.error("Fetch error:", e);
      // Fallback to a hardcoded question if the API fails entirely
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
    fetchQuestion();
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
      setScore(s => s + 10);
      setTimeout(() => fetchQuestion(), 2000); 
    } else {
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 1500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20">
      
      {/* HUD */}
      <div className="flex justify-between items-center p-6 pb-2">
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="font-bold text-yellow-700">{score}</span>
        </div>
        <div className="flex items-center gap-2">
           {isPremium && (
            <div className="text-purple-600 font-bold text-[10px] bg-purple-50 px-3 py-1 rounded-full uppercase">Premium</div>
          )}
          <button onClick={() => setGameState('onboarding')} className="p-2 text-zinc-400"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {gameState === 'onboarding' ? (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 text-center py-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-zinc-900">STEM BLAST!</h1>
                <p className="text-zinc-500 font-medium italic">Powered by AI</p>
              </div>

              <div className="relative">
                <button onClick={() => setShowLevelDropdown(!showLevelDropdown)} className="w-full p-5 bg-zinc-50 rounded-3xl flex items-center justify-between font-bold text-zinc-700 border-2 border-zinc-100">
                  <span className="flex items-center gap-3"><Zap className="w-5 h-5 text-blue-500" />{level}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showLevelDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showLevelDropdown && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute z-50 w-full mt-2 bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl max-h-64 overflow-y-auto">
                      {LEVELS.map((lvl) => (
                        <button key={lvl} onClick={() => { setLevel(lvl); setShowLevelDropdown(false); }} className={`w-full p-4 text-left font-semibold hover:bg-blue-50 ${level === lvl ? 'text-blue-600 bg-blue-50' : 'text-zinc-600'}`}>
                          {lvl}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={handleStartGame} className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-200">
                PLAY NOW
              </button>
            </motion.div>
          ) : (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              {loading || !question ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin opacity-30" />
                  <p className="text-zinc-400 font-bold uppercase text-[10px]">Loading Challenge...</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="bg-white rounded-3xl p-8 shadow-sm mb-6 text-center border-2 border-zinc-50 min-h-[200px] flex flex-col justify-center items-center">
                    <span className="text-7xl mb-4">{question.emoji}</span>
                    <h2 className="text-2xl font-bold text-zinc-800 leading-tight">{question.question}</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {question.options.map((opt: string, i: number) => {
                      const isAnswerCorrect = opt === question.correctAnswer;
                      const isSelected = selectedAnswer === opt;
                      let variant = "bg-white border-zinc-100 text-zinc-700 hover:border-blue-300";
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
          <div className="bg-white rounded-2xl p-4 text-center mb-4 border border-zinc-200 min-h-[100px] flex items-center justify-center">
             <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-9141375569651908" data-ad-slot="9452334599" data-ad-format="auto" data-full-width-responsive="true"></ins>
          </div>
          <button onClick={() => setIsPremium(true)} className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold text-xs flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> GO AD-FREE ($0.99/mo)
          </button>
        </div>
      )}
    </div>
  );
}
