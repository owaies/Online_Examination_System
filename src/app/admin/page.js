"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, UserPlus, Trash2, LogOut, ShieldAlert, Mail, Lock,
  GraduationCap, CheckCircle, HelpCircle, Sparkles, Building, Globe, MapPin, Phone,
  Plus, Search, ArrowRight, Eye, EyeOff, CheckSquare, Users, BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'teachers' | 'students' | 'profile'
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addTeacherSuccess, setAddTeacherSuccess] = useState('');
  const [submittingTeacher, setSubmittingTeacher] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: '', gender: 'M', college: '', email: '', mob: '', password: ''
  });
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [addStudentSuccess, setAddStudentSuccess] = useState('');
  const [submittingStudent, setSubmittingStudent] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '', phone: '', website: '', address: '', logoUrl: ''
  });
  const [profileSuccess, setProfileSuccess] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

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
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load admin dashboard');
      }
      const json = await res.json();
      setTeachers(json.teachers || []);
      setStudents(json.students || []);
      setInstitution(json.institution || null);
      if (json.institution) {
        setProfileForm({
          name: json.institution.name || '',
          phone: json.institution.phone || '',
          website: json.institution.website || '',
          address: json.institution.address || '',
          logoUrl: json.institution.logo_url || ''
        });
        // Default student college field to institution name for ease
        setStudentForm(prev => ({ ...prev, college: json.institution.name }));
      }
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

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setSubmittingTeacher(true);
    setAddTeacherSuccess('');

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'teacher', email: newEmail, password: newPassword })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add teacher');
      
      setAddTeacherSuccess('Teacher added successfully!');
      setNewEmail('');
      setNewPassword('');
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setSubmittingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (email) => {
    const confirmed = await showConfirm(`Are you sure you want to remove teacher: ${email}?`, 'Confirm Action');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/dashboard?email=${email}&type=teacher`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove teacher');
      fetchDashboardData();
      showAlert('Teacher account removed successfully.', 'Success');
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSubmittingStudent(true);
    setAddStudentSuccess('');

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'student', ...studentForm })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add student');
      
      setAddStudentSuccess('Student added successfully!');
      setStudentForm({
        name: '', gender: 'M', college: institution?.name || '', email: '', mob: '', password: ''
      });
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setSubmittingStudent(false);
    }
  };

  const handleDeleteStudent = async (email) => {
    const confirmed = await showConfirm(`Are you sure you want to delete student: ${email}?`, 'Confirm Action');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/dashboard?email=${email}&type=student`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove student');
      fetchDashboardData();
      showAlert('Student account removed successfully.', 'Success');
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileSuccess('');

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setProfileSuccess('Institution profile updated successfully!');
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-accent-teal rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider text-text-muted">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-background flex flex-col justify-between relative z-10">
      
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2.5 text-lg font-heading font-black tracking-wider text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center">
            {institution?.logo_url ? (
              <img src={institution.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <GraduationCap className="text-white w-4 h-4" />
            )}
          </div>
          <span className="truncate max-w-[200px] sm:max-w-none">{institution?.name || 'Institute Dashboard'}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      {/* Main Tab Controller Header */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 mt-24">
        <div className="flex border-b border-white/5 gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: Building },
            { id: 'teachers', label: 'Teachers', icon: Users },
            { id: 'students', label: 'Students', icon: GraduationCap },
            { id: 'profile', label: 'Institution Profile', icon: Globe }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setAddTeacherSuccess('');
                  setAddStudentSuccess('');
                  setProfileSuccess('');
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id 
                    ? 'border-b-2 border-accent-teal text-white' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full mt-4 mb-8">
        <AnimatePresence mode="wait">
          
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Stats overview */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Total Teachers</p>
                      <p className="text-3xl font-black mt-2 text-white">{teachers.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-sky-400" />
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Total Students</p>
                      <p className="text-3xl font-black mt-2 text-white">{students.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-accent-teal/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-accent-teal" />
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl space-y-4 shadow-lg">
                  <h3 className="font-heading font-black text-lg">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab('teachers')}
                      className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center hover:bg-white/5 transition-colors cursor-pointer text-xs font-bold"
                    >
                      Manage Teachers
                    </button>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center hover:bg-white/5 transition-colors cursor-pointer text-xs font-bold"
                    >
                      Manage Students
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center hover:bg-white/5 transition-colors cursor-pointer text-xs font-bold"
                    >
                      Institution Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Institution details panel */}
              <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl space-y-4 h-fit shadow-lg">
                <h3 className="font-heading font-black text-lg border-b border-white/5 pb-2">Institution Specs</h3>
                <div className="space-y-3 text-xs leading-relaxed text-text-muted">
                  <div>
                    <span className="font-bold text-white block">Tenant Code</span>
                    <span className="font-mono text-sky-400 text-xs uppercase">{institution?.institution_code}</span>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Official Email</span>
                    <span>{institution?.email}</span>
                  </div>
                  {institution?.phone && (
                    <div>
                      <span className="font-bold text-white block">Phone</span>
                      <span>{institution.phone}</span>
                    </div>
                  )}
                  {institution?.website && (
                    <div>
                      <span className="font-bold text-white block">Website</span>
                      <a href={institution.website} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                        {institution.website}
                      </a>
                    </div>
                  )}
                  {institution?.address && (
                    <div>
                      <span className="font-bold text-white block">Address</span>
                      <span>{institution.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'teachers' && (
            <motion.div
              key="teachers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-heading font-black mb-2">Manage Teachers</h1>
                  <p className="text-text-muted text-sm">Add or remove moderators who construct exams and evaluate student performance.</p>
                </div>

                {teachers.length === 0 ? (
                  <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                    No teachers registered. Add one using the form on the right.
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4">Teacher Email ID</th>
                          <th className="p-4 w-32 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {teachers.map((teacher) => (
                          <tr key={teacher.email} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-bold">{teacher.email}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteTeacher(teacher.email)}
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
                )}
              </div>

              <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl space-y-6 h-fit shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                    <UserPlus className="text-accent-teal w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg">Add Teacher</h3>
                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider">MODERATOR ACCOUNT</p>
                  </div>
                </div>

                <form onSubmit={handleAddTeacher} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-text-subtle absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="teacher@school.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-text-subtle absolute left-3 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={5}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {addTeacherSuccess && (
                    <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4" />
                      {addTeacherSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingTeacher}
                    className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {submittingTeacher ? 'Adding Teacher...' : 'Add Teacher Account'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-heading font-black mb-2">Manage Students</h1>
                  <p className="text-text-muted text-sm">Add or remove student accounts registered in your institution.</p>
                </div>

                {students.length === 0 ? (
                  <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                    No students registered. Add one using the form on the right.
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4">Student Name</th>
                          <th className="p-4">Email ID</th>
                          <th className="p-4">Mobile</th>
                          <th className="p-4 w-32 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {students.map((student) => (
                          <tr key={student.email} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-bold">{student.name}</td>
                            <td className="p-4">{student.email}</td>
                            <td className="p-4 font-mono text-xs">{student.mob}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteStudent(student.email)}
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
                )}
              </div>

              <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl space-y-6 h-fit shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                    <UserPlus className="text-accent-teal w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg">Add Student</h3>
                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider">CANDIDATE ACCOUNT</p>
                  </div>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Gender *</label>
                      <select
                        value={studentForm.gender}
                        onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white cursor-pointer"
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">College / Class *</label>
                      <input
                        type="text"
                        required
                        value={studentForm.college}
                        onChange={(e) => setStudentForm({...studentForm, college: e.target.value})}
                        placeholder="Class / Dept"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Email ID *</label>
                    <input
                      type="email"
                      required
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                      placeholder="rahul@school.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      minLength="10"
                      required
                      value={studentForm.mob}
                      onChange={(e) => setStudentForm({...studentForm, mob: e.target.value})}
                      placeholder="10-digit number"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Temporary Password *</label>
                    <div className="relative">
                      <input
                        type={showStudentPassword ? "text" : "password"}
                        required
                        minLength={5}
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {addStudentSuccess && (
                    <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4" />
                      {addStudentSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingStudent}
                    className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {submittingStudent ? 'Adding Student...' : 'Add Student Account'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Institution Profile</h1>
                <p className="text-text-muted text-sm">Review or customize your institution specs and contact credentials.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Institution Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      placeholder="Name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Institution Code</label>
                    <input
                      type="text"
                      disabled
                      value={institution?.institution_code || ''}
                      className="w-full bg-white/2 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-text-subtle font-mono uppercase cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Official Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="e.g. +917619329863"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Website URL</label>
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                      placeholder="e.g. https://my-school.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Institution Logo URL</label>
                  <input
                    type="url"
                    value={profileForm.logoUrl}
                    onChange={(e) => setProfileForm({...profileForm, logoUrl: e.target.value})}
                    placeholder="e.g. https://logo.com/logo.png"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Physical Address</label>
                  <textarea
                    rows={3}
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                    placeholder="Physical address specs..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white resize-none"
                  />
                </div>

                {profileSuccess && (
                  <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" />
                    {profileSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {updatingProfile ? 'Saving profile changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-text-muted text-[10px] tracking-widest mt-auto">
        <p>e-EXAMINER &copy; 2026. ALL RIGHTS RESERVED.</p>
      </footer>

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
