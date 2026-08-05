"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, History, BarChart3, MessageSquare, LogOut, 
  Play, CheckCircle2, XCircle, Award, Clock, HelpCircle, GraduationCap,
  Mail, Send, Sparkles, Lock, Eye, EyeOff, CheckCircle
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

  // Leaderboard Filter States
  const [leaderboardView, setLeaderboardView] = useState('global'); // 'global' | 'quiz' | 'subject' | 'section' | 'unit'
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizLeaderboard, setQuizLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [subFilterSubject, setSubFilterSubject] = useState('');
  const [subFilterTeacher, setSubFilterTeacher] = useState('');
  const [subFilterQuiz, setSubFilterQuiz] = useState('');

  // Dynamic ranking states
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [dynamicLeaderboard, setDynamicLeaderboard] = useState([]);
  const [myDynamicRank, setMyDynamicRank] = useState(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [dynamicError, setDynamicError] = useState('');

  const fetchQuizLeaderboard = async (eid) => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/leaderboard/dynamic?level=exam&eid=${eid}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load leaderboard');
      setQuizLeaderboard(json.leaderboard || []);
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchDynamicLeaderboard = async (viewType, filterVal = '') => {
    if (!data?.enrollment) return;
    setLoadingDynamic(true);
    setDynamicError('');
    setDynamicLeaderboard([]);
    setMyDynamicRank(null);
    
    try {
      let url = `/api/leaderboard/dynamic?level=${viewType}&academicYearId=${data.enrollment.academic_year_id}`;
      if (viewType === 'subject') {
        if (!filterVal) {
          setLoadingDynamic(false);
          return;
        }
        url += `&subjectId=${filterVal}&academicUnitId=${data.enrollment.academic_unit_id}`;
      } else if (viewType === 'section') {
        if (!data.enrollment.section_id) {
          throw new Error("You are not assigned to a section to view section rankings.");
        }
        url += `&sectionId=${data.enrollment.section_id}`;
      } else if (viewType === 'unit') {
        url += `&academicUnitId=${data.enrollment.academic_unit_id}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load rankings');
      
      setDynamicLeaderboard(json.leaderboard || []);
      setMyDynamicRank(json.myRank || null);
    } catch (err) {
      setDynamicError(err.message);
    } finally {
      setLoadingDynamic(false);
    }
  };

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

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const eid = params.get('eid');
      if (tab === 'leaderboard') {
        setActiveTab('leaderboard');
        if (eid) {
          setLeaderboardView('quiz');
          setSelectedQuizId(eid);
          fetchQuizLeaderboard(eid);
        }
      }
    }
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

  // Leaderboard filters computation
  const uniqueSubjects = data?.quizzes ? Array.from(new Set(data.quizzes.map(q => q.tag).filter(Boolean))) : [];
  
  const filteredTeachers = data?.quizzes && subFilterSubject 
    ? Array.from(new Set(data.quizzes.filter(q => q.tag === subFilterSubject).map(q => q.email).filter(Boolean)))
    : [];

  const filteredQuizzes = data?.quizzes && subFilterSubject && subFilterTeacher
    ? data.quizzes.filter(q => q.tag === subFilterSubject && q.email === subFilterTeacher)
    : [];

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
              { id: 'feedback', label: 'Send Feedback', icon: MessageSquare },
              { id: 'change-password', label: 'Change Password', icon: Lock }
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
            {data?.activeEnrollment && (
              <div className="mt-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[9px] uppercase tracking-wider text-text-muted font-bold mb-1">Active Enrollment</p>
                <p className="text-[11px] text-white font-semibold leading-tight">{data.activeEnrollment.year_name}</p>
                <p className="text-[11px] text-accent-teal font-semibold leading-tight mt-0.5">
                  {data.activeEnrollment.unit_name} {data.activeEnrollment.section_name ? `(${data.activeEnrollment.section_name})` : ''}
                </p>
              </div>
            )}
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
        <div className="flex md:hidden gap-1 bg-white/5 p-1 rounded-full text-xs mb-8 overflow-x-auto">
          {[
            { id: 'exams', label: 'Exams' },
            { id: 'history', label: 'History' },
            { id: 'leaderboard', label: 'Rankings' },
            { id: 'feedback', label: 'Feedback' },
            { id: 'change-password', label: 'Password' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 px-4 rounded-full font-bold transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap ${activeTab === t.id ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/20' : 'text-text-muted'}`}
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
                        <h3 className="text-xl font-heading font-bold mb-1 truncate">{quiz.title}</h3>
                        <p className="text-[10px] uppercase font-bold text-accent-teal tracking-wider mb-3 truncate">
                          {quiz.subject_name} • {quiz.unit_name} {quiz.section_name ? `(${quiz.section_name})` : ''}
                        </p>
                        
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
              {/* Leaderboard View Toggler */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h1 className="text-3xl font-heading font-black">Performance Standings</h1>
                  <p className="text-text-muted text-sm mt-1">Check how you stack up against top students.</p>
                </div>
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => {
                      setLeaderboardView('global');
                      setSelectedQuizId(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      leaderboardView === 'global'
                        ? 'bg-accent-teal text-white shadow-md'
                        : 'text-text-muted hover:text-white'
                    }`}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => {
                      setLeaderboardView('quiz');
                      setSelectedQuizId(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      leaderboardView === 'quiz'
                        ? 'bg-accent-teal text-white shadow-md'
                        : 'text-text-muted hover:text-white'
                    }`}
                  >
                    By Quiz
                  </button>
                  <button
                    onClick={() => {
                      setLeaderboardView('subject');
                      setSelectedSubjectId('');
                      setDynamicLeaderboard([]);
                      setMyDynamicRank(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      leaderboardView === 'subject'
                        ? 'bg-accent-teal text-white shadow-md'
                        : 'text-text-muted hover:text-white'
                    }`}
                  >
                    By Subject
                  </button>
                  {data?.enrollment?.section_name && (
                    <button
                      onClick={() => {
                        setLeaderboardView('section');
                        fetchDynamicLeaderboard('section');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        leaderboardView === 'section'
                          ? 'bg-accent-teal text-white shadow-md'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      By Section
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setLeaderboardView('unit');
                      fetchDynamicLeaderboard('unit');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      leaderboardView === 'unit'
                        ? 'bg-accent-teal text-white shadow-md'
                        : 'text-text-muted hover:text-white'
                    }`}
                  >
                    By Class
                  </button>
                </div>
              </div>

              {leaderboardView === 'global' && (
                /* Global Leaderboard */
                <>
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
                </>
              )}

              {leaderboardView === 'quiz' && (
                /* Quiz specific leaderboard */
                <div className="space-y-6">
                  {/* Select Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/3 border border-white/5 p-4 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Subject</label>
                      <select
                        value={subFilterSubject}
                        onChange={(e) => {
                          setSubFilterSubject(e.target.value);
                          setSubFilterTeacher('');
                          setSubFilterQuiz('');
                          setSelectedQuizId(null);
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white cursor-pointer"
                      >
                        <option value="">Select Subject</option>
                        {uniqueSubjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Teacher</label>
                      <select
                        value={subFilterTeacher}
                        disabled={!subFilterSubject}
                        onChange={(e) => {
                          setSubFilterTeacher(e.target.value);
                          setSubFilterQuiz('');
                          setSelectedQuizId(null);
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Select Teacher</option>
                        {filteredTeachers.map(tch => {
                          const name = tch.split('@')[0].replace(/^\w/, c => c.toUpperCase());
                          return <option key={tch} value={tch}>{name} ({tch})</option>;
                        })}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Quiz</label>
                      <select
                        value={subFilterQuiz}
                        disabled={!subFilterTeacher}
                        onChange={(e) => {
                          const qid = e.target.value;
                          setSubFilterQuiz(qid);
                          if (qid) {
                            setSelectedQuizId(qid);
                            fetchQuizLeaderboard(qid);
                          } else {
                            setSelectedQuizId(null);
                          }
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Select Quiz</option>
                        {filteredQuizzes.map(qz => (
                          <option key={qz.eid} value={qz.eid}>{qz.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedQuizId ? (
                    loadingLeaderboard ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 border-t-2 border-accent-teal rounded-full animate-spin"></div>
                        <p className="text-xs text-text-muted">Loading Leaderboard...</p>
                      </div>
                    ) : quizLeaderboard.length === 0 ? (
                      <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                        No student attempts registered for this exam yet.
                      </div>
                    ) : (
                      <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                                <th className="p-4 w-20 text-center">Rank</th>
                                <th className="p-4">Student</th>
                                <th className="p-4">College</th>
                                <th className="p-4 text-center">Score</th>
                                <th className="p-4">Attempt Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                              {quizLeaderboard.map((row) => (
                                <tr 
                                  key={row.email} 
                                  className={`transition-colors ${row.email === data.user.email ? 'bg-accent-teal/5 hover:bg-accent-teal/10' : 'hover:bg-white/2'}`}
                                >
                                  <td className="p-4 font-black text-center text-accent-teal text-base">#{row.rank}</td>
                                  <td className="p-4 font-bold flex items-center gap-2">
                                    <div>
                                      <div className="text-white">{row.name}</div>
                                      <div className="text-[10px] text-text-subtle">{row.email}</div>
                                    </div>
                                    {row.email === data.user.email && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-teal text-white font-black uppercase">You</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-text-muted">{row.college}</td>
                                  <td className="p-4 text-center text-accent-teal font-extrabold text-base">{row.score}</td>
                                  <td className="p-4 text-text-muted text-xs">{new Date(row.date).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                      Please select a Subject, Teacher, and Quiz from the dropdowns above.
                    </div>
                  )}
                </div>
              )}

              {['subject', 'section', 'unit'].includes(leaderboardView) && (
                <div className="space-y-6">
                  {/* Select Filter for Subject */}
                  {leaderboardView === 'subject' && (
                    <div className="bg-white/3 border border-white/5 p-4 rounded-2xl max-w-sm">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Select Subject</label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => {
                          setSelectedSubjectId(e.target.value);
                          fetchDynamicLeaderboard('subject', e.target.value);
                        }}
                        className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white cursor-pointer"
                      >
                        <option value="">Select Subject</option>
                        {Array.from(new Map(data?.quizzes?.map(q => [q.subject_id, { id: q.subject_id, name: q.subject_name }]) || []).values()).map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {loadingDynamic ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-t-2 border-accent-teal rounded-full animate-spin"></div>
                      <p className="text-xs text-text-muted">Calculating standings...</p>
                    </div>
                  ) : dynamicError ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-rose-400 text-xs font-semibold">
                      {dynamicError}
                    </div>
                  ) : leaderboardView === 'subject' && !selectedSubjectId ? (
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                      Please select a subject to load rankings.
                    </div>
                  ) : dynamicLeaderboard.length === 0 ? (
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                      No records found for this ranking level.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Student's Rank Callout Card */}
                      {myDynamicRank && (
                        <div className="bg-accent-teal/10 border border-accent-teal/20 rounded-3xl p-6 max-w-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Your Standings</span>
                            <h3 className="text-lg font-bold text-white mt-0.5">Rank #{myDynamicRank.rank}</h3>
                            <p className="text-[10px] text-text-muted mt-0.5">Weighted Score: {myDynamicRank.score.toFixed(1)}%</p>
                          </div>
                          <span className="text-3xl">🏅</span>
                        </div>
                      )}

                      <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                                <th className="p-4 w-20 text-center">Rank</th>
                                <th className="p-4">Student</th>
                                <th className="p-4 text-center">Score Percentage</th>
                                <th className="p-4 text-center">Exams Attempted</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                              {dynamicLeaderboard.map((row) => (
                                <tr 
                                  key={row.email} 
                                  className={`transition-colors ${row.email === data.user.email ? 'bg-accent-teal/5 hover:bg-accent-teal/10' : 'hover:bg-white/2'}`}
                                >
                                  <td className="p-4 font-black text-center text-accent-teal text-base">#{row.rank}</td>
                                  <td className="p-4 font-bold flex items-center gap-2">
                                    <div>
                                      <div className="text-white">{row.name}</div>
                                      <div className="text-[10px] text-text-subtle">{row.email}</div>
                                    </div>
                                    {row.email === data.user.email && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-teal text-white font-black uppercase">You</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-center font-black text-white">{row.score.toFixed(1)}%</td>
                                  <td className="p-4 text-center text-text-muted font-bold">{row.exams_attempted}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
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

          {activeTab === 'change-password' && (
            <motion.div
              key="change-password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black text-white">Change Password</h1>
                <p className="text-sm text-text-muted">Manage your secure student credentials.</p>
              </div>
              <StudentChangePasswordForm />
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

function StudentChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as your current password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
      <div className="space-y-4">
        {/* Current Password */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-muted uppercase font-bold">Current Password *</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white placeholder:text-text-subtle"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-muted uppercase font-bold">New Secure Password *</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white placeholder:text-text-subtle"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-muted uppercase font-bold">Confirm New Password *</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white placeholder:text-text-subtle"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-rose-400 text-xs font-semibold text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
          {error}
        </div>
      )}

      {success && (
        <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/20">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
      >
        {loading ? 'Updating Password...' : 'Change Password'}
      </button>
    </form>
  );
}
