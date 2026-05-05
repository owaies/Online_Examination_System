"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, AlertTriangle, CheckCircle2, XCircle, Award, 
  ArrowLeft, ArrowRight, HelpCircle, FileText, GraduationCap, Sparkles
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function QuizSession() {
  const router = useRouter();
  const { eid } = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { qid: selectedOptionId }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const timerRef = useRef(null);

  // Custom dialog state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  const showAlert = (message, title = 'Notification') => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  const showConfirm = (message, title = 'Confirmation') => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quiz/${eid}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/');
            return;
          }
          throw new Error('Failed to load quiz');
        }
        const json = await res.json();
        setData(json);
        setTimeLeft(json.quiz.time * 60); // minutes to seconds
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [eid]);

  useEffect(() => {
    if (loading || quizFinished || timeLeft <= 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, quizFinished, timeLeft]);

  const selectOption = (qid, optionid) => {
    if (quizFinished) return;
    setAnswers(prev => ({
      ...prev,
      [qid]: optionid
    }));
  };

  const submitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const res = await fetch(`/api/quiz/${eid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (!res.ok) throw new Error('Submission failed');
      const json = await res.json();
      setResult(json);
      setQuizFinished(true);
    } catch (err) {
      showAlert(err.message, 'Submission Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    await showAlert("Time's up! Your answers are being submitted automatically.", "Time Expired");
    submitQuiz();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-accent-teal rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider text-text-muted">Loading Exam Room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-background p-6">
        <AlertTriangle className="text-rose-500 w-16 h-16 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Quiz</h2>
        <p className="text-text-muted text-sm mb-6">{error}</p>
        <button onClick={() => router.push('/student')} className="bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white font-bold px-6 py-3 rounded-full transition-all shadow-lg shadow-accent-teal/20 cursor-pointer">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = data?.questions[currentIdx];
  const progressPercent = data?.questions.length ? ((currentIdx + 1) / data.questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-white flex flex-col justify-between p-6 md:p-12 relative z-10">
      {/* Top Status Bar */}
      <header className="flex justify-between items-center border-b border-white/5 pb-4 max-w-4xl w-full mx-auto relative z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-black">{data?.quiz?.title}</h1>
          <p className="text-xs text-text-muted">Question {currentIdx + 1} of {data?.questions?.length}</p>
        </div>
        
        {/* Countdown Timer */}
        {!quizFinished && (
          <div className={`flex items-center gap-2 border rounded-full px-4 py-2 text-sm font-bold ${timeLeft < 60 ? 'border-rose-500/30 text-rose-500 bg-rose-500/5 animate-pulse' : 'border-white/10 bg-white/5'}`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center my-8 relative z-10 w-full">
        <div className="max-w-3xl w-full">
          <AnimatePresence mode="wait">
            {!quizFinished ? (
              <motion.div
                key={currentQuestion?.qid}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-zinc-950 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
              >
                {/* Question */}
                <h2 className="text-xl md:text-2xl font-semibold mb-8 flex items-start gap-4">
                  <span className="text-accent-teal-light font-black">Q{currentIdx + 1}.</span>
                  {currentQuestion?.qns}
                </h2>

                {/* Options List */}
                <div className="space-y-4">
                  {currentQuestion?.options.map((opt) => {
                    const isSelected = answers[currentQuestion.qid] === opt.optionid;
                    return (
                      <button
                        key={opt.optionid}
                        onClick={() => selectOption(currentQuestion.qid, opt.optionid)}
                        className={`w-full text-left p-5 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'border-accent-teal bg-accent-teal/10 text-white font-bold' 
                            : 'border-white/5 bg-white/3 hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <span>{opt.option}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-accent-teal bg-accent-teal' : 'border-white/20'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* Score Card / Result screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-950 border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl space-y-8"
              >
                <div className="w-24 h-24 bg-accent-teal/10 rounded-full flex items-center justify-center mx-auto text-accent-teal border border-accent-teal/20 animate-bounce">
                  <Award className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-3xl font-heading font-black">Exam Completed!</h2>
                  <p className="text-text-muted text-sm mt-2">Your score has been graded and synced to Supabase rankings.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                    <CheckCircle2 className="text-emerald-400 w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs text-text-muted font-bold uppercase">Correct</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{result?.sahi}</p>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                    <XCircle className="text-rose-500 w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs text-text-muted font-bold uppercase">Wrong</p>
                    <p className="text-2xl font-black text-rose-500 mt-1">{result?.wrong}</p>
                  </div>
                  <div className="bg-accent-teal/5 border border-accent-teal/10 rounded-2xl p-4">
                    <FileText className="text-accent-teal w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs text-text-muted font-bold uppercase">Final Score</p>
                    <p className="text-2xl font-black text-accent-teal mt-1">{result?.score}</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/student')}
                  className="bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Control Bar */}
      {!quizFinished && (
        <footer className="border-t border-white/5 pt-6 max-w-4xl w-full mx-auto flex justify-between items-center relative z-10">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-text-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-8 bg-white/5 h-2 rounded-full overflow-hidden hidden sm:block">
            <div className="bg-accent-teal h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {currentIdx < (data?.questions?.length - 1) ? (
            <button
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="flex items-center gap-2 text-sm font-bold text-accent-teal hover:text-accent-teal-light transition-colors cursor-pointer"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={async () => {
                const confirmed = await showConfirm("Are you sure you want to finish and submit your exam?", "Submit Quiz");
                if (confirmed) submitQuiz();
              }}
              disabled={submitting}
              className="bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Finish & Submit'}
            </button>
          )}
        </footer>
      )}

      {/* Custom Dialog Modal */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0a0f1a] border border-white/10 rounded-3xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-accent-teal to-transparent" />
              
              <h3 className="text-lg font-heading font-black mb-2 flex items-center gap-2">
                {modalConfig.type === 'confirm' ? (
                  <HelpCircle className="w-5 h-5 text-accent-teal" />
                ) : (
                  <Sparkles className="w-5 h-5 text-accent-teal" />
                )}
                {modalConfig.title}
              </h3>
              
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                {modalConfig.message}
              </p>

              <div className="flex gap-3 justify-end">
                {modalConfig.type === 'confirm' && (
                  <button
                    onClick={modalConfig.onCancel}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={modalConfig.onConfirm}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
