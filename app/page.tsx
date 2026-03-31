'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { questions, categoryInfo, satisfactionQuestions, educationLevels } from '@/lib/questions';
import { submitQuizResponse, submitSatisfactionResponse } from '@/lib/googleSheets';

const KnowledgePdf = dynamic(() => import('@/components/KnowledgePdf'), { ssr: false, loading: () => null });

// Types
type Screen = 'splash' | 'setup' | 'quiz' | 'results' | 'survey' | 'thanks';
type Gender = 'male' | 'female' | 'lgbtq' | 'unspecified' | null;
type AgeGroup = 'under10' | '10-19' | 'over20' | null;

interface PlayerData {
  gender: Gender;
  ageGroup: AgeGroup;
  education: string;
}

interface GameState {
  currentQuestion: number;
  score: number;
  streak: number;
  maxStreak: number;
  answers: (number | null)[];
  showingKnowledge: boolean;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
}

interface SurveyState {
  ratings: Record<string, number>;
  feedback: string;
}


// Floating Bubbles Component
function FloatingBubbles() {
  const bubbles = [
    { size: 90, color: '#FF85A8', top: '8%', left: '5%', delay: 0 },
    { size: 70, color: '#D8B4FE', top: '15%', right: '8%', delay: 1 },
    { size: 50, color: '#7DD3FC', bottom: '35%', left: '8%', delay: 2 },
    { size: 80, color: '#86EFAC', bottom: '20%', right: '6%', delay: 0.5 },
    { size: 40, color: '#FDBA74', top: '45%', right: '12%', delay: 1.5 },
    { size: 55, color: '#FDE047', top: '55%', left: '5%', delay: 2.5 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((bubble, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            width: bubble.size,
            height: bubble.size,
            backgroundColor: bubble.color,
            top: bubble.top,
            left: bubble.left,
            right: bubble.right,
            bottom: bubble.bottom,
            animationDelay: `${bubble.delay}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
}

// Confetti Component
function Confetti() {
  const colors = ['#FF85A8', '#D8B4FE', '#7DD3FC', '#86EFAC', '#FDE047', '#FDBA74'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Animated Rating Face Component
function RatingFace({
  level,
  selected,
  onClick,
  disabled,
}: {
  level: 1 | 2 | 3 | 4 | 5;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  const faceConfig = {
    1: {
      color: '#FB7185',
      label: 'แย่มาก',
      idle: 'face-tremble',
      eyes: 'sad',
      mouth: 'frown-wavy',
    },
    2: {
      color: '#FDBA74',
      label: 'ไม่ค่อยดี',
      idle: 'face-tilt',
      eyes: 'worried',
      mouth: 'frown',
    },
    3: {
      color: '#FDE047',
      label: 'ก็งั้นๆ',
      idle: 'face-float',
      eyes: 'neutral',
      mouth: 'flat',
    },
    4: {
      color: '#4ADE80',
      label: 'ดีเลย!',
      idle: 'face-bounce',
      eyes: 'happy',
      mouth: 'smile',
    },
    5: {
      color: '#F0ABFC',
      gradient: 'linear-gradient(135deg, #FF85A8 0%, #D8B4FE 100%)',
      label: 'สุดปัง!!',
      idle: 'face-vibrate',
      eyes: 'star',
      mouth: 'big-smile',
    },
  };

  const config = faceConfig[level];

  const handleClick = () => {
    if (disabled) return;
    setIsAnimating(true);
    setShowEffects(true);
    onClick();
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
    setTimeout(() => {
      setShowEffects(false);
    }, 1000);
  };

  const getIdleAnimation = () => {
    if (selected || isAnimating) return '';
    if (disabled) return '';
    return config.idle;
  };

  const getSelectAnimation = () => {
    if (!isAnimating) return '';
    if (level === 1) return 'face-melt';
    if (level === 2) return 'face-sigh';
    if (level === 3) return 'face-shrug';
    if (level === 4) return 'face-jump';
    if (level === 5) return 'face-spin';
    return '';
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled && !selected}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${
        selected ? 'scale-110' : disabled && !selected ? 'opacity-30 scale-90' : 'hover:scale-105'
      }`}
    >
      <div
        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center overflow-visible
          ${getIdleAnimation()} ${getSelectAnimation()} 
          ${selected ? 'ring-4 ring-offset-2' : ''}`}
        style={{
          background: config.gradient || config.color,
          ['--tw-ring-color' as string]: config.color,
        }}
      >
        {/* Eyes */}
        <div className="absolute top-2.5 sm:top-3 left-0 right-0 flex justify-center gap-2 sm:gap-2.5">
          {config.eyes === 'sad' && (
            <>
              <div className="relative">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                <div className="absolute -top-1 -left-0.5 w-3 h-1.5 border-b-2 border-white/80 transform -rotate-12" />
              </div>
              <div className="relative">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                <div className="absolute -top-1 -right-0.5 w-3 h-1.5 border-b-2 border-white/80 transform rotate-12" />
              </div>
            </>
          )}
          {config.eyes === 'worried' && (
            <>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
            </>
          )}
          {config.eyes === 'neutral' && (
            <>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full face-blink" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full face-blink" />
            </>
          )}
          {config.eyes === 'happy' && (
            <>
              <div className="w-2.5 h-1 sm:w-3 sm:h-1.5 bg-white rounded-full transform -rotate-6" />
              <div className="w-2.5 h-1 sm:w-3 sm:h-1.5 bg-white rounded-full transform rotate-6" />
            </>
          )}
          {config.eyes === 'star' && (
            <>
              <span className="text-[10px] sm:text-xs text-yellow-200 drop-shadow">★</span>
              <span className="text-[10px] sm:text-xs text-yellow-200 drop-shadow">★</span>
            </>
          )}
        </div>

        {/* Mouth */}
        <div className="absolute bottom-2.5 sm:bottom-3 left-0 right-0 flex justify-center">
          {config.mouth === 'frown-wavy' && (
            <div className="w-3 h-1.5 sm:w-4 sm:h-2 border-t-2 border-white rounded-t-full" />
          )}
          {config.mouth === 'frown' && (
            <div className="w-2.5 h-1 sm:w-3 sm:h-1.5 border-t-2 border-white rounded-t-full" />
          )}
          {config.mouth === 'flat' && <div className="w-3 h-0.5 sm:w-4 bg-white rounded-full" />}
          {config.mouth === 'smile' && (
            <div className="w-3 h-1.5 sm:w-4 sm:h-2 border-b-2 border-white rounded-b-full" />
          )}
          {config.mouth === 'big-smile' && (
            <div className="w-4 h-2 sm:w-5 sm:h-2.5 bg-white rounded-b-full" />
          )}
        </div>

        {/* Floating hearts for level 5 (idle) */}
        {level === 5 && !selected && !disabled && (
          <>
            <span 
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-[10px] opacity-80"
              style={{ animation: 'heart-float 2s ease-out infinite' }}
            >
              ❤️
            </span>
            <span 
              className="absolute -top-2 left-1/4 text-[8px] opacity-60"
              style={{ animation: 'heart-float 2.5s ease-out infinite', animationDelay: '0.5s' }}
            >
              💕
            </span>
          </>
        )}

        {/* Sparkles for level 4 when selected */}
        {level === 4 && showEffects && (
          <>
            <span className="absolute -top-2 -right-2 text-sm" style={{ animation: 'sparkle 0.6s ease-out forwards' }}>✨</span>
            <span className="absolute -top-1 -left-2 text-xs" style={{ animation: 'sparkle 0.6s ease-out 0.1s forwards' }}>✨</span>
            <span className="absolute -bottom-2 right-0 text-xs" style={{ animation: 'sparkle 0.6s ease-out 0.2s forwards' }}>✨</span>
          </>
        )}

        {/* Confetti burst for level 5 when selected */}
        {level === 5 && showEffects && (
          <>
            <span className="absolute -top-3 left-1/2 text-sm" style={{ animation: 'sparkle 0.8s ease-out forwards' }}>🎉</span>
            <span className="absolute -top-1 -right-3 text-xs" style={{ animation: 'sparkle 0.8s ease-out 0.1s forwards' }}>⭐</span>
            <span className="absolute -top-1 -left-3 text-xs" style={{ animation: 'sparkle 0.8s ease-out 0.15s forwards' }}>💖</span>
            <span className="absolute -bottom-2 -right-2 text-xs" style={{ animation: 'sparkle 0.8s ease-out 0.2s forwards' }}>✨</span>
            <span className="absolute -bottom-2 -left-2 text-xs" style={{ animation: 'sparkle 0.8s ease-out 0.25s forwards' }}>🌟</span>
          </>
        )}

        {/* Tears for level 1 when selected */}
        {level === 1 && showEffects && (
          <>
            <div
              className="absolute top-5 left-2.5 w-1 h-2 bg-blue-300 rounded-full"
              style={{ animation: 'tear-drop 0.8s ease-out forwards' }}
            />
            <div
              className="absolute top-5 right-2.5 w-1 h-2 bg-blue-300 rounded-full"
              style={{ animation: 'tear-drop 0.8s ease-out 0.15s forwards' }}
            />
          </>
        )}

        {/* Sweat for level 2 when selected */}
        {level === 2 && showEffects && (
          <div
            className="absolute top-0.5 right-1.5 w-1.5 h-2.5 bg-blue-200 rounded-full"
            style={{ animation: 'sweat-slide 1s ease-out forwards' }}
          />
        )}
      </div>
      <span
        className={`text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap ${
          selected ? 'opacity-100 scale-105' : 'opacity-60'
        }`}
        style={{ color: selected ? config.color : '#666' }}
      >
        {config.label}
      </span>
    </button>
  );
}

// Score Popup Component
function ScorePopup({ points, show }: { points: number; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-float-up text-xl sm:text-2xl font-black text-emerald-500 whitespace-nowrap">
      +{points}
    </div>
  );
}

// Main App Component
export default function TeenClubQuiz() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [player, setPlayer] = useState<PlayerData>({
    gender: null,
    ageGroup: null,
    education: '',
  });
  const [game, setGame] = useState<GameState>({
    currentQuestion: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    answers: [],
    showingKnowledge: false,
    selectedAnswer: null,
    isCorrect: null,
  });
  const [survey, setSurvey] = useState<SurveyState>({
    ratings: {},
    feedback: '',
  });
  const [showCombo, setShowCombo] = useState<string | null>(null);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Preload PDF for current + next question so the cache is warm before modal opens
  useEffect(() => {
    if (screen !== 'quiz') return;
    const ids = [
      questions[game.currentQuestion]?.knowledgeCard.pdfId,
      questions[game.currentQuestion + 1]?.knowledgeCard.pdfId,
    ].filter(Boolean) as string[];
    ids.forEach((id) => fetch(`/api/pdf/${id}`, { priority: 'low' } as RequestInit));
  }, [screen, game.currentQuestion]);

  // Calculate score with streak bonus
  const calculatePoints = useCallback((streak: number) => {
    if (streak >= 5) return 200;
    if (streak >= 3) return 150;
    if (streak >= 2) return 120;
    return 100;
  }, []);

  // Handle answer selection
  const handleAnswer = (answerIndex: number) => {
    if (game.selectedAnswer !== null) return;

    const question = questions[game.currentQuestion];
    const isCorrect = answerIndex === question.correctIndex;
    const newStreak = isCorrect ? game.streak + 1 : 0;
    const points = isCorrect ? calculatePoints(newStreak) : 0;

    setGame((prev) => ({
      ...prev,
      selectedAnswer: answerIndex,
      isCorrect,
      streak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak),
      score: prev.score + points,
      answers: [...prev.answers, answerIndex],
    }));

    if (isCorrect) {
      setLastPoints(points);
      setShowScorePopup(true);
      setTimeout(() => setShowScorePopup(false), 1000);

      if (newStreak >= 3) {
        setShowCombo(`COMBO x${newStreak}!`);
        setTimeout(() => setShowCombo(null), 1500);
      }
    }

    // Show knowledge card after delay
    setTimeout(() => {
      setGame((prev) => ({ ...prev, showingKnowledge: true }));
    }, 1500);
  };

  const genderLabel: Record<string, string> = { male: 'ชาย', female: 'หญิง', lgbtq: 'LGBTQ+', unspecified: 'ไม่ประสงค์ระบุ' };
  const ageLabel: Record<string, string> = { under10: 'ต่ำกว่า 10 ปี', '10-19': '10-19 ปี', over20: '20 ปีขึ้นไป' };

  // Move to next question
  const nextQuestion = () => {
    if (game.currentQuestion >= questions.length - 1) {
      const finalAnswers = game.answers.map((a) => a ?? -1);
      const finalScore = game.answers.filter((a, i) => a === questions[i].correctIndex).length;
      submitQuizResponse({
        gender: genderLabel[player.gender ?? ''] ?? '',
        ageGroup: ageLabel[player.ageGroup ?? ''] ?? '',
        education: player.education,
        answers: finalAnswers,
        score: finalScore,
        totalQuestions: questions.length,
      });
      setScreen('results');
      return;
    }

    setGame((prev) => ({
      ...prev,
      currentQuestion: prev.currentQuestion + 1,
      showingKnowledge: false,
      selectedAnswer: null,
      isCorrect: null,
    }));
  };

  // Reset game
  const resetGame = () => {
    setScreen('splash');
    setPlayer({ gender: null, ageGroup: null, education: '' });
    setGame({
      currentQuestion: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      answers: [],
      showingKnowledge: false,
      selectedAnswer: null,
      isCorrect: null,
    });
    setSurvey({ ratings: {}, feedback: '' });
    setShowConfetti(false);
    setAnimatedScore(0);
  };

  // Survey completion check
  const allSurveyRatings =
    satisfactionQuestions.content.length +
    satisfactionQuestions.design.length +
    satisfactionQuestions.usefulness.length;
  const completedRatings = Object.keys(survey.ratings).length;
  const surveyComplete = completedRatings >= allSurveyRatings;

  // Submit survey
  const submitSurvey = async () => {
    const keys = [
      ...satisfactionQuestions.content.map((_, i) => `content-${i}`),
      ...satisfactionQuestions.design.map((_, i) => `design-${i}`),
      ...satisfactionQuestions.usefulness.map((_, i) => `usefulness-${i}`),
    ];
    const ratings = keys.map((k) => survey.ratings[k] ?? 0);
    await submitSatisfactionResponse({ ratings, comments: survey.feedback });
    setShowConfetti(true);
    setScreen('thanks');
  };

  // Calculate results
  const correctAnswers = game.answers.filter((a, i) => a === questions[i].correctIndex).length;
  const percentage = Math.round((correctAnswers / questions.length) * 100);

  // Get trophy based on performance
  const getTrophy = () => {
    if (percentage >= 91)
      return { emoji: '🏆', text: 'แชมป์เปี้ยน! เทพสุดๆ', color: 'text-yellow-500' };
    if (percentage >= 71)
      return { emoji: '🥇', text: 'สุดยอด! ความรู้แน่นมาก', color: 'text-yellow-500' };
    if (percentage >= 31)
      return { emoji: '🥈', text: 'ดีมากเลย! เก่งขึ้นแน่นอน', color: 'text-gray-400' };
    return { emoji: '🥉', text: 'ยังต้องฝึกฝน! ลองอีกครั้งนะ', color: 'text-amber-600' };
  };

  // Category breakdown
  const getCategoryStats = (cat: 1 | 2 | 3) => {
    const catQuestions = questions.filter((q) => q.category === cat);
    const catCorrect = catQuestions.filter((q) => {
      const qIndex = questions.indexOf(q);
      return game.answers[qIndex] === q.correctIndex;
    }).length;
    return { total: catQuestions.length, correct: catCorrect };
  };

  // Show confetti on high score
  useEffect(() => {
    if (screen === 'results' && percentage >= 91) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [screen, percentage]);

  // Animate score count up
  useEffect(() => {
    if (screen === 'results') {
      const duration = 2000;
      const steps = 60;
      const increment = game.score / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= game.score) {
          setAnimatedScore(game.score);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [screen, game.score]);

  return (
    <main className="min-h-screen gradient-mesh">
      {showConfetti && <Confetti />}

      {/* Combo text overlay */}
      {showCombo && (
        <div className="fixed top-1/3 left-1/2 z-50 animate-combo-fly pointer-events-none">
          <div className="gradient-game text-white text-2xl sm:text-3xl font-black px-6 py-3 rounded-2xl shadow-2xl whitespace-nowrap">
            🔥 {showCombo}
          </div>
        </div>
      )}

      {/* SPLASH SCREEN */}
      {screen === 'splash' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <FloatingBubbles />

          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm mx-auto">
            {/* Logo area */}
            <div className="mb-5 animate-bounce-in">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl gradient-game flex items-center justify-center shadow-2xl mx-auto">
                <span className="text-4xl sm:text-5xl animate-float">🎮</span>
              </div>
            </div>

            {/* Game-style badge */}
            <div className="inline-block mb-3 animate-slide-down">
              <div className="bg-white/70 backdrop-blur px-5 py-1.5 rounded-full text-xs font-bold text-[#FF85A8] shadow">
                Health Quiz Game • กรมอนามัย
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black mb-2 bg-gradient-to-r from-[#FF85A8] via-[#D8B4FE] to-[#7DD3FC] bg-clip-text text-transparent leading-tight">
              Teen Club Live
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-600 font-medium mb-6 px-4">
              แบบประเมินความรู้สุขภาพทางเพศวัยรุ่น
            </p>

            {/* Feature pills */}
            <div className="flex justify-center gap-2 mb-8">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/60 text-[#FF85A8] shadow-sm">
                💊 {questions.length} คำถาม
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/60 text-[#7DD3FC] shadow-sm">
                📚 3 หมวด
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/60 text-[#4ADE80] shadow-sm">
                🌟 ได้ความรู้
              </span>
            </div>

            {/* Start button */}
            <button
              onClick={() => setScreen('setup')}
              className="gradient-game text-white text-lg sm:text-xl font-bold w-full max-w-xs py-4 rounded-2xl shadow-xl btn-glow"
            >
              🚀 เริ่มเล่นเกม!
            </button>

            {/* Footer */}
            <p className="mt-6 text-xs text-gray-400">
              กรมอนามัย • กระทรวงสาธารณสุข
            </p>
          </div>
        </div>
      )}

      {/* PLAYER SETUP SCREEN */}
      {screen === 'setup' && (
        <div className="min-h-screen relative overflow-hidden">
          <FloatingBubbles />

          {/* Game-style top banner */}
          <div className="gradient-game py-5 px-6 relative z-10">
            <div className="max-w-sm mx-auto flex items-center gap-3">
              <button onClick={() => setScreen('splash')} className="text-white/70 hover:text-white text-xl leading-none">←</button>
              <div className="flex-1 text-center">
                <div className="text-white font-black text-lg sm:text-xl leading-tight">🎯 สร้างตัวละคร</div>
                <div className="text-white/75 text-xs mt-0.5">บอกเราหน่อยนะ ว่าน้องๆ เป็นใคร</div>
              </div>
              <div className="w-7" />
            </div>
          </div>

          {/* Step progress */}
          <div className="relative z-10 max-w-sm mx-auto px-4 pt-4 pb-2">
            <div className="flex gap-2 justify-center">
              {[1,2,3].map(step => (
                <div key={step} className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  (step === 1 && player.gender) || (step === 2 && player.ageGroup) || (step === 3 && player.education)
                    ? 'gradient-game' : 'bg-white/50'
                }`} />
              ))}
            </div>
          </div>

          <div className="relative z-10 max-w-sm mx-auto px-4 pt-3 pb-32">

            {/* Gender selection */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 gradient-game rounded-full flex items-center justify-center text-white font-black text-sm shadow">1</div>
                <p className="text-gray-800 font-black text-base">เพศของน้อง</p>
                {player.gender && <span className="ml-auto text-green-500 font-bold text-sm">✓</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'male', icon: '👦', label: 'ชาย', bg: 'bg-[#E0F4FF]', border: '#7DD3FC', text: 'text-[#0284C7]' },
                  { value: 'female', icon: '👧', label: 'หญิง', bg: 'bg-[#FFF0F3]', border: '#FF85A8', text: 'text-[#DB2777]' },
                  { value: 'lgbtq', icon: '🌈', label: 'LGBTQ+', bg: 'bg-[#F5F0FF]', border: '#D8B4FE', text: 'text-[#7C3AED]' },
                  { value: 'unspecified', icon: '🤫', label: 'ไม่ระบุ', bg: 'bg-[#F0FFF4]', border: '#86EFAC', text: 'text-[#16A34A]' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPlayer((prev) => ({ ...prev, gender: option.value as Gender }))}
                    className={`${option.bg} p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                      player.gender === option.value ? 'scale-105 shadow-lg' : 'border-transparent shadow-sm hover:scale-102'
                    }`}
                    style={{ borderColor: player.gender === option.value ? option.border : 'transparent' }}
                  >
                    <span className="text-3xl block mb-1.5">{option.icon}</span>
                    <span className={`font-black text-sm ${option.text}`}>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Age selection */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 gradient-game rounded-full flex items-center justify-center text-white font-black text-sm shadow">2</div>
                <p className="text-gray-800 font-black text-base">อายุของน้อง</p>
                {player.ageGroup && <span className="ml-auto text-green-500 font-bold text-sm">✓</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'under10', icon: '🌱', label: 'น้อยกว่า\n10 ปี', bg: 'bg-[#F0FFF4]', border: '#86EFAC', text: 'text-[#16A34A]' },
                  { value: '10-19', icon: '🔥', label: '10-19\nปี', bg: 'bg-[#FFF0F3]', border: '#FF85A8', text: 'text-[#DB2777]' },
                  { value: 'over20', icon: '🌟', label: '20 ปี\nขึ้นไป', bg: 'bg-[#F5F0FF]', border: '#D8B4FE', text: 'text-[#7C3AED]' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPlayer((prev) => ({ ...prev, ageGroup: option.value as AgeGroup }))}
                    className={`${option.bg} py-4 px-2 rounded-2xl border-2 transition-all active:scale-95 text-center ${
                      player.ageGroup === option.value ? 'scale-105 shadow-lg' : 'border-transparent shadow-sm'
                    }`}
                    style={{ borderColor: player.ageGroup === option.value ? option.border : 'transparent' }}
                  >
                    <span className="block text-2xl mb-1.5">{option.icon}</span>
                    <span className={`font-black text-xs leading-tight whitespace-pre-line ${option.text}`}>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 gradient-game rounded-full flex items-center justify-center text-white font-black text-sm shadow">3</div>
                <p className="text-gray-800 font-black text-base">ระดับการศึกษา</p>
                {player.education && <span className="ml-auto text-green-500 font-bold text-sm">✓</span>}
              </div>
              <div className="relative">
                <select
                  value={player.education}
                  onChange={(e) => setPlayer((prev) => ({ ...prev, education: e.target.value }))}
                  className="w-full bg-white/80 backdrop-blur border-2 border-[#D8B4FE]/40 p-4 rounded-2xl focus:ring-0 focus:border-[#D8B4FE] focus:outline-none appearance-none cursor-pointer text-gray-700 font-bold text-sm shadow-sm"
                >
                  <option value="">🎓 เลือกระดับการศึกษา...</option>
                  {educationLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D8B4FE] font-bold">▼</span>
              </div>
            </div>
          </div>

          {/* Fixed bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-white/50 z-30">
            <div className="max-w-sm mx-auto">
              <button
                onClick={() => setScreen('quiz')}
                disabled={!player.gender || !player.ageGroup || !player.education}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                  player.gender && player.ageGroup && player.education
                    ? 'gradient-game text-white shadow-xl btn-glow'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {player.gender && player.ageGroup && player.education ? '🚀 เริ่มเล่นเลย!' : '⬆️ กรอกข้อมูลให้ครบก่อนนะ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ GAMEPLAY SCREEN */}
      {screen === 'quiz' && (
        <div className="min-h-screen flex flex-col">
          {/* Top HUD */}
          <div className="glass border-b p-3 sticky top-0 z-30">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-1 font-bold text-base sm:text-lg">
                <span>🪙</span>
                <span className="relative">
                  {game.score.toLocaleString()}
                  <ScorePopup points={lastPoints} show={showScorePopup} />
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm text-gray-600">
                  ข้อ {game.currentQuestion + 1}/{questions.length}
                </span>
                <div className="w-20 sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-game transition-all duration-500"
                    style={{
                      width: `${((game.currentQuestion + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-base sm:text-lg">
                <span className={game.streak >= 2 ? 'animate-fire' : ''}>🔥</span>
                <span>{game.streak}</span>
              </div>
            </div>
          </div>

          {/* Category banner */}
          <div
            className="py-2 px-4 text-white text-center text-xs sm:text-sm font-medium"
            style={{
              backgroundColor: categoryInfo[questions[game.currentQuestion].category].color,
            }}
          >
            {categoryInfo[questions[game.currentQuestion].category].icon} หมวด{' '}
            {questions[game.currentQuestion].category}:{' '}
            {categoryInfo[questions[game.currentQuestion].category].name}
          </div>

          {/* Question card */}
          <div className="flex-1 p-4">
            <div className="max-w-md mx-auto">
              <div
                className={`game-card rounded-3xl p-5 sm:p-6 mb-4 sm:mb-6 transition-all ${
                  game.isCorrect === true
                    ? 'ring-4 ring-[#4ADE80] bg-[#86EFAC]/20'
                    : game.isCorrect === false
                      ? 'ring-4 ring-[#FB7185] animate-shake bg-[#FB7185]/10'
                      : ''
                }`}
              >
                {/* Section info */}
                <p className="text-xs text-gray-500 mb-2">
                  ส่วนที่ {questions[game.currentQuestion].section} •{' '}
                  {questions[game.currentQuestion].sectionTitle}
                </p>

                {/* Question number badge */}
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <span className="w-9 h-9 sm:w-10 sm:h-10 gradient-game rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    Q{game.currentQuestion + 1}
                  </span>
                </div>

                {/* Question text */}
                <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-relaxed">
                  {questions[game.currentQuestion].question}
                </h3>
              </div>

              {/* Answer choices */}
              <div className="space-y-3">
                {questions[game.currentQuestion].choices.map((choice, i) => {
                  const letters = ['ก', 'ข', 'ค', 'ง'];
                  const isSelected = game.selectedAnswer === i;
                  const isCorrectAnswer = i === questions[game.currentQuestion].correctIndex;
                  const showResult = game.selectedAnswer !== null;

                  let buttonClass =
                    'game-card border-2 border-transparent hover:border-[#D8B4FE] hover:shadow-lg';
                  if (showResult) {
                    if (isCorrectAnswer) {
                      buttonClass = 'bg-[#86EFAC]/30 border-2 border-[#4ADE80] shadow-lg';
                    } else if (isSelected && !isCorrectAnswer) {
                      buttonClass = 'bg-[#FB7185]/20 border-2 border-[#FB7185] animate-shake';
                    } else {
                      buttonClass = 'game-card border-2 border-transparent opacity-40';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={game.selectedAnswer !== null}
                      className={`w-full p-3 sm:p-4 rounded-2xl text-left flex items-center gap-3 transition-all min-h-[56px] ${buttonClass} ${
                        !showResult ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
                      } ${isSelected && isCorrectAnswer ? 'animate-pop' : ''}`}
                    >
                      <span
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 ${
                          showResult && isCorrectAnswer
                            ? 'bg-[#4ADE80] text-white'
                            : showResult && isSelected && !isCorrectAnswer
                              ? 'bg-[#FB7185] text-white'
                              : 'bg-[#F5F3FF]'
                        }`}
                      >
                        {showResult && isCorrectAnswer
                          ? '✓'
                          : showResult && isSelected && !isCorrectAnswer
                            ? '✗'
                            : letters[i]}
                      </span>
                      <span className="font-medium text-sm sm:text-base">{choice}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Knowledge Card Modal */}
          {game.showingKnowledge && (
            <div className="fixed inset-0 bg-black/75 z-40 flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
              <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl animate-slide-up flex flex-col bg-white" style={{ maxHeight: '92dvh' }}>

                {/* Drag handle */}
                <div className="shrink-0 flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Result feedback card */}
                <div className="shrink-0 px-4 pb-3">
                  <div className={`rounded-2xl px-4 py-3 flex items-start gap-3 ${game.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <span className="text-2xl leading-none mt-0.5">{game.isCorrect ? '🌟' : '💡'}</span>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${game.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                        {game.isCorrect ? 'ถูกต้อง! เก่งมากเลย 🎉' : 'คำตอบที่ถูกต้องคือ'}
                      </p>
                      {!game.isCorrect && (
                        <p className="text-gray-700 text-sm mt-0.5 leading-snug">
                          {questions[game.currentQuestion].choices[questions[game.currentQuestion].correctIndex]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category + label row */}
                <div className="shrink-0 px-4 pb-2 flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
                    style={{ backgroundColor: categoryInfo[questions[game.currentQuestion].category].color }}
                  >
                    {categoryInfo[questions[game.currentQuestion].category].icon} หมวด {questions[game.currentQuestion].category}
                  </span>
                  <span className="text-xs text-gray-400 truncate">📚 {questions[game.currentQuestion].sectionTitle}</span>
                  <span className="text-xs text-gray-300 shrink-0 ml-auto">{game.currentQuestion + 1}/{questions.length}</span>
                </div>

                {/* PDF in rounded card */}
                <div className="flex-1 min-h-0 mx-4 rounded-2xl overflow-hidden shadow-md border border-gray-100" style={{ minHeight: '48dvh' }}>
                  <KnowledgePdf pdfId={questions[game.currentQuestion].knowledgeCard.pdfId} />
                </div>

                {/* Next button */}
                <div className="shrink-0 p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                  <button
                    onClick={nextQuestion}
                    className="w-full gradient-game text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-transform"
                  >
                    {game.currentQuestion >= questions.length - 1 ? '🏆 ดูผลคะแนน' : 'เข้าใจแล้ว ข้อถัดไป ▶️'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULTS SCREEN */}
      {screen === 'results' && (
        <div className="min-h-screen p-4 sm:p-6 pb-8 relative overflow-hidden">
          <FloatingBubbles />
          <div className="max-w-md mx-auto text-center relative z-10">
            {/* Trophy */}
            <div className="text-7xl sm:text-8xl mb-4 animate-bounce-in">{getTrophy().emoji}</div>
            <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${getTrophy().color}`}>
              {getTrophy().text}
            </h2>

            {/* Score display */}
            <div className="game-card rounded-3xl p-5 sm:p-6 mb-6">
              <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#FF85A8] via-[#D8B4FE] to-[#7DD3FC] bg-clip-text text-transparent mb-2">
                {animatedScore.toLocaleString()}
              </div>
              <p className="text-gray-500">แต้ม</p>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#4ADE80]">
                    {correctAnswers}
                  </div>
                  <p className="text-xs text-gray-500">ตอบถูก</p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#FB7185]">
                    {questions.length - correctAnswers}
                  </div>
                  <p className="text-xs text-gray-500">ตอบผิด</p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#FDBA74]">
                    {game.maxStreak}
                  </div>
                  <p className="text-xs text-gray-500">Combo สูงสุด</p>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="game-card rounded-2xl p-4 mb-6">
              <h3 className="font-bold mb-4 text-left text-sm sm:text-base">สรุปตามหมวด</h3>
              {([1, 2, 3] as const).map((cat) => {
                const stats = getCategoryStats(cat);
                const catPercent = Math.round((stats.correct / stats.total) * 100) || 0;
                return (
                  <div key={cat} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>
                        {categoryInfo[cat].icon} หมวด {cat}
                      </span>
                      <span className="font-medium">
                        {stats.correct}/{stats.total} ({catPercent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${catPercent}%`,
                          backgroundColor: categoryInfo[cat].color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setScreen('survey')}
              className="w-full gradient-game text-white py-4 rounded-full font-bold text-base sm:text-lg shadow-xl btn-glow"
            >
              ทำแบบประเมินต่อ
            </button>
          </div>
        </div>
      )}

      {/* SATISFACTION SURVEY SCREEN */}
      {screen === 'survey' && (
        <div className="min-h-screen p-4 sm:p-6 pb-28 relative overflow-hidden">
          <FloatingBubbles />
          <div className="max-w-md mx-auto relative z-10">
            <h2 className="text-xl sm:text-2xl font-black text-center mb-2 bg-gradient-to-r from-[#FF85A8] via-[#D8B4FE] to-[#7DD3FC] bg-clip-text text-transparent">
              ให้คะแนนเกมของเรา!
            </h2>
            <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
              แตะหน้าที่ตรงกับความรู้สึกของน้องๆ
            </p>

            {/* Progress */}
            <div className="game-card rounded-xl p-3 mb-6 text-center">
              <span className="text-xs sm:text-sm text-gray-600">
                ตอบแล้ว {completedRatings}/{allSurveyRatings} ข้อ
              </span>
              <div className="flex justify-center gap-0.5 sm:gap-1 mt-2 flex-wrap">
                {Array.from({ length: allSurveyRatings }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                      i < completedRatings ? 'bg-[#D8B4FE]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content section */}
            <div className="mb-8">
              <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#FF85A8]/20 flex items-center justify-center text-sm">1</span>
                ด้านเนื้อหา
              </h3>
              {satisfactionQuestions.content.map((q, i) => {
                const key = `content-${i}`;
                const selectedValue = survey.ratings[key];
                return (
                  <div key={key} className="game-card rounded-2xl p-4 mb-3">
                    <p className="text-xs sm:text-sm text-gray-700 mb-3">{q}</p>
                    <div className="flex justify-between">
                      {([1, 2, 3, 4, 5] as const).map((level) => (
                        <RatingFace
                          key={level}
                          level={level}
                          selected={selectedValue === level}
                          onClick={() =>
                            setSurvey((prev) => ({
                              ...prev,
                              ratings: { ...prev.ratings, [key]: level },
                            }))
                          }
                          disabled={selectedValue !== undefined && selectedValue !== level}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Design section */}
            <div className="mb-8">
              <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#7DD3FC]/20 flex items-center justify-center text-sm">2</span>
                ด้านการออกแบบ
              </h3>
              {satisfactionQuestions.design.map((q, i) => {
                const key = `design-${i}`;
                const selectedValue = survey.ratings[key];
                return (
                  <div key={key} className="game-card rounded-2xl p-4 mb-3">
                    <p className="text-xs sm:text-sm text-gray-700 mb-3">{q}</p>
                    <div className="flex justify-between">
                      {([1, 2, 3, 4, 5] as const).map((level) => (
                        <RatingFace
                          key={level}
                          level={level}
                          selected={selectedValue === level}
                          onClick={() =>
                            setSurvey((prev) => ({
                              ...prev,
                              ratings: { ...prev.ratings, [key]: level },
                            }))
                          }
                          disabled={selectedValue !== undefined && selectedValue !== level}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Usefulness section */}
            <div className="mb-8">
              <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#86EFAC]/20 flex items-center justify-center text-sm">3</span>
                ด้านประโยชน์
              </h3>
              {satisfactionQuestions.usefulness.map((q, i) => {
                const key = `usefulness-${i}`;
                const selectedValue = survey.ratings[key];
                return (
                  <div key={key} className="game-card rounded-2xl p-4 mb-3">
                    <p className="text-xs sm:text-sm text-gray-700 mb-3">{q}</p>
                    <div className="flex justify-between">
                      {([1, 2, 3, 4, 5] as const).map((level) => (
                        <RatingFace
                          key={level}
                          level={level}
                          selected={selectedValue === level}
                          onClick={() =>
                            setSurvey((prev) => ({
                              ...prev,
                              ratings: { ...prev.ratings, [key]: level },
                            }))
                          }
                          disabled={selectedValue !== undefined && selectedValue !== level}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feedback textarea */}
            <div className="game-card rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-sm mb-2 text-gray-700">ข้อเสนอแนะเพิ่มเติม (ถ้ามี)</h3>
              <div className="relative">
                <textarea
                  value={survey.feedback}
                  onChange={(e) => setSurvey((prev) => ({ ...prev, feedback: e.target.value }))}
                  placeholder="อยากบอกอะไรเพิ่มเติมไหม? พิมพ์ได้เลย!"
                  className="w-full h-24 p-3 bg-white/50 rounded-xl border-2 border-[#D8B4FE]/30 focus:border-[#D8B4FE] focus:outline-none resize-none text-sm sm:text-base"
                  maxLength={500}
                />
                <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {survey.feedback.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Fixed submit button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-[#D8B4FE]/20 z-30">
            <div className="max-w-md mx-auto">
              <button
                onClick={submitSurvey}
                disabled={!surveyComplete}
                className={`w-full py-4 rounded-full font-bold text-base sm:text-lg transition-all ${
                  surveyComplete
                    ? 'gradient-game text-white shadow-xl btn-glow'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {surveyComplete ? 'ส่งคำตอบ' : `ตอบอีก ${allSurveyRatings - completedRatings} ข้อ`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THANK YOU SCREEN */}
      {screen === 'thanks' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <FloatingBubbles />
          <div className="text-center max-w-md relative z-10">
            <div className="text-7xl sm:text-8xl mb-6 animate-bounce-in">🎊</div>

            <h2 className="text-2xl sm:text-3xl font-black mb-4 bg-gradient-to-r from-[#FF85A8] via-[#D8B4FE] to-[#7DD3FC] bg-clip-text text-transparent">
              ขอบคุณมากๆ!
            </h2>

            <div className="game-card rounded-2xl p-5 mb-6">
              <p className="text-gray-600 mb-2 text-sm sm:text-base">ขอบคุณที่ร่วมเล่นเกมกับเรา</p>
              <p className="text-gray-600 text-sm sm:text-base">
                ความรู้ที่ได้วันนี้จะช่วยปกป้องตัวเองและคนที่รักได้นะ
              </p>
            </div>

            <button
              onClick={resetGame}
              className="gradient-game text-white px-8 py-4 rounded-full font-bold text-base sm:text-lg shadow-xl btn-glow"
            >
              เล่นอีกครั้ง
            </button>

            <p className="mt-8 text-xs text-gray-400">
              Teen Club Live Dashboard | กรมอนามัย กระทรวงสาธารณสุข
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
