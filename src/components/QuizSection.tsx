import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Trophy, Clock, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { LanguageCode } from '../utils/translations';

interface QuizSectionProps {
  activeLanguage: LanguageCode;
  onUpdateUser: (coins: number) => void;
  onAddSystemMessage: (msg: string) => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

const DEEPSEEK_API_KEY = "sk-82ad1af90b1a499b827581f8e4928898";

export function QuizSection({ activeLanguage, onUpdateUser, onAddSystemMessage }: QuizSectionProps) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuestion = async () => {
    if (loading) return;
    setLoading(true);
    setQuestion(null);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimeLeft(15);
    
    if (timerRef.current) clearInterval(timerRef.current);

    const langMap = {
      'fr': 'French',
      'en': 'English',
      'es': 'Spanish',
      'ja': 'Japanese'
    };

    const prompt = `Generate a random, interesting multiple-choice trivia question about Anime or Manga.
The language of the response must be EXACTLY: ${langMap[activeLanguage]}.
Return ONLY a valid JSON object with this exact structure, no markdown, no other text:
{
  "question": "The question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 2
}
Where correctAnswer is the integer index (0-3) of the correct option in the options array.`;

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content) as QuizQuestion;
        if (parsed.question && Array.isArray(parsed.options) && typeof parsed.correctAnswer === 'number') {
          setQuestion(parsed);
          // Start 15s timer
          timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                handleTimeUp(parsed.correctAnswer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          throw new Error("Invalid format");
        }
      } else {
         throw new Error("API Error");
      }
    } catch (error) {
      console.error("Quiz Error:", error);
      // Fallback to static questions
      const fallbackQuestions = [
        {
          question: "Qui est le créateur de One Piece ?",
          options: ["Masashi Kishimoto", "Akira Toriyama", "Eiichiro Oda", "Tite Kubo"],
          correctAnswer: 2
        },
        {
          question: "Dans Naruto, quel est le nom du démon renard à neuf queues ?",
          options: ["Shukaku", "Kurama", "Gyuki", "Matatabi"],
          correctAnswer: 1
        },
        {
          question: "Quel anime met en scène des Titans mangeurs d'hommes ?",
          options: ["Tokyo Ghoul", "L'Attaque des Titans", "Demon Slayer", "Jujutsu Kaisen"],
          correctAnswer: 1
        }
      ];
      const randomQ = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      setQuestion(randomQ);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimeUp(randomQ.correctAnswer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      onAddSystemMessage("⚠️ L'IA est surchargée, mode hors-ligne activé !");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = (correctIdx: number) => {
    setIsCorrect(false);
    setSelectedAnswer(-1); // Indicator for timeout
    onAddSystemMessage("⏰ Time's up for the Quiz!");
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || isCorrect !== null || !question) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(index);
    
    if (index === question.correctAnswer) {
      setIsCorrect(true);
      onUpdateUser(20);
      onAddSystemMessage("🎉 Correct Answer! You earned 20 coins.");
    } else {
      setIsCorrect(false);
      onAddSystemMessage("❌ Wrong Answer!");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500 uppercase tracking-widest flex items-center justify-center gap-3">
            <Brain size={32} className="text-pink-500" />
            DeepSeek AI Quiz
          </h2>
          <p className="text-slate-400 mt-2 font-medium">
            Test your Otaku knowledge against the AI and win coins! You have 15 seconds.
          </p>
        </div>

        {!question && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl"
          >
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy size={48} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ready for the challenge?</h3>
            <p className="text-sm text-slate-400 mb-8">Questions are dynamically generated by DeepSeek AI in multiple languages.</p>
            <button
              onClick={fetchQuestion}
              className="bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider py-4 px-12 rounded-2xl shadow-lg shadow-pink-500/25 transition-all active:scale-95"
            >
              Generate Quiz
            </button>
          </motion.div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw size={40} className="text-indigo-500 animate-spin" />
            <p className="text-indigo-400 font-bold animate-pulse tracking-widest">Generating AI Question...</p>
          </div>
        )}

        {question && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Timer Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
              <motion.div 
                className={`h-full ${timeLeft > 5 ? 'bg-indigo-500' : 'bg-red-500'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / 15) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <div className="flex justify-between items-center mb-6 mt-2">
              <span className="text-xs font-black text-pink-500 uppercase tracking-widest bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20">
                Otaku Trivia
              </span>
              <div className={`flex items-center gap-1.5 font-mono text-lg font-black ${timeLeft > 5 ? 'text-indigo-400' : 'text-red-400 animate-pulse'}`}>
                <Clock size={20} />
                {timeLeft}s
              </div>
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-8 text-center">
              {question.question}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((opt, idx) => {
                let btnClass = "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200";
                let Icon = null;

                if (selectedAnswer !== null || isCorrect !== null) {
                  // Reveal mode
                  if (idx === question.correctAnswer) {
                    btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                    Icon = CheckCircle2;
                  } else if (idx === selectedAnswer) {
                    btnClass = "bg-red-500/20 border-red-500 text-red-400";
                    Icon = XCircle;
                  } else {
                    btnClass = "bg-slate-900 border-slate-800 text-slate-600 opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedAnswer !== null || isCorrect !== null}
                    onClick={() => handleAnswer(idx)}
                    className={`relative p-4 rounded-xl border-2 font-semibold text-sm md:text-base text-left transition-all flex items-center justify-between ${btnClass}`}
                  >
                    <span>{opt}</span>
                    {Icon && <Icon size={20} className={idx === question.correctAnswer ? "text-emerald-500" : "text-red-500"} />}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {(selectedAnswer !== null || isCorrect !== null) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-center"
                >
                  <button
                    onClick={fetchQuestion}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw size={16} /> Next Question
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
