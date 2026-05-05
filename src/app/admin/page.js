"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, UserPlus, Trash2, LogOut, ShieldAlert, Mail, Lock,
  GraduationCap, CheckCircle, HelpCircle, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New teacher form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const fetchTeachers = async () => {
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
      setTeachers(json.teachers);
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAddSuccess('');

    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add teacher');
      
      setAddSuccess('Teacher added successfully!');
      setNewEmail('');
      setNewPassword('');
      fetchTeachers();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (email) => {
    const confirmed = await showConfirm(`Are you sure you want to remove teacher: ${email}?`, 'Confirm Action');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/dashboard?email=${email}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove teacher');
      fetchTeachers();
      showAlert('Teacher account removed successfully.', 'Success');
    } catch (err) {
      showAlert(err.message, 'Error');
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
            <GraduationCap className="text-white w-4 h-4" />
          </div>
          <span>The Creator Dashboard</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-12 mt-24 mb-8">
        
        {/* Left 2 Columns: Teachers List */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-black mb-2">Manage Teachers</h1>
            <p className="text-text-muted text-sm">Add or remove academic moderators who supervise quiz creating and student tracking.</p>
          </div>

          {teachers.length === 0 ? (
            <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted">
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

        {/* Right 1 Column: Add Teacher Form */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-xl space-y-6">
            <h3 className="text-xl font-heading font-bold text-accent-teal-light flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent-teal" />
              Add Teacher
            </h3>
            
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Teacher Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-text-subtle" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter teacher email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-text-muted">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-text-subtle" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                  />
                </div>
              </div>

              {addSuccess && <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2 rounded-lg flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{addSuccess}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent-teal/20 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Teacher Account'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-text-muted text-[10px] tracking-widest">
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
