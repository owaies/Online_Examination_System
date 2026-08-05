"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, PlusCircle, Users, BarChart3, MessageSquare, LogOut, 
  Trash2, Plus, ArrowRight, Save, ShieldAlert, Award, FileText,
  GraduationCap, CheckCircle, ChevronDown, HelpCircle, Sparkles,
  Edit, List, Lock, Eye, EyeOff, Database, Copy, Archive, FolderOpen, FileCheck, UploadCloud, Check
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
    desc: '',
    assignmentId: '',
    scheduledStart: '',
    scheduledEnd: '',
    maxAttempts: '1',
    shuffleQuestions: false,
    shuffleOptions: false,
    showResult: true,
    showCorrectAnswers: true,
    leaderboardEnabled: true,
    quizStatus: 'LIVE',
    passingPercentage: '40',
    selectionMode: 'SAME_SET_FOR_ALL',
    poolId: '',
    blueprintId: ''
  });
  const [wizardStep, setWizardStep] = useState(1); // 1: Info, 2: Questions
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState({
    qns: '',
    a: '',
    b: '',
    c: '',
    d: '',
    correct: 'A',
    marks: '1',
    difficulty: 'UNSPECIFIED',
    explanation: '',
    tags: '',
    sharing: 'PRIVATE'
  });

  // Question Bank States
  const [qbQuestions, setQbQuestions] = useState([]);
  const [qbTotal, setQbTotal] = useState(0);
  const [qbPage, setQbPage] = useState(1);
  const [qbFilters, setQbFilters] = useState({ search: '', subjectId: '', topicId: '', difficulty: 'ALL', status: 'ACTIVE', sort: 'newest' });
  const [qbSubjects, setQbSubjects] = useState([]);
  const [qbTopics, setQbTopics] = useState([]);

  // Modals / forms state
  const [showQbCreateModal, setShowQbCreateModal] = useState(false);
  const [qbForm, setQbForm] = useState({ qns: '', a: '', b: '', c: '', d: '', correct: 'A', marks: '1', difficulty: 'UNSPECIFIED', subjectId: '', topicId: '', explanation: '', tags: '', sharing: 'PRIVATE' });
  const [qbEditingId, setQbEditingId] = useState(null);

  // Bulk Import state
  const [showQbImportModal, setShowQbImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importFileRows, setImportFileRows] = useState([]);

  // Pools & Blueprints state
  const [poolsList, setPoolsList] = useState([]);
  const [showPoolCreateModal, setShowPoolCreateModal] = useState(false);
  const [poolForm, setPoolForm] = useState({ name: '', subjectId: '', qids: [] });

  const [blueprintsList, setBlueprintsList] = useState([]);
  const [showBpCreateModal, setShowBpCreateModal] = useState(false);
  const [bpForm, setBpForm] = useState({ name: '', subjectId: '', easy: '0', medium: '0', hard: '0' });

  // Drawer states
  const [showQbDrawer, setShowQbDrawer] = useState(false);

  // Question Ownership and Editing States
  const [selectedQuizForQuestions, setSelectedQuizForQuestions] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    qns: '', a: '', b: '', c: '', d: '', correct: 'A'
  });

  // Leaderboard States
  const [selectedQuizForLeaderboard, setSelectedQuizForLeaderboard] = useState(null);
  const [quizLeaderboard, setQuizLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchQuizLeaderboard = async (eid) => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/leaderboard?eid=${eid}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load leaderboard');
      setQuizLeaderboard(json.leaderboard || []);
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchQuizQuestions = async (eid) => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/teacher/questions?eid=${eid}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load questions');
      setQuizQuestions(json.questions || []);
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoadingQuestions(false);
    }
  };
  const deleteQuestion = async (qid) => {
    const confirmed = await showConfirm('Are you sure you want to delete this question?', 'Confirm Delete');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/teacher/questions?qid=${qid}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete question');
      showAlert('Question deleted successfully.', 'Deleted');
      if (selectedQuizForQuestions) {
        fetchQuizQuestions(selectedQuizForQuestions.eid);
      }
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  // Phase 4 Question Bank and Bulk Import Logic
  const fetchQbQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page: qbPage,
        limit: 10,
        subjectId: qbFilters.subjectId,
        topicId: qbFilters.topicId,
        difficulty: qbFilters.difficulty,
        status: qbFilters.status,
        search: qbFilters.search,
        sort: qbFilters.sort
      });
      const res = await fetch(`/api/teacher/questions?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setQbQuestions(json.questions || []);
        setQbTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQbSubjectsAndTopics = async () => {
    if (!data?.assignments) return;
    // Map unique subjects from teacher assignments
    const uniqueSubjects = [];
    const seen = new Set();
    data.assignments.forEach(a => {
      if (!seen.has(a.subject_id)) {
        seen.add(a.subject_id);
        uniqueSubjects.push({ id: a.subject_id, name: a.subject_name });
      }
    });
    setQbSubjects(uniqueSubjects);

    if (qbFilters.subjectId) {
      try {
        const res = await fetch(`/api/teacher/topics?subjectId=${qbFilters.subjectId}`);
        const json = await res.json();
        if (res.ok) {
          setQbTopics(json.topics || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'questionbank') {
      fetchQbQuestions();
    }
  }, [qbPage, qbFilters.subjectId, qbFilters.topicId, qbFilters.difficulty, qbFilters.status, qbFilters.sort, activeTab]);

  useEffect(() => {
    fetchQbSubjectsAndTopics();
  }, [qbFilters.subjectId, data]);

  const handleCreateOrUpdateQbQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = qbEditingId ? 'PUT' : 'POST';
      const url = qbEditingId ? `/api/teacher/questions/${qbEditingId}` : '/api/teacher/questions';
      
      const payload = {
        subjectId: qbForm.subjectId,
        topicId: qbForm.topicId || null,
        difficulty: qbForm.difficulty,
        qns: qbForm.qns,
        options: [
          { option: qbForm.a },
          { option: qbForm.b },
          { option: qbForm.c },
          { option: qbForm.d }
        ],
        correct: qbForm.correct,
        marks: qbForm.marks,
        explanation: qbForm.explanation,
        tags: qbForm.tags ? qbForm.tags.split(',').map(t => t.trim()) : [],
        sharing: qbForm.sharing
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save question');
      
      showAlert(qbEditingId ? 'Question updated successfully!' : 'Question added to bank!', 'Success');
      setShowQbCreateModal(false);
      setQbEditingId(null);
      setQbForm({ qns: '', a: '', b: '', c: '', d: '', correct: 'A', marks: '1', difficulty: 'UNSPECIFIED', subjectId: '', topicId: '', explanation: '', tags: '', sharing: 'PRIVATE' });
      fetchQbQuestions();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneQbQuestion = async (qid) => {
    try {
      const res = await fetch(`/api/teacher/questions/${qid}/clone`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to clone question');
      showAlert('Question cloned successfully in your bank.', 'Cloned');
      fetchQbQuestions();
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleDeleteQbQuestion = async (qid) => {
    const confirmed = await showConfirm('Are you sure you want to delete or archive this question?', 'Confirm Delete');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/teacher/questions/${qid}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete question');
      showAlert(json.archived ? 'Question archived due to historical exam usage.' : 'Question removed from Question Bank.', 'Success');
      fetchQbQuestions();
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/teacher/pools');
      const json = await res.json();
      if (res.ok) {
        setPoolsList(json.pools || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlueprints = async () => {
    try {
      const res = await fetch('/api/teacher/blueprints');
      const json = await res.json();
      if (res.ok) {
        setBlueprintsList(json.blueprints || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'questionpools') {
      fetchPools();
    }
    if (activeTab === 'blueprints') {
      fetchBlueprints();
    }
  }, [activeTab]);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!poolForm.name || !poolForm.subjectId || poolForm.qids.length === 0) {
      showAlert('Please enter pool name, pick subject, and select questions.', 'Validation');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poolForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create pool');
      showAlert('Question pool created successfully!', 'Success');
      setShowPoolCreateModal(false);
      setPoolForm({ name: '', subjectId: '', qids: [] });
      fetchPools();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlueprint = async (e) => {
    e.preventDefault();
    if (!bpForm.name || !bpForm.subjectId) {
      showAlert('Please enter blueprint name and pick subject.', 'Validation');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bpForm.name,
          subjectId: bpForm.subjectId,
          rules: {
            easy: parseInt(bpForm.easy || '0'),
            medium: parseInt(bpForm.medium || '0'),
            hard: parseInt(bpForm.hard || '0')
          }
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create blueprint');
      showAlert('Exam blueprint saved successfully!', 'Success');
      setShowBpCreateModal(false);
      setBpForm({ name: '', subjectId: '', easy: '0', medium: '0', hard: '0' });
      fetchBlueprints();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        // Basic CSV Parser
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Regex to parse CSV commas safely
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }

        setLoading(true);
        const res = await fetch('/api/teacher/questions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preview', rows })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to parse file');
        setImportPreview(json.preview);
        setImportFileRows(json.preview.rows || []);
      } catch (err) {
        showAlert(err.message, 'File Error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importFileRows || importFileRows.length === 0) return;
    const validRowsOnly = importFileRows.filter(r => r.errors.length === 0);
    if (validRowsOnly.length === 0) {
      showAlert('No valid rows found to import. Please fix errors and upload again.', 'Import Failed');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', rows: validRowsOnly })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to confirm import');
      showAlert(`Successfully imported ${json.count} questions into your Question Bank!`, 'Import Completed');
      setShowQbImportModal(false);
      setImportPreview(null);
      fetchQbQuestions();
    } catch (err) {
      showAlert(err.message, 'Import Error');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!newQuestionForm.qns || !newQuestionForm.a || !newQuestionForm.b || !newQuestionForm.c || !newQuestionForm.d) {
      showAlert('Please fill out all fields.', 'Error');
      return;
    }
    try {
      const res = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eid: selectedQuizForQuestions.eid,
          ...newQuestionForm
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add question');
      showAlert('Question added successfully.', 'Success');
      setNewQuestionForm({ qns: '', a: '', b: '', c: '', d: '', correct: 'A' });
      setShowAddQuestionForm(false);
      fetchQuizQuestions(selectedQuizForQuestions.eid);
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const updateQuestion = async () => {
    if (!editingQuestion.qns || !editingQuestion.options.every(o => o.option)) {
      showAlert('Please fill out all fields.', 'Error');
      return;
    }
    try {
      const res = await fetch('/api/teacher/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qid: editingQuestion.qid,
          qns: editingQuestion.qns,
          options: editingQuestion.options,
          correctOptionId: editingQuestion.correctOptionId
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update question');
      showAlert('Question updated successfully.', 'Success');
      setEditingQuestion(null);
      fetchQuizQuestions(selectedQuizForQuestions.eid);
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

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
    setCurrentQ({ qns: '', a: '', b: '', c: '', d: '', correct: 'A', marks: '1' });
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    setQuestions(newQuestions);
  };

  const saveQuiz = async () => {
    if (questions.length === 0 && quizDetails.selectionMode !== 'RANDOM_SET_PER_STUDENT') {
      showAlert('Please add at least one question to the exam list.', 'No Questions');
      return;
    }
    setLoading(true);
    
    try {
      const selectedAssignment = data?.assignments?.find(a => a.id === quizDetails.assignmentId);
      if (!selectedAssignment) {
        showAlert('Please select a valid academic context (Class/Subject)', 'Missing Assignment');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/teacher/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quizDetails,
          academicYearId: selectedAssignment.academic_year_id,
          academicUnitId: selectedAssignment.academic_unit_id,
          sectionId: selectedAssignment.section_id || null,
          subjectId: selectedAssignment.subject_id,
          questions
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save quiz');
      
      await showAlert('Quiz created and published successfully!', 'Quiz Created');
      setQuestions([]);
      setQuizDetails({ 
        title: '', tag: 'general', time: '5', sahi: '2', wrong: '1', desc: '', assignmentId: '',
        scheduledStart: '', scheduledEnd: '', maxAttempts: '1', shuffleQuestions: false, shuffleOptions: false,
        showResult: true, showCorrectAnswers: true, leaderboardEnabled: true, quizStatus: 'LIVE', passingPercentage: '40',
        selectionMode: 'SAME_SET_FOR_ALL', poolId: '', blueprintId: ''
      });
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
              { id: 'questionbank', label: 'Question Bank', icon: Database },
              { id: 'questionpools', label: 'Question Pools', icon: FolderOpen },
              { id: 'blueprints', label: 'Exam Blueprints', icon: FileCheck },
              { id: 'students', label: 'Students List', icon: Users },
              { id: 'rankings', label: 'Student Rankings', icon: BarChart3 },
              { id: 'feedbacks', label: 'User Feedbacks', icon: MessageSquare },
              { id: 'change-password', label: 'Change Password', icon: Lock }
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
            { id: 'questionbank', label: 'Bank' },
            { id: 'questionpools', label: 'Pools' },
            { id: 'blueprints', label: 'Blueprints' },
            { id: 'students', label: 'Students' },
            { id: 'rankings', label: 'Ranks' },
            { id: 'feedbacks', label: 'Feedbacks' },
            { id: 'change-password', label: 'Password' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 px-4 rounded-full font-bold transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap ${activeTab === t.id ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/20' : 'text-text-muted'}`}
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
              {selectedQuizForQuestions ? (
                /* Questions Manager sub-view */
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h1 className="text-2xl font-heading font-black">{selectedQuizForQuestions.title}</h1>
                      <p className="text-text-muted text-xs">Manage quiz questions and options</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedQuizForQuestions(null);
                        setEditingQuestion(null);
                        setShowAddQuestionForm(false);
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Back to Quizzes
                    </button>
                  </div>

                  {loadingQuestions ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-t-2 border-accent-teal rounded-full animate-spin"></div>
                      <p className="text-xs text-text-muted">Loading Questions...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Add Question Button */}
                      {!showAddQuestionForm && !editingQuestion && (
                        <button
                          onClick={() => setShowAddQuestionForm(true)}
                          className="bg-accent-teal hover:bg-accent-teal/80 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add Question to Quiz
                        </button>
                      )}

                      {/* Add Question Form inline */}
                      {showAddQuestionForm && (
                        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                          <h3 className="text-base font-bold text-accent-teal">Add Question</h3>
                          <div className="space-y-2">
                            <label className="text-xs text-text-muted uppercase font-bold">Question Prompt</label>
                            <textarea
                              rows={2}
                              value={newQuestionForm.qns}
                              onChange={(e) => setNewQuestionForm({...newQuestionForm, qns: e.target.value})}
                              placeholder="Type question prompt..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle resize-none text-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['a', 'b', 'c', 'd'].map(opt => (
                              <div key={opt} className="space-y-1">
                                <label className="text-[10px] text-text-muted uppercase font-bold">Option {opt.toUpperCase()}</label>
                                <input
                                  type="text"
                                  value={newQuestionForm[opt]}
                                  onChange={(e) => setNewQuestionForm({...newQuestionForm, [opt]: e.target.value})}
                                  placeholder={`Enter option ${opt.toUpperCase()}`}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle text-white"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1">
                              <label className="text-[10px] text-text-muted uppercase font-bold">Correct Option</label>
                              <CustomSelect
                                value={newQuestionForm.correct}
                                onChange={(val) => setNewQuestionForm({...newQuestionForm, correct: val})}
                                options={[
                                  { value: 'A', label: 'Option A' },
                                  { value: 'B', label: 'Option B' },
                                  { value: 'C', label: 'Option C' },
                                  { value: 'D', label: 'Option D' }
                                ]}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowAddQuestionForm(false)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={addQuestion}
                                className="px-4 py-2 bg-accent-teal hover:bg-accent-teal/80 text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Save Question
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Edit Question Form inline */}
                      {editingQuestion && (
                        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                          <h3 className="text-base font-bold text-accent-teal">Edit Question</h3>
                          <div className="space-y-2">
                            <label className="text-xs text-text-muted uppercase font-bold">Question Prompt</label>
                            <textarea
                              rows={2}
                              value={editingQuestion.qns}
                              onChange={(e) => setEditingQuestion({...editingQuestion, qns: e.target.value})}
                              placeholder="Type question prompt..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle resize-none text-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {editingQuestion.options.map((opt, optIdx) => (
                              <div key={opt.optionid} className="space-y-1">
                                <label className="text-[10px] text-text-muted uppercase font-bold">Option {['A', 'B', 'C', 'D'][optIdx]}</label>
                                <input
                                  type="text"
                                  value={opt.option}
                                  onChange={(e) => {
                                    const updatedOpts = [...editingQuestion.options];
                                    updatedOpts[optIdx] = { ...opt, option: e.target.value };
                                    setEditingQuestion({ ...editingQuestion, options: updatedOpts });
                                  }}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle text-white"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1">
                              <label className="text-[10px] text-text-muted uppercase font-bold">Correct Option</label>
                              <CustomSelect
                                value={editingQuestion.correctOptionId}
                                onChange={(val) => setEditingQuestion({...editingQuestion, correctOptionId: val})}
                                options={editingQuestion.options.map((o, idx) => ({
                                  value: o.optionid,
                                  label: `Option ${['A', 'B', 'C', 'D'][idx]}`
                                }))}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingQuestion(null)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={updateQuestion}
                                className="px-4 py-2 bg-accent-teal hover:bg-accent-teal/80 text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Update Question
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Questions List */}
                      {quizQuestions.length === 0 ? (
                        <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                          No questions in this quiz. Click "Add Question to Quiz" to start adding questions.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {quizQuestions.map((q, idx) => (
                            <div key={q.qid} className="bg-zinc-950 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-white/10 transition-colors">
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold flex gap-2">
                                  <span className="text-accent-teal font-black">#{idx + 1}</span>
                                  <span>{q.qns}</span>
                                </h4>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setEditingQuestion(q)}
                                    className="p-1.5 text-accent-teal hover:bg-accent-teal/10 rounded transition-colors cursor-pointer"
                                    title="Edit Question"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteQuestion(q.qid)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pl-6">
                                {q.options.map((opt, optIdx) => {
                                  const isCorrect = opt.optionid === q.correctOptionId;
                                  return (
                                    <div
                                      key={opt.optionid}
                                      className={`p-2.5 rounded-lg border transition-all ${
                                        isCorrect
                                          ? 'bg-accent-teal/10 border-accent-teal text-white font-bold'
                                          : 'bg-white/2 border-white/5 text-text-muted'
                                      }`}
                                    >
                                      <span className="mr-1.5 font-bold text-accent-teal-light">
                                        {['A', 'B', 'C', 'D'][optIdx]}.
                                      </span>
                                      {opt.option}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Original Quizzes Listing */
                <>
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
                                <td className="p-4 text-center flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedQuizForQuestions(quiz);
                                      fetchQuizQuestions(quiz.eid);
                                    }}
                                    className="p-2 text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors cursor-pointer"
                                    title="Manage Questions"
                                  >
                                    <List className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteItem('quiz', quiz.eid)}
                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Quiz"
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
                </>
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
                    <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Academic Context (Class & Subject) *</label>
                    <select
                      required
                      value={quizDetails.assignmentId}
                      onChange={(e) => setQuizDetails({...quizDetails, assignmentId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white"
                    >
                      <option value="">Select Class & Subject</option>
                      {data?.assignments?.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.year_name} - {a.unit_name} {a.section_name ? `(${a.section_name})` : ''} - {a.subject_name}
                        </option>
                      ))}
                    </select>
                  </div>
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

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Max Attempts Allowed</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={quizDetails.maxAttempts}
                        onChange={(e) => setQuizDetails({...quizDetails, maxAttempts: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Passing Percentage (%)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={quizDetails.passingPercentage}
                        onChange={(e) => setQuizDetails({...quizDetails, passingPercentage: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Scheduled Start (Optional)</label>
                      <input
                        type="datetime-local"
                        value={quizDetails.scheduledStart}
                        onChange={(e) => setQuizDetails({...quizDetails, scheduledStart: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Scheduled End (Optional)</label>
                      <input
                        type="datetime-local"
                        value={quizDetails.scheduledEnd}
                        onChange={(e) => setQuizDetails({...quizDetails, scheduledEnd: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Question Selection Mode</label>
                      <select
                        value={quizDetails.selectionMode}
                        onChange={(e) => {
                          setQuizDetails({ ...quizDetails, selectionMode: e.target.value, poolId: '', blueprintId: '' });
                          if (e.target.value === 'RANDOM_SET_PER_STUDENT') {
                            fetchPools();
                            fetchBlueprints();
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white bg-[#0a0f1a]"
                      >
                        <option value="SAME_SET_FOR_ALL">Fixed / Manual Questions</option>
                        <option value="RANDOM_SET_PER_STUDENT">Randomized Set Per Student</option>
                      </select>
                    </div>

                    {quizDetails.selectionMode === 'RANDOM_SET_PER_STUDENT' && (
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Randomization Source</label>
                        <select
                          value={quizDetails.blueprintId ? 'BLUEPRINT' : quizDetails.poolId ? 'POOL' : 'TOTAL'}
                          onChange={(e) => {
                            if (e.target.value === 'BLUEPRINT') {
                              setQuizDetails({ ...quizDetails, blueprintId: blueprintsList[0]?.id || '', poolId: '' });
                            } else if (e.target.value === 'POOL') {
                              setQuizDetails({ ...quizDetails, poolId: poolsList[0]?.id || '', blueprintId: '' });
                            } else {
                              setQuizDetails({ ...quizDetails, poolId: '', blueprintId: '' });
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white bg-[#0a0f1a]"
                        >
                          <option value="TOTAL">Total Question Bank (Random)</option>
                          <option value="POOL">From Question Pool</option>
                          <option value="BLUEPRINT">According to Blueprint</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {quizDetails.selectionMode === 'RANDOM_SET_PER_STUDENT' && !quizDetails.blueprintId && (
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Select Question Pool</label>
                      <select
                        value={quizDetails.poolId}
                        onChange={(e) => setQuizDetails({ ...quizDetails, poolId: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white bg-[#0a0f1a]"
                      >
                        <option value="">-- Choose Pool --</option>
                        {poolsList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.question_count} questions)</option>)}
                      </select>
                    </div>
                  )}

                  {quizDetails.selectionMode === 'RANDOM_SET_PER_STUDENT' && quizDetails.blueprintId && (
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Select Exam Blueprint</label>
                      <select
                        value={quizDetails.blueprintId}
                        onChange={(e) => setQuizDetails({ ...quizDetails, blueprintId: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white bg-[#0a0f1a]"
                      >
                        <option value="">-- Choose Blueprint --</option>
                        {blueprintsList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Exam Configuration & Settings</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                        <input 
                          type="checkbox"
                          checked={quizDetails.shuffleQuestions}
                          onChange={(e) => setQuizDetails({ ...quizDetails, shuffleQuestions: e.target.checked })}
                          className="accent-accent-teal w-4 h-4"
                        />
                        <span className="text-xs text-white">Shuffle Questions</span>
                      </label>
                      <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                        <input 
                          type="checkbox"
                          checked={quizDetails.shuffleOptions}
                          onChange={(e) => setQuizDetails({ ...quizDetails, shuffleOptions: e.target.checked })}
                          className="accent-accent-teal w-4 h-4"
                        />
                        <span className="text-xs text-white">Shuffle Options (MCQ)</span>
                      </label>
                      <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                        <input 
                          type="checkbox"
                          checked={quizDetails.showResult}
                          onChange={(e) => setQuizDetails({ ...quizDetails, showResult: e.target.checked })}
                          className="accent-accent-teal w-4 h-4"
                        />
                        <span className="text-xs text-white">Show Final Score</span>
                      </label>
                      <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                        <input 
                          type="checkbox"
                          checked={quizDetails.showCorrectAnswers}
                          onChange={(e) => setQuizDetails({ ...quizDetails, showCorrectAnswers: e.target.checked })}
                          className="accent-accent-teal w-4 h-4"
                        />
                        <span className="text-xs text-white">Show Correct Answers</span>
                      </label>
                      <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5 col-span-2">
                        <input 
                          type="checkbox"
                          checked={quizDetails.leaderboardEnabled}
                          onChange={(e) => setSettings({ ...quizDetails, leaderboardEnabled: e.target.checked })}
                          className="accent-accent-teal w-4 h-4"
                        />
                        <span className="text-xs text-white">Enable Exam-Specific Leaderboard</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Publish Status</label>
                    <select
                      value={quizDetails.quizStatus}
                      onChange={(e) => setQuizDetails({...quizDetails, quizStatus: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white"
                    >
                      <option value="LIVE">Publish Instantly (Live)</option>
                      <option value="SCHEDULED">Scheduled Only (Available at start date)</option>
                      <option value="DRAFT">Draft Mode (Hidden from students)</option>
                    </select>
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
                      if (quizDetails.selectionMode === 'RANDOM_SET_PER_STUDENT') {
                        saveQuiz();
                      } else {
                        setWizardStep(2);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
                  >
                    {quizDetails.selectionMode === 'RANDOM_SET_PER_STUDENT' ? 'Publish Exam (Randomized)' : 'Configure Questions'}
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

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Question Marks / Weight</label>
                      <input
                        type="number"
                        min="1"
                        value={currentQ.marks}
                        onChange={(e) => setCurrentQ({...currentQ, marks: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all text-white"
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
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const selectedAssignment = data?.assignments?.find(a => a.id === quizDetails.assignmentId);
                              if (selectedAssignment) {
                                try {
                                  const res = await fetch(`/api/teacher/questions?subjectId=${selectedAssignment.subject_id}&limit=100`);
                                  const json = await res.json();
                                  if (res.ok) {
                                    setQbQuestions(json.questions || []);
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                              setShowQbDrawer(true);
                            }}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Add from Bank
                          </button>
                          <button
                            onClick={saveQuiz}
                            className="bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            Publish Quiz
                          </button>
                        </div>
                      )}
                    </div>
                    {questions.length === 0 ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-text-muted text-xs italic">No questions added yet.</p>
                        <button
                          onClick={async () => {
                            const selectedAssignment = data?.assignments?.find(a => a.id === quizDetails.assignmentId);
                            if (selectedAssignment) {
                              try {
                                const res = await fetch(`/api/teacher/questions?subjectId=${selectedAssignment.subject_id}&limit=100`);
                                const json = await res.json();
                                if (res.ok) {
                                  setQbQuestions(json.questions || []);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }
                            setShowQbDrawer(true);
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-accent-teal py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Database className="w-4 h-4" />
                          Browse Question Bank
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-60 overflow-y-auto pr-2 space-y-3">
                        {questions.map((q, idx) => (
                          <div key={idx} className="pt-3 flex justify-between items-start gap-4">
                            <div>
                              <p className="text-sm font-bold text-white flex gap-1"><span className="text-accent-teal-light">#{idx+1}</span> {q.qns}</p>
                              <p className="text-[10px] text-text-muted mt-1">Correct Answer: Option {q.correct}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => moveQuestion(idx, -1)}
                                className="p-1 hover:bg-white/5 rounded text-text-muted disabled:opacity-30 cursor-pointer"
                              >
                                ▲
                              </button>
                              <button
                                disabled={idx === questions.length - 1}
                                onClick={() => moveQuestion(idx, 1)}
                                className="p-1 hover:bg-white/5 rounded text-text-muted disabled:opacity-30 cursor-pointer"
                              >
                                ▼
                              </button>
                              <button
                                onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                                className="text-rose-500 p-1 hover:bg-rose-500/10 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Question Bank Drawer Modal */}
              {showQbDrawer && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm p-0">
                  <div className="bg-zinc-950 border-l border-white/10 w-full max-w-lg h-full p-6 flex flex-col justify-between shadow-2xl">
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h3 className="text-lg font-bold text-accent-teal">Select Questions from Bank</h3>
                        <button onClick={() => setShowQbDrawer(false)} className="text-xs text-text-muted hover:text-white bg-white/5 border border-white/10 px-3 py-1 rounded-lg">Close</button>
                      </div>
                      <div className="space-y-3">
                        {qbQuestions.map(q => (
                          <div key={q.qid} className="p-4 bg-white/3 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <p className="text-xs font-semibold">{q.qns}</p>
                              <p className="text-[10px] text-text-muted mt-1">Difficulty: {q.difficulty} | Marks: {q.marks}</p>
                            </div>
                            <button
                              disabled={questions.some(added => added.qid === q.qid)}
                              onClick={() => {
                                setQuestions([...questions, {
                                  qid: q.qid,
                                  qns: q.qns,
                                  a: q.options?.[0]?.option || '',
                                  b: q.options?.[1]?.option || '',
                                  c: q.options?.[2]?.option || '',
                                  d: q.options?.[3]?.option || '',
                                  correct: q.correct_ansid ? (q.options?.findIndex(o => o.optionid === q.correct_ansid) === 0 ? 'A' : q.options?.findIndex(o => o.optionid === q.correct_ansid) === 1 ? 'B' : q.options?.findIndex(o => o.optionid === q.correct_ansid) === 2 ? 'C' : 'D') : 'A',
                                  marks: String(q.marks),
                                  difficulty: q.difficulty || 'UNSPECIFIED'
                                }]);
                              }}
                              className="px-2.5 py-1 bg-accent-teal hover:bg-accent-teal-light text-white text-xs font-bold rounded-lg disabled:opacity-40 cursor-pointer"
                            >
                              {questions.some(added => added.qid === q.qid) ? 'Added' : 'Add'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'questionbank' && (
            <motion.div
              key="questionbank"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h1 className="text-3xl font-heading font-black">Question Bank</h1>
                  <p className="text-text-muted text-sm">Manage reusable master questions, tags, topics, and bulk imports.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setImportPreview(null);
                      setImportFileRows([]);
                      setShowQbImportModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-accent-teal" />
                    Bulk Import
                  </button>
                  <button
                    onClick={() => {
                      setQbEditingId(null);
                      setQbForm({ qns: '', a: '', b: '', c: '', d: '', correct: 'A', marks: '1', difficulty: 'UNSPECIFIED', subjectId: qbFilters.subjectId || '', topicId: '', explanation: '', tags: '', sharing: 'PRIVATE' });
                      setShowQbCreateModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-accent-teal hover:bg-accent-teal-light text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-zinc-950 p-4 border border-white/10 rounded-2xl">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={qbFilters.search}
                  onChange={(e) => setQbFilters({ ...qbFilters, search: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent-teal/50 text-white placeholder:text-text-subtle"
                />
                <select
                  value={qbFilters.subjectId}
                  onChange={(e) => setQbFilters({ ...qbFilters, subjectId: e.target.value, topicId: '' })}
                  className="bg-[#0a0f1a] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-teal/50 text-white"
                >
                  <option value="">All Subjects</option>
                  {qbSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select
                  value={qbFilters.topicId}
                  onChange={(e) => setQbFilters({ ...qbFilters, topicId: e.target.value })}
                  disabled={!qbFilters.subjectId}
                  className="bg-[#0a0f1a] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-teal/50 text-white disabled:opacity-50"
                >
                  <option value="">All Topics</option>
                  {qbTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select
                  value={qbFilters.difficulty}
                  onChange={(e) => setQbFilters({ ...qbFilters, difficulty: e.target.value })}
                  className="bg-[#0a0f1a] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-teal/50 text-white"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                  <option value="UNSPECIFIED">Unspecified</option>
                </select>
                <select
                  value={qbFilters.sort}
                  onChange={(e) => setQbFilters({ ...qbFilters, sort: e.target.value })}
                  className="bg-[#0a0f1a] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-teal/50 text-white"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="marks">Marks</option>
                </select>
              </div>

              {/* Questions List */}
              {qbQuestions.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No questions found in Question Bank matching the criteria. Click "Add Question" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                            <th className="p-4">Question Text</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Difficulty</th>
                            <th className="p-4">Marks</th>
                            <th className="p-4">Sharing</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {qbQuestions.map((q) => (
                            <tr key={q.qid} className="hover:bg-white/2 transition-colors">
                              <td className="p-4 font-semibold max-w-md truncate">{q.qns}</td>
                              <td className="p-4 text-xs text-text-muted">{q.subject_name}</td>
                              <td className="p-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  q.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  q.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  q.difficulty === 'HARD' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  'bg-white/5 text-text-muted border border-white/10'
                                }`}>
                                  {q.difficulty}
                                </span>
                              </td>
                              <td className="p-4 text-accent-teal font-bold">{q.marks}</td>
                              <td className="p-4 text-xs text-text-muted uppercase">{q.sharing}</td>
                              <td className="p-4 text-center flex justify-center items-center gap-2">
                                <button
                                  title="Edit"
                                  onClick={() => {
                                    setQbEditingId(q.qid);
                                    setQbForm({
                                      qns: q.qns,
                                      a: q.options?.[0]?.option || '',
                                      b: q.options?.[1]?.option || '',
                                      c: q.options?.[2]?.option || '',
                                      d: q.options?.[3]?.option || '',
                                      correct: q.correct_ansid ? (q.options?.findIndex(o => o.optionid === q.correct_ansid) === 0 ? 'A' : q.options?.findIndex(o => o.optionid === q.correct_ansid) === 1 ? 'B' : q.options?.findIndex(o => o.optionid === q.correct_ansid) === 2 ? 'C' : 'D') : 'A',
                                      marks: String(q.marks),
                                      difficulty: q.difficulty || 'UNSPECIFIED',
                                      subjectId: q.subject_id || '',
                                      topicId: q.topic_id || '',
                                      explanation: q.explanation || '',
                                      tags: q.tags?.join(', ') || '',
                                      sharing: q.sharing || 'PRIVATE'
                                    });
                                    setShowQbCreateModal(true);
                                  }}
                                  className="p-1.5 hover:bg-white/5 rounded text-accent-teal transition-colors cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  title="Clone"
                                  onClick={() => handleCloneQbQuestion(q.qid)}
                                  className="p-1.5 hover:bg-white/5 rounded text-white/65 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  title="Delete / Archive"
                                  onClick={() => handleDeleteQbQuestion(q.qid)}
                                  className="p-1.5 hover:bg-rose-500/10 rounded text-rose-500 transition-colors cursor-pointer"
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

                  {/* Pagination */}
                  <div className="flex justify-between items-center bg-zinc-950 p-4 border border-white/10 rounded-2xl">
                    <p className="text-xs text-text-muted">Total Questions: <span className="font-bold text-white">{qbTotal}</span></p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={qbPage <= 1}
                        onClick={() => setQbPage(qbPage - 1)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs disabled:opacity-50 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-text-muted">Page {qbPage}</span>
                      <button
                        disabled={qbQuestions.length < 10}
                        onClick={() => setQbPage(qbPage + 1)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs disabled:opacity-50 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Question Pools Tab */}
          {activeTab === 'questionpools' && (
            <motion.div
              key="questionpools"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h1 className="text-3xl font-heading font-black">Question Pools</h1>
                  <p className="text-text-muted text-sm">Create and reuse specific question pools for random selection.</p>
                </div>
                <button
                  onClick={() => {
                    setPoolForm({ name: '', subjectId: '', qids: [] });
                    setShowPoolCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent-teal hover:bg-accent-teal-light text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Pool
                </button>
              </div>

              {poolsList.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No question pools created yet. Click "Create Pool" to start one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {poolsList.map(pool => (
                    <div key={pool.id} className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4 hover:border-accent-teal/30 transition-colors shadow-lg">
                      <div>
                        <h3 className="text-lg font-bold text-white">{pool.name}</h3>
                        <p className="text-xs text-text-muted mt-1">Subject: {pool.subject_name}</p>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="bg-accent-teal/10 text-accent-teal px-3 py-1 rounded-full font-bold border border-accent-teal/20">
                          {pool.question_count} Questions
                        </span>
                        <span className="text-text-subtle">By: {pool.created_by.split('@')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Blueprints Tab */}
          {activeTab === 'blueprints' && (
            <motion.div
              key="blueprints"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h1 className="text-3xl font-heading font-black">Exam Blueprints</h1>
                  <p className="text-text-muted text-sm">Save reusable difficulty-based configuration blueprints.</p>
                </div>
                <button
                  onClick={() => {
                    setBpForm({ name: '', subjectId: '', easy: '0', medium: '0', hard: '0' });
                    setShowBpCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent-teal hover:bg-accent-teal-light text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Blueprint
                </button>
              </div>

              {blueprintsList.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                  No exam blueprints saved yet. Click "Create Blueprint" to configure one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {blueprintsList.map(bp => (
                    <div key={bp.id} className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4 hover:border-accent-teal/30 transition-colors shadow-lg">
                      <div>
                        <h3 className="text-lg font-bold text-white">{bp.name}</h3>
                        <p className="text-xs text-text-muted mt-1">Subject: {bp.subject_name}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3 space-y-1.5 text-xs text-text-muted">
                        <div className="flex justify-between"><span>Easy Count:</span> <span className="font-bold text-white">{bp.rules?.easy || 0}</span></div>
                        <div className="flex justify-between"><span>Medium Count:</span> <span className="font-bold text-white">{bp.rules?.medium || 0}</span></div>
                        <div className="flex justify-between"><span>Hard Count:</span> <span className="font-bold text-white">{bp.rules?.hard || 0}</span></div>
                        <div className="flex justify-between border-t border-white/5 pt-1.5">
                          <span className="font-bold text-accent-teal">Total Questions:</span> 
                          <span className="font-bold text-accent-teal">{(parseInt(bp.rules?.easy || 0) + parseInt(bp.rules?.medium || 0) + parseInt(bp.rules?.hard || 0))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Modal: Create/Edit QB Question */}
          {showQbCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                <h3 className="text-xl font-bold text-accent-teal">{qbEditingId ? 'Edit Question' : 'Add Question to Bank'}</h3>
                <form onSubmit={handleCreateOrUpdateQbQuestion} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Subject *</label>
                      <select
                        required
                        value={qbForm.subjectId}
                        onChange={(e) => setQbForm({ ...qbForm, subjectId: e.target.value, topicId: '' })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                      >
                        <option value="">Select Subject</option>
                        {qbSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Topic</label>
                      <select
                        value={qbForm.topicId}
                        onChange={(e) => setQbForm({ ...qbForm, topicId: e.target.value })}
                        disabled={!qbForm.subjectId}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white disabled:opacity-50"
                      >
                        <option value="">Select Topic</option>
                        {qbTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Question Prompt *</label>
                    <textarea
                      required
                      rows={3}
                      value={qbForm.qns}
                      onChange={(e) => setQbForm({ ...qbForm, qns: e.target.value })}
                      placeholder="Write question text..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div key={opt} className="space-y-1">
                        <label className="text-[10px] text-text-muted uppercase font-bold">Option {opt.toUpperCase()} *</label>
                        <input
                          type="text"
                          required
                          value={qbForm[opt]}
                          onChange={(e) => setQbForm({ ...qbForm, [opt]: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Correct Answer *</label>
                      <select
                        value={qbForm.correct}
                        onChange={(e) => setQbForm({ ...qbForm, correct: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Difficulty *</label>
                      <select
                        value={qbForm.difficulty}
                        onChange={(e) => setQbForm({ ...qbForm, difficulty: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                      >
                        <option value="UNSPECIFIED">Unspecified</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Marks *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={qbForm.marks}
                        onChange={(e) => setQbForm({ ...qbForm, marks: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Explanation</label>
                    <textarea
                      rows={2}
                      value={qbForm.explanation}
                      onChange={(e) => setQbForm({ ...qbForm, explanation: e.target.value })}
                      placeholder="Why is this answer correct?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Tags (Comma separated)</label>
                      <input
                        type="text"
                        value={qbForm.tags}
                        onChange={(e) => setQbForm({ ...qbForm, tags: e.target.value })}
                        placeholder="important, revision, unit-1"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Visibility Sharing</label>
                      <select
                        value={qbForm.sharing}
                        onChange={(e) => setQbForm({ ...qbForm, sharing: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white"
                      >
                        <option value="PRIVATE">Private (Only Me)</option>
                        <option value="INSTITUTION">Institution-Wide (All Teachers)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowQbCreateModal(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-accent-teal hover:bg-accent-teal-light text-white rounded-xl text-xs font-bold"
                    >
                      {loading ? 'Saving...' : 'Save Question'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Bulk Import Questions */}
          {showQbImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xl font-bold text-accent-teal">Bulk Question Import</h3>
                  <button
                    onClick={() => {
                      const headers = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'marks', 'difficulty', 'subject', 'topic', 'tags', 'explanation'];
                      const sampleRow = ['"What is the capital of France?"', '"Berlin"', '"Madrid"', '"Paris"', '"Rome"', 'C', '1', 'Easy', '"Geography"', '"Capitals"', '"europe,basic"', '"Paris is the capital."'];
                      const csv = [headers.join(','), sampleRow.join(',')].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'question_import_template.csv';
                      link.click();
                    }}
                    className="text-xs text-accent-teal-light hover:underline font-bold"
                  >
                    Download CSV Template
                  </button>
                </div>

                {!importPreview ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
                    <UploadCloud className="w-12 h-12 text-text-muted" />
                    <div>
                      <p className="text-sm font-semibold">Upload question CSV file</p>
                      <p className="text-xs text-text-muted mt-1">Make sure column headers match the template exactly.</p>
                    </div>
                    <label className="px-4 py-2 bg-accent-teal hover:bg-accent-teal-light text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
                      Select CSV File
                      <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary statistics */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="bg-white/3 border border-white/5 p-3 rounded-xl">
                        <p className="text-xs text-text-muted">Total Rows</p>
                        <p className="text-lg font-bold">{importPreview.summary.total}</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-400">
                        <p className="text-xs text-text-muted">Valid Rows</p>
                        <p className="text-lg font-bold">{importPreview.summary.valid}</p>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400">
                        <p className="text-xs text-text-muted">Errors</p>
                        <p className="text-lg font-bold">{importPreview.summary.errors}</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-400">
                        <p className="text-xs text-text-muted">Duplicates</p>
                        <p className="text-lg font-bold">{importPreview.summary.warnings}</p>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/3 border-b border-white/10 text-text-muted uppercase font-bold">
                            <th className="p-2.5">Row</th>
                            <th className="p-2.5">Question Preview</th>
                            <th className="p-2.5">Subject</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {importFileRows.map((r, idx) => (
                            <tr key={idx} className="hover:bg-white/2">
                              <td className="p-2.5 text-text-muted">{r.index}</td>
                              <td className="p-2.5 font-semibold truncate max-w-[200px]">{r.question}</td>
                              <td className="p-2.5 text-text-muted">{r.subjectName}</td>
                              <td className="p-2.5">
                                {r.errors.length > 0 ? (
                                  <span className="text-rose-400 font-bold">{r.errors[0]}</span>
                                ) : r.warnings.length > 0 ? (
                                  <span className="text-amber-400 font-bold">Duplicate warning</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">Ready</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <button
                        onClick={() => setImportPreview(null)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold"
                      >
                        Reset Upload
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowQbImportModal(false)}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={loading || importPreview.summary.valid === 0}
                          onClick={handleConfirmImport}
                          className="px-5 py-2 bg-accent-teal hover:bg-accent-teal-light text-white font-bold rounded-xl text-xs disabled:opacity-50"
                        >
                          {loading ? 'Importing...' : 'Import Valid Rows'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal: Create Pool */}
          {showPoolCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                <h3 className="text-xl font-bold text-accent-teal">Create Question Pool</h3>
                <form onSubmit={handleCreatePool} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Pool Name *</label>
                    <input
                      type="text"
                      required
                      value={poolForm.name}
                      onChange={(e) => setPoolForm({ ...poolForm, name: e.target.value })}
                      placeholder="e.g. Algebra Basics Pool, Networking Chapter 1"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Subject Context *</label>
                    <select
                      required
                      value={poolForm.subjectId}
                      onChange={async (e) => {
                        const subId = e.target.value;
                        setPoolForm({ ...poolForm, subjectId: subId, qids: [] });
                        // Fetch Question Bank questions for this subject to select
                        try {
                          const res = await fetch(`/api/teacher/questions?subjectId=${subId}&limit=100`);
                          const json = await res.json();
                          if (res.ok) {
                            setQbQuestions(json.questions || []);
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                    >
                      <option value="">Select Subject</option>
                      {qbSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  {poolForm.subjectId && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Select Questions ({poolForm.qids.length} selected)</label>
                      <div className="border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                        {qbQuestions.map(q => (
                          <label key={q.qid} className="flex items-start gap-2 text-xs hover:bg-white/2 p-1.5 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={poolForm.qids.includes(q.qid)}
                              onChange={(evt) => {
                                if (evt.target.checked) {
                                  setPoolForm({ ...poolForm, qids: [...poolForm.qids, q.qid] });
                                } else {
                                  setPoolForm({ ...poolForm, qids: poolForm.qids.filter(id => id !== q.qid) });
                                }
                              }}
                              className="accent-accent-teal w-4 h-4 mt-0.5"
                            />
                            <span>{q.qns}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowPoolCreateModal(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || poolForm.qids.length === 0}
                      className="px-5 py-2 bg-accent-teal hover:bg-accent-teal-light text-white rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Pool'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Create Blueprint */}
          {showBpCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                <h3 className="text-xl font-bold text-accent-teal">Create Exam Blueprint</h3>
                <form onSubmit={handleCreateBlueprint} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Blueprint Name *</label>
                    <input
                      type="text"
                      required
                      value={bpForm.name}
                      onChange={(e) => setBpForm({ ...bpForm, name: e.target.value })}
                      placeholder="e.g. Final Semester Exam, Mid-Term Blueprint"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Subject Context *</label>
                    <select
                      required
                      value={bpForm.subjectId}
                      onChange={(e) => setBpForm({ ...bpForm, subjectId: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white"
                    >
                      <option value="">Select Subject</option>
                      {qbSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Easy Questions Count</label>
                      <input
                        type="number"
                        min="0"
                        value={bpForm.easy}
                        onChange={(e) => setBpForm({ ...bpForm, easy: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Medium Questions Count</label>
                      <input
                        type="number"
                        min="0"
                        value={bpForm.medium}
                        onChange={(e) => setBpForm({ ...bpForm, medium: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Hard Questions Count</label>
                      <input
                        type="number"
                        min="0"
                        value={bpForm.hard}
                        onChange={(e) => setBpForm({ ...bpForm, hard: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowBpCreateModal(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-accent-teal hover:bg-accent-teal-light text-white rounded-xl text-xs font-bold"
                    >
                      {loading ? 'Saving...' : 'Save Blueprint'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
              {selectedQuizForLeaderboard ? (
                /* Specific Quiz Leaderboard */
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h1 className="text-2xl font-heading font-black">{selectedQuizForLeaderboard.title} Leaderboard</h1>
                      <p className="text-text-muted text-xs">Subject: {selectedQuizForLeaderboard.tag}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {quizLeaderboard.length > 0 && (
                        <button
                          onClick={() => {
                            const headers = ['Rank', 'Student Name', 'Email', 'College', 'Score', 'Percentage', 'Time Taken', 'Submitted At'];
                            const rows = quizLeaderboard.map(row => {
                              const pct = selectedQuizForLeaderboard.total > 0 
                                ? Math.round((row.sahi / selectedQuizForLeaderboard.total) * 100) 
                                : 0;
                              return [
                                row.rank,
                                `"${row.name.replace(/"/g, '""')}"`,
                                row.email,
                                `"${(row.college || '').replace(/"/g, '""')}"`,
                                row.score,
                                `${pct}%`,
                                `"${row.time_taken ? row.time_taken + 's' : '0s'}"`,
                                `"${new Date(row.date).toLocaleString()}"`
                              ];
                            });
                            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.setAttribute('href', url);
                            link.setAttribute('download', `${selectedQuizForLeaderboard.title.replace(/\s+/g, '_')}_results.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-4 py-2 bg-accent-teal/10 hover:bg-accent-teal/20 border border-accent-teal/20 rounded-xl text-xs font-bold text-accent-teal transition-colors cursor-pointer"
                        >
                          Export CSV
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedQuizForLeaderboard(null)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Back to Quiz List
                      </button>
                    </div>
                  </div>

                  {loadingLeaderboard ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-t-2 border-accent-teal rounded-full animate-spin"></div>
                      <p className="text-xs text-text-muted">Loading Leaderboard...</p>
                    </div>
                  ) : quizLeaderboard.length === 0 ? (
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                      No attempts registered for this exam yet.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Average Score</span>
                          <p className="text-2xl font-black text-white mt-1">
                            {(quizLeaderboard.reduce((sum, r) => sum + r.score, 0) / quizLeaderboard.length).toFixed(1)}
                          </p>
                        </div>
                        <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Highest Score</span>
                          <p className="text-2xl font-black text-emerald-400 mt-1">
                            {Math.max(...quizLeaderboard.map(r => r.score))}
                          </p>
                        </div>
                        <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Lowest Score</span>
                          <p className="text-2xl font-black text-rose-400 mt-1">
                            {Math.min(...quizLeaderboard.map(r => r.score))}
                          </p>
                        </div>
                        <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Pass Rate</span>
                          <p className="text-2xl font-black text-accent-teal mt-1">
                            {Math.round((quizLeaderboard.filter(r => {
                              const pct = selectedQuizForLeaderboard.total > 0 ? (r.sahi / selectedQuizForLeaderboard.total) * 100 : 0;
                              return pct >= (selectedQuizForLeaderboard.passing_percentage || 40);
                            }).length / quizLeaderboard.length) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!loadingLeaderboard && quizLeaderboard.length > 0 && (
                    <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                              <th className="p-4 w-20 text-center">Rank</th>
                              <th className="p-4">Student</th>
                              <th className="p-4">College</th>
                              <th className="p-4 text-center">Score</th>
                              <th className="p-4 text-center">Percentage</th>
                              <th className="p-4">Attempt Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm">
                            {quizLeaderboard.map((row) => {
                              const pct = selectedQuizForLeaderboard.total > 0 
                                ? Math.round((row.sahi / selectedQuizForLeaderboard.total) * 100) 
                                : 0;
                              return (
                                <tr key={row.email} className="hover:bg-white/2 transition-colors">
                                  <td className="p-4 font-black text-center text-accent-teal text-base">#{row.rank}</td>
                                  <td className="p-4">
                                    <div className="font-bold text-white">{row.name}</div>
                                    <div className="text-[10px] text-text-subtle">{row.email}</div>
                                  </td>
                                  <td className="p-4 text-text-muted">{row.college}</td>
                                  <td className="p-4 text-center font-semibold">{row.score}</td>
                                  <td className="p-4 text-center font-extrabold text-accent-teal-light">{pct}%</td>
                                  <td className="p-4 text-text-muted text-xs">{new Date(row.date).toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Select Quiz List */
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-heading font-black mb-2">Quiz Leaderboards</h1>
                    <p className="text-text-muted text-sm">Select one of your quizzes below to view its student rankings.</p>
                  </div>

                  {data?.quizzes?.length === 0 ? (
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
                      No active quizzes found. Create a quiz first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data?.quizzes?.map((quiz) => (
                        <motion.div
                          key={quiz.eid}
                          whileHover={{ y: -4 }}
                          onClick={() => {
                            setSelectedQuizForLeaderboard(quiz);
                            fetchQuizLeaderboard(quiz.eid);
                          }}
                          className="bg-zinc-950 border border-white/10 hover:border-accent-teal/30 p-6 rounded-3xl cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(13,148,136,0.05)] flex flex-col justify-between h-48"
                        >
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal font-bold uppercase tracking-wider mb-3 inline-block">
                              {quiz.tag}
                            </span>
                            <h3 className="text-lg font-bold text-white line-clamp-2">{quiz.title}</h3>
                          </div>
                          <div className="flex justify-between items-center text-xs text-text-muted border-t border-white/5 pt-3 mt-3">
                            <span>Questions: {quiz.total}</span>
                            <span className="flex items-center gap-1 text-accent-teal font-bold hover:text-accent-teal-light">
                              View Results
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
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
                <p className="text-sm text-text-muted">Manage your secure teacher credentials.</p>
              </div>
              <TeacherChangePasswordForm />
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

function TeacherChangePasswordForm() {
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
