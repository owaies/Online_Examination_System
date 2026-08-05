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

  const [attemptId, setAttemptId] = useState('');

  useEffect(() => {
    const startOrResumeQuiz = async () => {
      try {
        // 1. Initialize or resume attempt
        const initRes = await fetch('/api/student/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eid })
        });
        const initJson = await initRes.json();
        if (!initRes.ok) {
          throw new Error(initJson.error || 'Failed to start exam session');
        }

        const attempt = initJson.attempt;
        setAttemptId(attempt.id);
        setAnswers(attempt.answers || {});

        // 2. Fetch quiz details
        const res = await fetch(`/api/quiz/${eid}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/');
            return;
          }
          throw new Error('Failed to load quiz details');
        }
        const json = await res.json();
        setData(json);

        // 3. Compute remaining time securely
        const startMs = new Date(attempt.started_at).getTime();
        const nowMs = new Date().getTime();
        const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
        const allowedSeconds = json.quiz.time * 60;
        const remaining = Math.max(0, allowedSeconds - elapsedSeconds);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          handleAutoSubmit();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    startOrResumeQuiz();
  }, [eid]);

  useEffect(() => {
    if (loading || quizFinished || timeLeft <= 0 || !attemptId) return;
    
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
  }, [loading, quizFinished, timeLeft, attemptId]);

  const saveAnswersProgress = async (updatedAnswers) => {
    try {
      await fetch(`/api/student/attempts/${attemptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: updatedAnswers })
      });
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };

  const selectOption = (qid, optionid) => {
    if (quizFinished) return;
    const updatedAnswers = {
      ...answers,
      [qid]: optionid
    };
    setAnswers(updatedAnswers);
    saveAnswersProgress(updatedAnswers);
  };

  const submitQuiz = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const res = await fetch(`/api/student/attempts/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, autoSubmit: isAuto })
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
    submitQuiz(true);
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
      <div className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-8 my-8 relative z-10 w-full max-w-5xl mx-auto">
        {/* Left: Question Area */}
        <div className="flex-1 w-full max-w-3xl">
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
                  <p className="text-accent-teal-light font-semibold text-lg mt-2">{result?.title || data?.quiz?.title}</p>
                  <p className="text-text-muted text-xs mt-1 uppercase tracking-wider">Subject: {result?.tag || data?.quiz?.tag} | Teacher: {result?.teacherName || 'Instructor'}</p>
                </div>

                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 max-w-sm mx-auto flex flex-col items-center justify-center">
                  <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Your Rank</span>
                  <span className="text-3xl font-black text-accent-teal mt-1">#{result?.rank || 1}</span>
                  <span className="text-xs text-text-muted mt-1">out of {result?.totalStudents || 1} student{(result?.totalStudents || 1) > 1 ? 's' : ''}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                    <p className="text-[10px] text-text-muted font-bold uppercase">Correct</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{result?.sahi} / {result?.total}</p>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                    <p className="text-[10px] text-text-muted font-bold uppercase">Incorrect</p>
                    <p className="text-xl font-black text-rose-500 mt-1">{result?.wrong} / {result?.total}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] text-text-muted font-bold uppercase">Accuracy</p>
                    <p className="text-xl font-black text-white mt-1">
                      {result?.total > 0 ? Math.round((result?.sahi / result?.total) * 100) : 0}%
                    </p>
                  </div>
                  <div className="bg-accent-teal/5 border border-accent-teal/10 rounded-2xl p-4">
                    <p className="text-[10px] text-text-muted font-bold uppercase">Final Score</p>
                    <p className="text-xl font-black text-accent-teal mt-1">{result?.score}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => router.push(`/student?tab=leaderboard&eid=${eid}`)}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
                  >
                    View Leaderboard
                  </button>
                  <button
                    onClick={() => router.push('/student')}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-3 rounded-full transition-colors cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Question Navigator */}
        {!quizFinished && (
          <div className="w-full lg:w-64 bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-text-muted">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {data?.questions?.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = !!answers[q.qid];
                return (
                  <button
                    key={q.qid}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center border cursor-pointer ${
                      isCurrent
                        ? 'bg-accent-teal border-accent-teal text-white shadow-lg shadow-accent-teal/20'
                        : isAnswered
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-[10px] text-text-muted font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-accent-teal" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/20" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-white/5 border border-white/10" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        )}
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
                const totalQ = data?.questions?.length || 0;
                const answeredCount = Object.keys(answers).length;
                const unansweredCount = totalQ - answeredCount;
                
                let msg = "Are you sure you want to finish and submit your exam?";
                if (unansweredCount > 0) {
                  msg = `You still have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit anyway?`;
                }

                const confirmed = await showConfirm(msg, "Submit Exam");
                if (confirmed) submitQuiz(false);
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
