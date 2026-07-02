import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { HelpCircle, Brain, Trophy, Coins, RotateCw, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TriviaQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface TriviaSectionProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onAddSystemMessage: (content: string) => void;
}

// Preset questions to act as fallback or standard pool
const PRESET_TRIVIA: TriviaQuestion[] = [
  {
    question: "Dans Demon Slayer, quelle fleur repousse les démons ?",
    options: ["Fleur de Cerisier", "Fleur de Glycine", "Fleur de Lotus", "Lys Rouge"],
    answer: "Fleur de Glycine",
    explanation: "La glycine (Wisteria) est une fleur toxique pour les démons dans l'univers de Demon Slayer."
  },
  {
    question: "Comment s'appelle le pouvoir légendaire transmis de génération en génération à Deku dans My Hero Academia ?",
    options: ["All For One", "One For All", "Plus Ultra", "Super Fuerza"],
    answer: "One For All",
    explanation: "Le One For All est l'Alter originellement détenu par Yoichi Shigaraki et transmis ensuite à All Might, puis Izuku Midoriya."
  },
  {
    question: "Quel est le vrai nom de L, le célèbre détective dans Death Note ?",
    options: ["Lawliet", "Lyuza", "Light", "Lind L. Taylor"],
    answer: "Lawliet",
    explanation: "Le vrai nom complet du génial détective L est L Lawliet."
  },
  {
    question: "Dans l'univers de Hunter x Hunter, quel type de Nen possède Gon Freecss ?",
    options: ["Renforcement", "Transformation", "Matérialisation", "Spécialisation"],
    answer: "Renforcement",
    explanation: "Gon fait partie de la catégorie du Renforcement, ce qui augmente grandement ses capacités physiques brutes."
  },
  {
    question: "Combien y a-t-il de Portes de Chakra ouvertes par Might Guy face à Madara Uchiha ?",
    options: ["6 Portes", "7 Portes", "8 Portes", "9 Portes"],
    answer: "8 Portes",
    explanation: "Might Guy ouvre la huitième porte, la porte de la Mort, pour affronter Madara en mode Rikudo."
  }
];

export default function TriviaSection({ user, onUpdateUser, onAddSystemMessage }: TriviaSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [triviaCount, setTriviaCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isAiQuestion, setIsAiQuestion] = useState(false);

  const fetchQuestion = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setIsAiQuestion(false);

    try {
      // Try fetching from the Gemini backend
      const res = await fetch('/api/gemini/trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.question && Array.isArray(data.options) && data.answer) {
          setCurrentQuestion({
            question: data.question,
            options: data.options,
            answer: data.answer,
            explanation: data.explanation || "Bravo, c'est la bonne réponse !"
          });
          setIsAiQuestion(true);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load AI trivia. Falling back to preset questions.", e);
    }

    // Fallback to preset trivia if API is not available or fails
    const randomPreset = PRESET_TRIVIA[Math.floor(Math.random() * PRESET_TRIVIA.length)];
    setCurrentQuestion(randomPreset);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleAnswerSubmit = (option: string) => {
    if (selectedAnswer !== null) return; // Prevent double answer
    setSelectedAnswer(option);

    const check = option.trim().toLowerCase() === currentQuestion?.answer.trim().toLowerCase();
    setIsCorrect(check);
    setTriviaCount(prev => prev + 1);

    if (check) {
      setCorrectCount(prev => prev + 1);
      // Reward user with 50 Otaku Coins
      onUpdateUser({
        ...user,
        coins: user.coins + 50
      });
      onAddSystemMessage(`🏆 ${user.username} a répondu correctement au quiz Otaku (+50 coins) !`);
    } else {
      onAddSystemMessage(`❌ ${user.username} a échoué au quiz Otaku. La bonne réponse était : **${currentQuestion?.answer}**.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-green-900 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-emerald-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            <h1 className="text-2xl font-black tracking-wider text-white">🏆 SALON TRIVIA QUIZZ</h1>
          </div>
          <p className="text-emerald-200 text-sm mt-1">Évalue ta culture manga/anime ! Chaque bonne réponse rapporte +50 Otaku Coins !</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-emerald-300 text-xs">
            <Trophy size={14} /> Score: {correctCount}/{triviaCount}
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-yellow-500/30 text-yellow-400 text-xs font-mono font-bold">
            <Coins size={14} /> {user.coins} Coins
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center py-12"
            >
              <RotateCw className="text-emerald-400 animate-spin mb-4" size={40} />
              <p className="text-slate-400 text-sm font-semibold animate-pulse">L'Oracle Otaku prépare une question...</p>
            </motion.div>
          ) : currentQuestion ? (
            <motion.div
              key="question-box"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full bg-slate-950/80 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-6"
            >
              {/* Question source tag */}
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isAiQuestion ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                  {isAiQuestion ? '⚡ IA GENERATED QUESTION' : '📚 PRESET QUESTION'}
                </span>
                <span className="text-xs font-mono text-emerald-400">+50 Coins</span>
              </div>

              {/* Question text */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Brain size={20} />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white leading-snug mt-1">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
                  
                  let btnStyle = "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800";
                  if (selectedAnswer !== null) {
                    if (isCorrectAnswer) {
                      btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10";
                    } else if (isSelected) {
                      btnStyle = "bg-red-950/80 border-red-500 text-red-200 shadow-lg shadow-red-500/10";
                    } else {
                      btnStyle = "bg-slate-900/40 border-slate-850 text-slate-500 cursor-not-allowed";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSubmit(option)}
                      disabled={selectedAnswer !== null}
                      className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex justify-between items-center ${btnStyle} ${selectedAnswer === null ? 'hover:-translate-y-0.5 active:translate-y-0' : ''}`}
                    >
                      <span>{option}</span>
                      {selectedAnswer !== null && isCorrectAnswer && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                      {selectedAnswer !== null && isSelected && !isCorrectAnswer && <XCircle size={16} className="text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Steps */}
              {selectedAnswer !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border text-sm mt-2 flex flex-col gap-2 ${isCorrect ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-red-950/30 border-red-500/20'}`}
                >
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={16} /> Bonne réponse !</span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1"><XCircle size={16} /> Mauvaise réponse...</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs italic leading-relaxed">"{currentQuestion.explanation}"</p>
                  
                  <button
                    onClick={fetchQuestion}
                    className="mt-4 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors self-end"
                  >
                    Question Suivante <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
