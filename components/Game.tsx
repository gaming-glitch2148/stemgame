'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Lock, Zap, RefreshCw, ChevronDown, CheckCircle2, AlertCircle, BookOpen, FlaskConical, Code, Atom, LogIn, LogOut, Lightbulb, PlayCircle, XCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSession, signIn, signOut } from "next-auth/react";

type GameState = 'auth-gate' | 'grade-selection' | 'subject-selection' | 'difficulty-selection' | 'playing';
type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

const LEVELS = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', 
  '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
  '10th Grade', '11th Grade', '12th Grade'
];

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'science', name: 'Science', icon: FlaskConical, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'coding', name: 'Coding & Logic', icon: Code, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'space', name: 'Space & Physics', icon: Atom, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }
];

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Expert'];

export default function Game() {
  const { data: session, status } = useSession();
  const [gameState, setGameState] = useState<GameState>('auth-gate');
  const [level, setLevel] = useState<string>('Kindergarten');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [adTimer, setAdTimer] = useState<number | null>(null);
  const [showAdFullscreen, setShowAdFullscreen] = useState(false);
  const [showAdExitConfirm, setShowAdExitConfirm] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Persistence: Load saved progress
  useEffect(() => {
    if (status === "authenticated") {
      const savedLevel = localStorage.getItem('stem_level');
      const savedSubjectId = localStorage.getItem('stem_subject_id');
      const savedDifficulty = localStorage.getItem('stem_difficulty') as Difficulty;
      const savedScore = localStorage.getItem('stem_score');

      if (savedLevel && savedSubjectId && savedDifficulty) {
        setLevel(savedLevel);
        const sub = SUBJECTS.find(s => s.id === savedSubjectId);
        if (sub) setSubject(sub);
        setDifficulty(savedDifficulty);
        if (savedScore) setScore(parseInt(savedScore));
        setGameState('playing');
        fetchQuestion(savedLevel, sub?.name, parseInt(savedScore || '0'), savedDifficulty);
      } else {
        setGameState('grade-selection');
      }
    }
  }, [status]);

  // Persistence: Save progress on changes
  useEffect(() => {
    if (gameState === 'playing') {
      localStorage.setItem('stem_level', level);
      localStorage.setItem('stem_subject_id', subject.id);
      localStorage.setItem('stem_difficulty', difficulty);
      localStorage.setItem('stem_score', score.toString());
    }
  }, [level, subject, difficulty, score, gameState]);

  const fetchQuestion = async (selectedLevel = level, currentSubject = subject.name, currentScore = score, currentDiff = difficulty) => {
    setLoading(true);
    setIsCorrect(false);
    setHint(null);
    setWrongAnswers([]);
    setFeedback(null);
    try {
      const res = await fetch(`/api/quiz?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selectedLevel, subject: currentSubject, score: currentScore, difficulty: currentDiff, history: history.slice(-10) }),
      });
      const data = await res.json();
      if (data && data.question) {
        // Robust cleanup: Remove any row IDs like Q318: or 318: from anywhere in the text
        data.question = data.question.replace(/Q?\d+:\s*/i, '').trim();
        setQuestion(data);
        setHistory(prev => [...prev, data.question]);
      }
    } catch (e) { console.error("Fetch Error:", e); } finally { setLoading(false); }
  };

  const handleAnswer = (answer: string) => {
    console.log("Button clicked:", answer);
    if (isCorrect || !question || wrongAnswers.includes(answer)) {
      console.log("Click ignored - isCorrect:", isCorrect, "wrongAnswers:", wrongAnswers);
      return;
    }
    
    try {
      const sanitize = (str: string) => (str || "").trim().toLowerCase().replace(/\s+/g, ' ');
      const cleanUser = sanitize(answer);
      const cleanCorrect = sanitize(question.correctAnswer);

      if (cleanUser === cleanCorrect) {
        setIsCorrect(true);
        setFeedback("Correct! 🌟");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setScore(prev => prev + 10);
        setTimeout(() => fetchQuestion(), 2500);
      } else {
        setWrongAnswers(prev => [...prev, answer]);
        setFeedback("Try again! 🤔");
        setScore(prev => Math.max(0, prev - 2));
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch (err) {
      console.error("Answer Logic Error:", err);
    }
  };

  const handleGetHint = (forced = false) => {
    if (!question) return;
    if (!forced && !isPremium && score < 50) return;
    if (!forced && !isPremium) setScore(prev => prev - 50);
    setHint(`Psst! It starts with "${question.correctAnswer.trim().substring(0, 2)}..."`);
  };

  const startAdReward = () => {
    if (isPremium) { handleGetHint(true); return; }
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

  const confirmReset = () => {
    localStorage.clear();
    setScore(0);
    setHistory([]);
    setGameState('grade-selection');
    setShowResetConfirm(false);
  };

  const handleSignOut = () => {
    localStorage.clear();
    signOut();
  };

  const handleCheckout = async (planType: 'monthly' | 'yearly') => {
    const priceId = planType === 'monthly' ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: session?.user?.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
  };

  const renderAuthGate = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 text-center py-10">
      <div className="space-y-4">
        <div className="w-24 h-24 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40"><Zap className="w-12 h-12 text-white fill-current" /></div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">STEM BLAST!</h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium px-10">Sign in to track your score and challenge your brain.</p>
      </div>
      <div className="px-6"><button onClick={() => signIn('google')} className="w-full py-5 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-3xl flex items-center justify-center gap-4 font-bold text-zinc-700 dark:text-zinc-200 transition-all hover:bg-zinc-50 shadow-sm"><img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" /> Continue with Google</button></div>
    </motion.div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-zinc-700/50">
      
      {/* Fullscreen Ad */}
      <AnimatePresence>
        {showAdFullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 text-center text-white">
            <button onClick={() => setShowAdExitConfirm(true)} className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><X className="w-6 h-6" /></button>
            <div className="space-y-6 w-full flex flex-col items-center">
              <div className="w-full max-w-sm aspect-video bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 relative overflow-hidden">
                 <ins className="adsbygoogle" style={{ display: 'block', width: '100%', height: '100%' }} data-ad-client="ca-pub-9141375569651908" data-ad-slot="9452334599" data-ad-format="auto" data-full-width-responsive="true"></ins>
              </div>
              <div className="text-4xl font-black text-purple-400 tabular-nums">{adTimer}s</div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Sponsor Content</p>
            </div>
            {showAdExitConfirm && (
              <div className="absolute inset-0 z-[210] bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-xs text-center"><AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" /><p className="mb-6 text-zinc-300 text-sm">Exit early and lose your hint?</p><button onClick={() => setShowAdExitConfirm(false)} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold mb-3">Keep Watching</button><button onClick={confirmExitAd} className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-xl">Exit</button></div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white dark:bg-zinc-800 rounded-[2rem] p-8 text-center border border-white/10 shadow-2xl"><AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" /><h3 className="text-xl font-black mb-2 text-zinc-900 dark:text-zinc-50">Change Settings?</h3><p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">Progress will be reset.</p><div className="flex flex-col gap-3"><button onClick={confirmReset} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-bold">Reset & Continue</button><button onClick={() => setShowResetConfirm(false)} className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700">Cancel</button></div></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      {gameState !== 'auth-gate' && (
        <div className="flex justify-between items-center p-6 pb-2 relative z-[60]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700/50 shadow-sm"><Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /><span className="font-bold text-yellow-700 dark:text-yellow-300">{score}</span></div>
            <button onClick={handleSignOut} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"><LogOut className="w-4 h-4" /></button>
          </div>
          {gameState === 'playing' && (
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${subject.color} border-current bg-white dark:bg-zinc-900 shadow-sm`}>{subject.name}</div>
              <button onClick={() => setShowResetConfirm(true)} className="p-2 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"><RefreshCw className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <AnimatePresence mode="wait">
          {gameState === 'auth-gate' && renderAuthGate()}
          {gameState === 'grade-selection' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 text-center">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Grade</h1>
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-50">
                {LEVELS.map(lvl => <button key={lvl} onClick={() => { setLevel(lvl); setGameState('subject-selection'); }} className="p-5 rounded-3xl border-2 font-bold hover:border-blue-400 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-all shadow-sm">{lvl}</button>)}
              </div>
            </motion.div>
          )}
          {gameState === 'subject-selection' && (
            <motion.div initial={{ x: 20 }} animate={{ x: 0 }} className="flex flex-col gap-8 text-center">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Subject</h1>
              <div className="grid grid-cols-2 gap-4 relative z-50">
                {SUBJECTS.map(sub => <button key={sub.id} onClick={() => { setSubject(sub); setGameState('difficulty-selection'); }} className="p-6 rounded-3xl border-2 flex flex-col items-center gap-3 bg-white dark:bg-zinc-800 hover:border-zinc-300 transition-all shadow-sm"><sub.icon className={sub.color} size={32} /> <span className="font-bold text-zinc-700 dark:text-zinc-200">{sub.name}</span></button>)}
              </div>
            </motion.div>
          )}
          {gameState === 'difficulty-selection' && (
            <motion.div initial={{ x: 20 }} animate={{ x: 0 }} className="flex flex-col gap-8 text-center">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Difficulty</h1>
              <div className="grid gap-4 relative z-50">
                {DIFFICULTIES.map(diff => <button key={diff} onClick={() => { setDifficulty(diff); setGameState('playing'); fetchQuestion(level, subject.name, score, diff); }} className="p-6 rounded-3xl border-2 font-black text-xl bg-white dark:bg-zinc-800 hover:border-blue-400 transition-all shadow-sm">{diff}</button>)}
              </div>
            </motion.div>
          )}
          {gameState === 'playing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              {loading || !question ? <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 animate-pulse"><RefreshCw className="animate-spin text-blue-500" size={48} /> <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Asking the AI Specialist...</p></div> : (
                <>
                  <div className="bg-white dark:bg-zinc-800 rounded-3xl p-8 shadow-sm mb-6 text-center border-2 border-zinc-50 dark:border-zinc-700/50 min-h-[220px] flex flex-col justify-center items-center relative overflow-hidden">
                    <AnimatePresence>{feedback && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-4 w-full text-center font-black text-blue-500 uppercase tracking-widest text-sm z-10">{feedback}</motion.div>}</AnimatePresence>
                    <span className="text-7xl mb-4 filter drop-shadow-md">{question.emoji}</span>
                    <h2 className="text-2xl font-bold leading-tight text-zinc-800 dark:text-zinc-100">{question.question}</h2>
                    {hint && <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-xl border border-yellow-100 dark:border-yellow-800 shadow-sm animate-bounce-slow">💡 Hint: {hint}</div>}
                  </div>
                  <div className="grid gap-3 relative z-[70]">
                    {question.options.map((opt: string, i: number) => {
                      const isFound = isCorrect && opt.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
                      const isWrong = wrongAnswers.includes(opt);
                      let variant = "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-500";
                      if (isFound) variant = "bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/30";
                      else if (isWrong) variant = "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-300 dark:text-zinc-600 opacity-60";
                      
                      return <button key={i} onClick={() => handleAnswer(opt)} disabled={isCorrect} className={`p-5 rounded-2xl font-bold text-lg border-2 transition-all text-left shadow-sm ${variant}`}>{opt}</button>;
                    })}
                  </div>
                  <div className="mt-8 flex gap-3 pb-4 relative z-50">
                    <button onClick={() => handleGetHint()} disabled={!!hint || isCorrect} className="flex-1 p-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-xs hover:bg-yellow-500 active:scale-95 transition-all shadow-md disabled:opacity-50">50 PTS HINT</button>
                    {!isPremium && <button onClick={() => startAdReward()} disabled={isCorrect} className="flex-1 p-4 bg-purple-600 text-white rounded-2xl font-black text-xs hover:bg-purple-700 active:scale-95 transition-all shadow-md disabled:opacity-50">AD HINT</button>}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isPremium && gameState !== 'auth-gate' && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 relative z-50">
          <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-lg">
            <Lock className="w-4 h-4" size={16} /> GO AD-FREE ($0.99/mo or $10/yr)
          </button>
        </div>
      )}

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[110] bg-black/70 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center border border-white/10">
              <Star className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-black mb-2 text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">Premium</h2>
              <div className="space-y-4 my-8">
                <button onClick={() => handleCheckout('monthly')} className="w-full p-5 rounded-2xl border-2 dark:border-zinc-700 flex items-center justify-between font-bold dark:text-zinc-200 hover:border-blue-500 transition-all text-zinc-700 dark:text-zinc-200"><p>Monthly</p> <span className="text-blue-600">$0.99</span></button>
                <button onClick={() => handleCheckout('yearly')} className="w-full p-5 rounded-2xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between font-bold dark:text-zinc-200 hover:scale-[1.02] transition-all"><p>Yearly</p> <span className="text-blue-600 font-black">$10.00</span></button>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 dark:text-zinc-500 text-sm font-bold hover:text-zinc-600 transition-colors uppercase tracking-widest">Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
