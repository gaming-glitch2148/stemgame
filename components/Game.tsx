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

  // Initialize Adsense ads after component mounts
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error:", e);
    }
  }, [gameState, isPremium]);

  const fetchQuestion = async (selectedLevel = level) => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    try {
      // CACHE BUSTING: ?t=${Date.now()} ensures we always get a fresh AI question
      const res = await fetch(`/api/quiz?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selectedLevel }),
      });
      const data = await res.json();
      setQuestion(data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    setGameState('playing');
    fetchQuestion();
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(answer);
    
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF69B4', '#00CED1']
      });
      setScore(s => s + 10);
      setTimeout(() => fetchQuestion(), 2000); 
    } else {
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  const handlePurchase = () => {
    alert("Redirecting to secure payment...");
    setTimeout(() => {
        setIsPremium(true);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20">
      
      {/* HUD */}
      <div className="flex justify-between items-center p-6 pb-2">
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full border border-yellow-200">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="font-bold text-yellow-700 dark:text-yellow-300">{score}</span>
        </div>
        <div className="flex items-center gap-2">
           {isPremium && (
            <div className="flex items-center gap-1 text-purple-600 font-bold text-[10px] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              <Star className="w-3 h-3 fill-current" /> Premium
            </div>
          )}
          <button onClick={() => setGameState('onboarding')} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <RefreshCw className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          
          {gameState === 'onboarding' && (
            <motion.div key="onboarding" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-8 text-center py-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white">STEM BLAST!</h1>
                <p className="text-zinc-500 font-medium">Learn. Play. Level Up.</p>
              </div>

              <div className="relative">
                <button onClick={() => setShowLevelDropdown(!showLevelDropdown)} className="w-full p-5 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-3xl flex items-center justify-between font-bold text-zinc-700 dark:text-zinc-200 shadow-sm">
                  <span className="flex items-center gap-3"><Zap className="w-5 h-5 text-blue-500" />{level}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showLevelDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showLevelDropdown && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border-2 border-zinc-100 rounded-[1.5rem] shadow-2xl max-h-64 overflow-y-auto">
                      {LEVELS.map((lvl) => (
                        <button key={lvl} onClick={() => { setLevel(lvl); setShowLevelDropdown(false); }} className={`w-full p-4 text-left font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between ${level === lvl ? 'text-blue-600 bg-blue-50' : 'text-zinc-600 dark:text-zinc-300'}`}>
                          {lvl} {level === lvl && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStartGame} className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black text-xl shadow-xl shadow-blue-500/20">
                PLAY NOW
              </motion.button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
              {loading || !question ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin opacity-40" />
                  <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Asking the AI...</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="text-center mb-4"><span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase">{level}</span></div>
                  <div className="bg-white dark:bg-zinc-800 rounded-3xl p-8 shadow-xl mb-6 text-center border-2 border-zinc-50 dark:border-zinc-700 min-h-[220px] flex flex-col justify-center items-center">
                    <span className="text-7xl mb-4">{question.emoji}</span>
                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-white leading-tight">{question.question}</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {question.options.map((opt: string, i: number) => {
                      const isAnswerCorrect = opt === question.correctAnswer;
                      const isSelected = selectedAnswer === opt;
                      let variant = "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-400";
                      if (selectedAnswer) {
                        if (isAnswerCorrect) variant = "bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/20 scale-[1.01]";
                        else if (isSelected) variant = "bg-red-500 border-red-600 text-white";
                        else variant = "opacity-40 grayscale-[0.5]";
                      }
                      return (
                        <motion.button key={i} onClick={() => handleAnswer(opt)} disabled={!!selectedAnswer} className={`p-5 rounded-2xl font-bold text-lg border-2 transition-all text-left flex items-center justify-between ${variant}`}>
                          {opt} {selectedAnswer && isAnswerCorrect && <CheckCircle2 className="w-5 h-5" />}
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
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 text-center mb-4 border border-zinc-200 shadow-sm min-h-[100px] flex items-center justify-center overflow-hidden">
             <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-9141375569651908"
                 data-ad-slot="9452334599"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
          <button onClick={handlePurchase} className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10">
            <Lock className="w-4 h-4" /> GO AD-FREE ($0.99/mo)
          </button>
        </div>
      )}
    </div>
  );
}
