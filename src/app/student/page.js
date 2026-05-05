"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, History, BarChart3, MessageSquare, LogOut, 
  Play, CheckCircle2, XCircle, Award, Clock, HelpCircle, GraduationCap,
  Mail, Send, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'history' | 'leaderboard' | 'feedback'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Feedback form state
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackBody, setFeedbackBody] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/student/dashboard');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load dashboard');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackSuccess('');

    try {
      const res = await fetch('/api/student/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: feedbackSubject, feedback: feedbackBody })
      });
      if (!res.ok) throw new Error('Feedback submission failed');
      
      setFeedbackSuccess('Feedback submitted successfully! Thank you.');
      setFeedbackSubject('');
      setFeedbackBody('');
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-accent-teal rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider text-text-muted">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative flex bg-background z-10">
      {/* 1. Sidebar Nav */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-md p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5 text-lg font-heading font-black tracking-wider text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center">
              <GraduationCap className="text-white w-4 h-4" />
            </div>
            <span>e-Examiner</span>
          </div>

          <div className="space-y-1.5">
            {[
              { id: 'exams', label: 'Available Exams', icon: BookOpen },
              { id: 'history', label: 'My History', icon: History },
              { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
              { id: 'feedback', label: 'Send Feedback', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setFeedbackSuccess(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-accent-teal text-white font-bold shadow-[0_4px_20px_rgba(13,148,136,0.25)]' 
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="px-4">
            <p className="text-xs text-text-muted">Logged in as</p>
            <p className="text-sm font-bold truncate">{data?.user?.name}</p>
            <p className="text-xs text-text-muted truncate">{data?.user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Main Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        {/* Mobile Header */}
        <div className="flex md:hidden justify-between items-center mb-8 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-lg font-heading font-black tracking-wider text-white">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center">
              <GraduationCap className="text-white w-3.5 h-3.5" />
            </div>
            <span>e-Examiner</span>
          </div>
          <button onClick={handleLogout} className="text-rose-500 p-2"><LogOut className="w-5 h-5" /></button>
        </div>

        {/* Mobile Tab Selector */}
        <div className="flex md:hidden gap-1 bg-white/5 p-1 rounded-full text-xs mb-8">
          {[
            { id: 'exams', label: 'Exams' },
            { id: 'history', label: 'History' },
            { id: 'leaderboard', label: 'Rankings' },
            { id: 'feedback', label: 'Feedback' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 rounded-full font-bold transition-all uppercase tracking-wider cursor-pointer ${activeTab === t.id ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/20' : 'text-text-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'exams' && (
            <motion.div
              key="exams"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Available Examinations</h1>
                <p className="text-text-muted text-sm">Select an active exam below to start testing your skills.</p>
              </div>

              {data?.quizzes?.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No active exams available at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data?.quizzes?.map((quiz) => (
                    <motion.div
                      key={quiz.eid}
                      whileHover={{ y: -5 }}
                      className="bg-zinc-950 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-56 hover:border-accent-teal/30 hover:shadow-[0_0_30px_rgba(13,148,136,0.08)] transition-all duration-300"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal-light font-bold uppercase tracking-wider">
                            {quiz.tag || 'general'}
                          </span>
                          {quiz.attempted > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Attempted
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-heading font-bold mb-2 truncate">{quiz.title}</h3>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs text-text-muted mb-4">
                          <div className="flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-white/40" />
                            {quiz.total} Questions
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-white/40" />
                            {quiz.time} Minutes
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          const confirmed = await showConfirm(`Do you want to start the exam: ${quiz.title}?`, 'Confirm Exam Start');
                          if (confirmed) router.push(`/quiz/${quiz.eid}`);
                        }}
                        className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        {quiz.attempted > 0 ? 'Re-attempt Quiz' : 'Start Exam'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">My Test History</h1>
                <p className="text-text-muted text-sm">Review your past scores, correct answers, and performance dates.</p>
              </div>

              {data?.history?.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  You have not attempted any examinations yet.
                </div>
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4">Quiz Title</th>
                          <th className="p-4">Total Questions</th>
                          <th className="p-4">Correct</th>
                          <th className="p-4">Wrong</th>
                          <th className="p-4">Final Score</th>
                          <th className="p-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {data?.history?.map((hist, index) => (
                          <tr key={index} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-bold">{hist.title}</td>
                            <td className="p-4">{hist.total}</td>
                            <td className="p-4 text-emerald-400 font-semibold">+{hist.sahi}</td>
                            <td className="p-4 text-rose-500 font-semibold">-{hist.wrong}</td>
                            <td className="p-4 text-accent-teal font-extrabold text-base">{hist.score}</td>
                            <td className="p-4 text-text-muted text-xs">
                              {new Date(hist.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Global Leaderboard</h1>
                <p className="text-text-muted text-sm">Check how you stack up against top students globally.</p>
              </div>

              {data?.rankings?.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  Leaderboard is currently empty.
                </div>
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4 w-20">Rank</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">College</th>
                          <th className="p-4">Total Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {data?.rankings?.map((rank, index) => (
                          <tr 
                            key={index} 
                            className={`transition-colors ${rank.email === data.user.email ? 'bg-accent-teal/5 hover:bg-accent-teal/10' : 'hover:bg-white/2'}`}
                          >
                            <td className="p-4 font-black text-center text-lg">
                              {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </td>
                            <td className="p-4 font-bold flex items-center gap-2">
                              {rank.name}
                              {rank.email === data.user.email && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-teal text-white font-black uppercase">You</span>
                              )}
                            </td>
                            <td className="p-4 text-text-muted">{rank.college}</td>
                            <td className="p-4 text-accent-teal font-extrabold text-base">{rank.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 max-w-xl"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Send Feedback</h1>
                <p className="text-text-muted text-sm">We value your thoughts. Let us know if you find bugs or want improvements.</p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-6 bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-xl">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Subject</label>
                  <input
                    type="text"
                    required
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    placeholder="Brief summary of feedback"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Feedback Body</label>
                  <textarea
                    required
                    rows={6}
                    value={feedbackBody}
                    onChange={(e) => setFeedbackBody(e.target.value)}
                    placeholder="Enter detailed suggestions, bugs found, or queries..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle resize-none"
                  ></textarea>
                </div>

                {feedbackSuccess && <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2 rounded-lg flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{feedbackSuccess}</div>}

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent-teal/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
