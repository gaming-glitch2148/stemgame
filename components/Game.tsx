'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Lock, Zap, RefreshCw, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameState = 'onboarding' | 'playing' | 'gameover';
type Level = 'Kindergarten' | '1st Grade' | '2nd Grade';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('onboarding');
  const [level, setLevel] = useState<Level>('Kindergarten');
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Sound effect simulation
  const playSound = (type: 'correct' | 'wrong') => {
    // In production, use Audio() object
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        body: JSON.stringify({ level }),
      });
      const data = await res.json();
      setQuestion(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelSelect = (lvl: Level) => {
    setLevel(lvl);
    setGameState('playing');
    fetchQuestion();
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(answer);
    
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      playSound('correct');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF69B4', '#00CED1']
      });
      setScore(s => s + 10);
      setTimeout(fetchQuestion, 2000); 
    } else {
      playSound('wrong');
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  const handlePurchase = () => {
    // In production, redirect to Stripe Checkout or similar
    alert("Redirecting to payment gateway...");
    setTimeout(() => {
        setIsPremium(true);
        alert("Purchase successful! Ads removed.");
    }, 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
      
      {/* Header / HUD */}
      <div className="flex justify-between items-center p-6 pb-2">
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="font-bold text-yellow-700 dark:text-yellow-300">{score}</span>
        </div>
        {isPremium && (
          <div className="flex items-center gap-1 text-purple-500 font-bold text-xs uppercase tracking-wider">
            <Star className="w-4 h-4 fill-current" /> Premium
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          
          {gameState === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-6 text-center"
            >
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 mb-2">
                  Stem Blast! 🚀
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">Choose your level to start:</p>
              </div>

              <div className="grid gap-4">
                {(['Kindergarten', '1st Grade', '2nd Grade'] as Level[]).map((lvl) => (
                  <motion.button
                    key={lvl}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleLevelSelect(lvl)}
                    className="p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold text-xl shadow-lg shadow-blue-500/30 flex items-center justify-between group"
                  >
                    <span>{lvl}</span>
                    <span className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                      <Zap className="w-5 h-5" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col h-full"
            >
              {loading || !question ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <p>Robot is thinking...</p>
                </div>
              ) : (
                <>
                  {/* Question Card */}
                  <div className="bg-white dark:bg-zinc-800 rounded-3xl p-8 shadow-xl mb-8 text-center relative overflow-hidden border-2 border-zinc-100 dark:border-zinc-700">
                    <div className="absolute top-0 left-0 w-full h-2 bg-zinc-100">
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 10 }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                    
                    <span className="text-6xl mb-4 block filter drop-shadow-md animate-bounce-slow">
                      {question.emoji}
                    </span>
                    <h2 className="text-2xl font-black text-zinc-800 dark:text-white leading-tight">
                      {question.question}
                    </h2>
                  </div>

                  {/* Answers Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {question.options.map((opt: string, i: number) => {
                      const isSelected = selectedAnswer === opt;
                      const statusColor = isSelected 
                        ? (isCorrect ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600')
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500';
                      
                      const textColor = isSelected ? 'text-white' : 'text-zinc-700 dark:text-zinc-200';

                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswer(opt)}
                          disabled={!!selectedAnswer && isCorrect === true} // Lock only if correct
                          className={`
                            p-4 rounded-2xl font-bold text-lg border-b-4 transition-all duration-200
                            ${statusColor} ${textColor}
                            shadow-sm
                          `}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Ads */}
      {!isPremium && (
        <div className="bg-zinc-100 dark:bg-zinc-950 p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg p-3 text-center mb-3 min-h-[100px] flex items-center justify-center">
             {/* Actual Google AdSense Unit Placeholder */}
             <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-9141375569651908"
                 data-ad-slot="9452334599"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
          
          <button 
            onClick={handlePurchase}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Lock className="w-4 h-4" />
            Remove Ads ($0.99/mo)
          </button>
        </div>
      )}
    </div>
  );
}
