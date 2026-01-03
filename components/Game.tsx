'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Lock, Zap, RefreshCw, ChevronDown, CheckCircle2, AlertCircle, BookOpen, FlaskConical, Code, Atom, LogIn, LogOut, Lightbulb, PlayCircle, XCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSession, signIn, signOut } from "next-auth/react";

type GameState = 'grade-selection' | 'subject-selection' | 'difficulty-selection' | 'playing';
type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

const LEVELS = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', 
  '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
  '10th Grade', '11th Grade', '12th Grade'
];

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'science', name: 'Science', icon: FlaskConical, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'coding', name: 'Coding & Logic', icon: Code, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'space', name: 'Space & Physics', icon: Atom, color: 'text-orange-500', bg: 'bg-orange-50' }
];

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Expert'];

export default function Game() {
  const { data: session } = useSession();
  const [gameState, setGameState] = useState<GameState>('grade-selection');
  const [level, setLevel] = useState<string>('Kindergarten');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [adTimer, setAdTimer] = useState<number | null>(null);
  const [showAdFullscreen, setShowAdFullscreen] = useState(false);
  const [showAdExitConfirm, setShowAdExitConfirm] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if coming back from successful payment
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setIsPremium(true);
      alert("Subscription activated! Welcome to Premium.");
    }
  }, []);

  const handleCheckout = async (planType: 'monthly' | 'yearly') => {
    const priceId = planType === 'monthly' 
      ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID 
      : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      alert("Payment system configuration missing. Check environment variables.");
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId, 
          email: session?.user?.email || 'guest@example.com' 
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout. Try again later.");
    }
  };

  const fetchQuestion = async (selectedLevel = level, currentSubject = subject.name, currentScore = score) => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHint(null);
    setWrongAnswers([]);
    try {
      const res = await fetch(`/api/quiz?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          level: selectedLevel,
          subject: currentSubject,
          score: currentScore,
          difficulty: difficulty,
          history: history.slice(-10)
        }),
      });
      const data = await res.json();
      if (data && data.question) {
        setQuestion(data);
        setHistory(prev => [...prev, data.question]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startAdReward = () => {
    setShowAdFullscreen(true);
    setAdTimer(40);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAdTimer(prev => {
        if (prev && prev > 1) return prev - 1;
        if (timerRef.current) clearInterval(timerRef.current);
        setShowAdFullscreen(false);
        handleGetHint(true);
        return null;
      });
    }, 1000);
  };

  const confirmExitAd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAdTimer(null);
    setShowAdFullscreen(false);
    setShowAdExitConfirm(false);
  };

  const handleGetHint = (forced = false) => {
    if (!question) return;
    if (!forced && !isPremium && score < 50) {
      alert("Not enough points! Watch a 40s ad for a free hint.");
      return;
    }
    if (!forced && !isPremium) setScore(prev => prev - 50);
    setHint(`Psst! The answer is related to ${question.correctAnswer.substring(0, 3)}...`);
  };

  const handleAnswer = (answer: string) => {
    if (wrongAnswers.includes(answer) || isCorrect) return;
    if (answer === question.correctAnswer) {
      setIsCorrect(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setScore(prev => prev + 10);
      setTimeout(() => fetchQuestion(), 2500);
    } else {
      setWrongAnswers(prev => [...prev, answer]);
      setScore(prev => Math.max(0, prev - 2));
    }
  };

  const confirmReset = () => {
    setScore(0);
    setHistory([]);
    setGameState('grade-selection');
    setShowResetConfirm(false);
  };

  const renderGradeSelection = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-zinc-900">STEM BLAST!</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Step 1: Choose Your Grade</p>
      </div>
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {LEVELS.map((lvl) => (
          <button key={lvl} onClick={() => { setLevel(lvl); setGameState('subject-selection'); }} className={`p-5 rounded-3xl border-2 font-bold text-lg transition-all ${level === lvl ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-zinc-100 text-zinc-700 hover:border-blue-400'}`}>{lvl}</button>
        ))}
      </div>
    </motion.div>
  );

  const renderSubjectSelection = () => (
    <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-8 text-center">
      <div className="space-y-2">
        <button onClick={() => setGameState('grade-selection')} className="text-blue-600 font-bold text-xs underline">← Back to Grade</button>
        <h2 className="text-3xl font-black text-zinc-900">{level}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Step 2: Pick Your Path</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SUBJECTS.map((sub) => (
          <button key={sub.id} onClick={() => { setSubject(sub); setGameState('difficulty-selection'); }} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${subject.id === sub.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300'}`}>
            <sub.icon className={`w-8 h-8 ${subject.id === sub.id ? 'text-white' : sub.color}`} />
            <span className="font-bold text-sm">{sub.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );

  const renderDifficultySelection = () => (
    <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-8 text-center">
      <div className="space-y-2">
        <button onClick={() => setGameState('subject-selection')} className="text-blue-600 font-bold text-xs underline">← Back to Subject</button>
        <h2 className="text-3xl font-black text-zinc-900">{subject.name}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Step 3: Level of Challenge</p>
      </div>
      <div className="space-y-4">
        {DIFFICULTIES.map((diff) => (
          <button key={diff} onClick={() => { setDifficulty(diff); setGameState('playing'); fetchQuestion(); }} className={`w-full p-6 rounded-3xl border-2 font-black text-xl transition-all flex items-center justify-between group ${difficulty === diff ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-zinc-100 text-zinc-700 hover:border-blue-400'}`}>
            {diff}
            <ChevronDown className="w-5 h-5 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20">
      
      {/* Fullscreen Ad Experience */}
      <AnimatePresence>
        {showAdFullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 text-center">
            <button onClick={() => setShowAdExitConfirm(true)} className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white"><X className="w-6 h-6" /></button>
            <div className="space-y-6">
              <PlayCircle className="w-20 h-20 text-purple-500 mx-auto animate-pulse" />
              <h2 className="text-2xl font-black text-white uppercase">Sponsor Message</h2>
              <div className="relative w-32 h-32 flex items-center justify-center mx-auto">
                <svg className="w-full h-full -rotate-90"><circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" /><motion.circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-purple-500" initial={{ strokeDasharray: "377 377", strokeDashoffset: 377 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 40, ease: "linear" }} /></svg>
                <span className="absolute text-3xl font-black text-white">{adTimer}</span>
              </div>
            </div>
            {showAdExitConfirm && (
              <div className="absolute inset-0 z-[210] bg-black/90 flex items-center justify-center p-6">
                <div className="bg-zinc-900 rounded-[2rem] p-8 border border-white/10 max-w-xs text-center">
                  <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white">Wait! No Reward?</h3>
                  <p className="text-zinc-400 text-sm mb-6">If you close now, you won't get your free hint.</p>
                  <button onClick={() => setShowAdExitConfirm(false)} className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold mb-3">Keep Watching</button>
                  <button onClick={confirmExitAd} className="w-full py-4 rounded-xl bg-zinc-800 text-zinc-400 font-bold">Exit & Forfeit</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[2rem] p-8 text-center max-w-sm">
              <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-black mb-2">Change Game Settings?</h3>
              <p className="text-zinc-500 mb-6 font-medium">This will reset your current session progress.</p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmReset} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-bold">Reset & Continue</button>
                <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 rounded-2xl bg-zinc-100 font-bold">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="flex justify-between items-center p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full border border-yellow-200">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="font-bold text-yellow-700">{score}</span>
          </div>
          {session ? <button onClick={() => signOut()} className="p-2 bg-zinc-100 rounded-full"><LogOut className="w-4 h-4 text-zinc-600" /></button> : <button onClick={() => signIn()} className="p-2 bg-blue-100 rounded-full"><LogIn className="w-4 h-4 text-blue-600" /></button>}
        </div>
        
        {gameState === 'playing' && (
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${subject.color} border-current`}>{subject.name}</div>
            <button onClick={() => setShowResetConfirm(true)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full"><RefreshCw className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <AnimatePresence mode="wait">
          {gameState === 'grade-selection' && renderGradeSelection()}
          {gameState === 'subject-selection' && renderSubjectSelection()}
          {gameState === 'difficulty-selection' && renderDifficultySelection()}
          
          {gameState === 'playing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              {loading || !question ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-zinc-400 font-bold uppercase text-[10px]">Consulting AI...</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm mb-6 text-center border-2 border-zinc-50 relative min-h-[220px] flex flex-col justify-center items-center">
                    <span className="text-7xl mb-4">{question.emoji}</span>
                    <h2 className="text-2xl font-bold text-zinc-800 leading-tight">{question.question}</h2>
                    {hint && <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-xl border border-yellow-100">💡 Hint: {hint}</div>}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {question.options.map((opt: string, i: number) => {
                      const isWrong = wrongAnswers.includes(opt);
                      const isFound = isCorrect && opt === question.correctAnswer;
                      let variant = "bg-white border-zinc-100 text-zinc-700";
                      if (isFound) variant = "bg-green-500 border-green-600 text-white shadow-lg";
                      else if (isWrong) variant = "bg-zinc-50 border-zinc-100 text-zinc-300 scale-95 opacity-50 cursor-not-allowed";
                      return (<button key={i} onClick={() => handleAnswer(opt)} className={`p-5 rounded-2xl font-bold text-lg border-2 transition-all text-left flex items-center justify-between ${variant}`}>{opt}{isWrong && <XCircle className="w-5 h-5 text-red-400" />}{isFound && <CheckCircle2 className="w-5 h-5 text-white" />}</button>);
                    })}
                  </div>

                  <div className="mt-8 flex gap-3 pb-4">
                    <button onClick={() => handleGetHint()} disabled={!!hint} className="flex-1 p-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-yellow-500 disabled:opacity-50"><Lightbulb className="w-4 h-4" /> 50 PTS HINT</button>
                    {!isPremium && (<button onClick={startAdReward} className="flex-1 p-4 bg-purple-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-purple-700"><PlayCircle className="w-4 h-4" /> AD HINT</button>)}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isPremium && gameState === 'grade-selection' && (
        <div className="p-4 bg-zinc-50 border-t border-zinc-100">
          <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold text-xs flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> GO AD-FREE ($0.99/mo or $10/yr)
          </button>
        </div>
      )}

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[110] bg-black/70 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center">
              <Star className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-2">Upgrade to Premium</h2>
              <div className="space-y-4 my-8">
                <button onClick={() => handleCheckout('monthly')} className="w-full p-5 rounded-2xl border-2 flex items-center justify-between font-bold hover:border-blue-500"><p>Monthly</p> <span>$0.99</span></button>
                <button onClick={() => handleCheckout('yearly')} className="w-full p-5 rounded-2xl border-2 border-blue-500 bg-blue-50 flex items-center justify-between font-bold"><p>Yearly</p> <span>$10.00</span></button>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 text-sm font-bold">Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
