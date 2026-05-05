"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, PlusCircle, Users, BarChart3, MessageSquare, LogOut, 
  Trash2, Plus, ArrowRight, Save, ShieldAlert, Award, FileText,
  GraduationCap, CheckCircle, ChevronDown, HelpCircle, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ──────── Custom Select Component ──────── */
function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm flex items-center justify-between focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-left text-white cursor-pointer"
      >
        <span>{selectedOption ? selectedOption.label : 'Select Option'}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-[#0a0f1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors cursor-pointer ${value === opt.value ? 'text-accent-teal-light bg-accent-teal/10 font-bold' : 'text-text-muted'}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'addquiz' | 'students' | 'rankings' | 'feedbacks'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
  
  // Quiz Wizard State
  const [quizDetails, setQuizDetails] = useState({
    title: '',
    tag: 'general',
    time: '5',
    sahi: '2',
    wrong: '1',
    desc: ''
  });
  const [wizardStep, setWizardStep] = useState(1); // 1: Info, 2: Questions
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState({
    qns: '',
    a: '',
    b: '',
    c: '',
    d: '',
    correct: 'A'
  });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/teacher/dashboard');
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

  const deleteItem = async (type, id) => {
    const confirmed = await showConfirm(`Are you sure you want to delete this ${type}?`, 'Confirm Delete');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/teacher/dashboard?type=${type}&id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Failed to delete ${type}`);
      fetchDashboardData();
      showAlert(`${type.toUpperCase()} deleted successfully.`, 'Success');
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const addQuestionToQuiz = () => {
    if (!currentQ.qns || !currentQ.a || !currentQ.b || !currentQ.c || !currentQ.d) {
      showAlert('Please fill out the question prompt and all four options.', 'Incomplete Form');
      return;
    }
    setQuestions([...questions, currentQ]);
    setCurrentQ({ qns: '', a: '', b: '', c: '', d: '', correct: 'A' });
  };

  const saveQuiz = async () => {
    if (questions.length === 0) {
      showAlert('Please add at least one question to the exam list.', 'No Questions');
      return;
    }
    setLoading(true);
    
    try {
      const res = await fetch('/api/teacher/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quizDetails,
          questions
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save quiz');
      
      await showAlert('Quiz created and published successfully!', 'Quiz Created');
      setQuestions([]);
      setQuizDetails({ title: '', tag: 'general', time: '5', sahi: '2', wrong: '1', desc: '' });
      setWizardStep(1);
      setActiveTab('quizzes');
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-accent-teal rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider text-text-muted">Loading Teacher Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative flex bg-background z-10">
      {/* Sidebar Nav */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-md p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5 text-lg font-heading font-black tracking-wider text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center">
              <GraduationCap className="text-white w-4 h-4" />
            </div>
            <span>Teacher Panel</span>
          </div>

          <div className="space-y-1.5">
            {[
              { id: 'quizzes', label: 'Quizzes / Exams', icon: BookOpen },
              { id: 'addquiz', label: 'Add New Quiz', icon: PlusCircle },
              { id: 'students', label: 'Students List', icon: Users },
              { id: 'rankings', label: 'Student Rankings', icon: BarChart3 },
              { id: 'feedbacks', label: 'User Feedbacks', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        {/* Mobile Navbar */}
        <div className="flex md:hidden justify-between items-center mb-8 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-lg font-heading font-black tracking-wider text-white">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center">
              <GraduationCap className="text-white w-3.5 h-3.5" />
            </div>
            <span>Teacher Panel</span>
          </div>
          <button onClick={handleLogout} className="text-rose-500 p-2"><LogOut className="w-5 h-5" /></button>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden gap-1 bg-white/5 p-1 rounded-full text-[10px] mb-8 overflow-x-auto">
          {[
            { id: 'quizzes', label: 'Quizzes' },
            { id: 'addquiz', label: 'Add' },
            { id: 'students', label: 'Students' },
            { id: 'rankings', label: 'Ranks' },
            { id: 'feedbacks', label: 'Feedbacks' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-full font-bold transition-all uppercase tracking-wider cursor-pointer ${activeTab === t.id ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/20' : 'text-text-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'quizzes' && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Manage Examinations</h1>
                <p className="text-text-muted text-sm">View, track, or delete active examinations across the platform.</p>
              </div>

              {data?.quizzes?.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No quizzes created yet. Get started by clicking "Add New Quiz".
                </div>
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4">Exam Title</th>
                          <th className="p-4">Tag</th>
                          <th className="p-4">Questions</th>
                          <th className="p-4">Time Limit</th>
                          <th className="p-4">Correct / Wrong Marks</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {data?.quizzes?.map((quiz) => (
                          <tr key={quiz.eid} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-bold">{quiz.title}</td>
                            <td className="p-4">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal font-bold uppercase tracking-wider">{quiz.tag}</span>
                            </td>
                            <td className="p-4 font-semibold">{quiz.total}</td>
                            <td className="p-4">{quiz.time} Mins</td>
                            <td className="p-4 font-medium">
                              <span className="text-emerald-400">+{quiz.sahi}</span> / <span className="text-rose-500">-{quiz.wrong}</span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => deleteItem('quiz', quiz.eid)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {activeTab === 'addquiz' && (
            <motion.div
              key="addquiz"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 max-w-2xl"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Create New Examination</h1>
                <p className="text-text-muted text-sm">Step {wizardStep} of 2: {wizardStep === 1 ? 'Enter Exam Details' : 'Add Quiz Questions'}</p>
              </div>

              {wizardStep === 1 ? (
                <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6 shadow-xl">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Exam Title</label>
                    <input
                      type="text"
                      required
                      value={quizDetails.title}
                      onChange={(e) => setQuizDetails({...quizDetails, title: e.target.value})}
                      placeholder="e.g. Linux Administration, C++ Basics"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Tag / Category</label>
                      <input
                        type="text"
                        required
                        value={quizDetails.tag}
                        onChange={(e) => setQuizDetails({...quizDetails, tag: e.target.value})}
                        placeholder="e.g. linux, cpp, networking"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Time Limit (Minutes)</label>
                      <input
                        type="number"
                        required
                        value={quizDetails.time}
                        onChange={(e) => setQuizDetails({...quizDetails, time: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Correct Answer Weight</label>
                      <input
                        type="number"
                        required
                        value={quizDetails.sahi}
                        onChange={(e) => setQuizDetails({...quizDetails, sahi: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Negative Marks</label>
                      <input
                        type="number"
                        required
                        value={quizDetails.wrong}
                        onChange={(e) => setQuizDetails({...quizDetails, wrong: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Description (Optional)</label>
                    <textarea
                      rows={3}
                      value={quizDetails.desc}
                      onChange={(e) => setQuizDetails({...quizDetails, desc: e.target.value})}
                      placeholder="Add brief info about this exam"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle resize-none"
                    ></textarea>
                  </div>

                  <button
                    onClick={() => {
                      if (!quizDetails.title) { showAlert('Please enter a quiz title.', 'Incomplete Form'); return; }
                      setWizardStep(2);
                    }}
                    className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
                  >
                    Configure Questions
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dynamic Question Creator */}
                  <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6 shadow-xl">
                    <h3 className="text-lg font-bold text-accent-teal border-b border-white/5 pb-2">Add Question #{questions.length + 1}</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Question Prompt</label>
                      <textarea
                        rows={3}
                        value={currentQ.qns}
                        onChange={(e) => setCurrentQ({...currentQ, qns: e.target.value})}
                        placeholder="Write the question prompt here..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle resize-none"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['a', 'b', 'c', 'd'].map((option) => (
                        <div key={option} className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-text-muted">Option {option.toUpperCase()}</label>
                          <input
                            type="text"
                            value={currentQ[option]}
                            onChange={(e) => setCurrentQ({...currentQ, [option]: e.target.value})}
                            placeholder={`Enter Option ${option.toUpperCase()}`}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Correct Option</label>
                      <CustomSelect
                        value={currentQ.correct}
                        onChange={(val) => setCurrentQ({...currentQ, correct: val})}
                        options={[
                          { value: 'A', label: 'Option A' },
                          { value: 'B', label: 'Option B' },
                          { value: 'C', label: 'Option C' },
                          { value: 'D', label: 'Option D' }
                        ]}
                      />
                    </div>

                    <button
                      onClick={addQuestionToQuiz}
                      className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question to List
                    </button>
                  </div>

                  {/* Added Questions List Panel */}
                  <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-lg font-bold">Added Questions ({questions.length})</h3>
                      {questions.length > 0 && (
                        <button
                          onClick={saveQuiz}
                          className="bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          Publish Quiz
                        </button>
                      )}
                    </div>
                    {questions.length === 0 ? (
                      <p className="text-text-muted text-xs italic">No questions added yet.</p>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-60 overflow-y-auto pr-2 space-y-3">
                        {questions.map((q, idx) => (
                          <div key={idx} className="pt-3 flex justify-between items-start gap-4">
                            <div>
                              <p className="text-sm font-bold text-white flex gap-1"><span className="text-accent-teal-light">#{idx+1}</span> {q.qns}</p>
                              <p className="text-[10px] text-text-muted mt-1">Correct Answer: Option {q.correct}</p>
                            </div>
                            <button
                              onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                              className="text-rose-500 p-1 hover:bg-rose-500/10 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Registered Students</h1>
                <p className="text-text-muted text-sm">View details of students registered on the platform or revoke access.</p>
              </div>

              {data?.students?.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No students registered yet.
                </div>
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4">Student Name</th>
                          <th className="p-4">Gender</th>
                          <th className="p-4">College</th>
                          <th className="p-4">Email ID</th>
                          <th className="p-4">Mobile Number</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {data?.students?.map((std) => (
                          <tr key={std.email} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-bold">{std.name}</td>
                            <td className="p-4">{std.gender === 'M' ? 'Male' : 'Female'}</td>
                            <td className="p-4 text-text-muted">{std.college}</td>
                            <td className="p-4">{std.email}</td>
                            <td className="p-4">{std.mob}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => deleteItem('student', std.email)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {activeTab === 'rankings' && (
            <motion.div
              key="rankings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Student Performance Rankings</h1>
                <p className="text-text-muted text-sm">Review collective score metrics of all students sorted by grade points.</p>
              </div>

              {data?.rankings?.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No records found.
                </div>
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4 w-20">Rank</th>
                          <th className="p-4">Student Name</th>
                          <th className="p-4">College</th>
                          <th className="p-4">Total Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {data?.rankings?.map((rank, index) => (
                          <tr key={index} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-black text-center text-lg">{index + 1}</td>
                            <td className="p-4 font-bold">{rank.name}</td>
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

          {activeTab === 'feedbacks' && (
            <motion.div
              key="feedbacks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">User Feedback Submissions</h1>
                <p className="text-text-muted text-sm">Read questions, queries, and bugs submitted by students.</p>
              </div>

              {data?.feedbacks?.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No feedback reports submitted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data?.feedbacks?.map((fb) => (
                    <motion.div
                      key={fb.id}
                      whileHover={{ y: -3 }}
                      className="bg-zinc-950 border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs text-text-muted font-semibold">{fb.name} ({fb.email})</p>
                            <p className="text-xs text-text-muted text-[10px]">{fb.date} {fb.time}</p>
                          </div>
                          <button
                            onClick={() => deleteItem('feedback', fb.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="text-base font-bold text-accent-teal-light mb-2">{fb.subject}</h4>
                        <p className="text-sm text-white/90 leading-relaxed bg-white/2 p-3 rounded-xl border border-white/5">{fb.feedback}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
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
