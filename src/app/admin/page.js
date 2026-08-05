"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, UserPlus, Trash2, LogOut, ShieldAlert, Mail, Lock,
  GraduationCap, CheckCircle, HelpCircle, Sparkles, Building, Globe, MapPin, Phone,
  Plus, Search, ArrowRight, Eye, EyeOff, CheckSquare, Users, BookOpen, Calendar, GitBranch, ChevronRight, UploadCloud
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'teachers' | 'students' | 'profile'
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);

  // Phase 2 state
  const [academicYears, setAcademicYears] = useState([]);
  const [activeYearId, setActiveYearId] = useState('');
  const [academicUnits, setAcademicUnits] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [academicSubTab, setAcademicSubTab] = useState('years'); // 'years' | 'structure' | 'sections' | 'subjects' | 'teachers' | 'students' | 'wizard'
  
  // Leaderboard settings
  const [settings, setSettings] = useState({
    timezone: 'Asia/Kolkata',
    leaderboard_enabled: true,
    leaderboard_level_exam: true,
    leaderboard_level_subject: true,
    leaderboard_level_section: true,
    leaderboard_level_unit: true,
    student_visibility: 'FULL_LEADERBOARD',
    top_n_count: 10,
    min_qualifying_exams: 3,
    multiple_attempts_rule: 'BEST_ATTEMPT'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Modals state for Academic Setup
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '', status: 'active' });
  
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [addUnitParentId, setAddUnitParentId] = useState(null);
  const [addUnitType, setAddUnitType] = useState('CLASS');
  const [addUnitName, setAddUnitName] = useState('');

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', capacity: '', academicUnitId: '' });

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjectFormFields, setSubjectFormFields] = useState({ id: '', name: '', code: '', description: '', academicUnitIds: [] });

  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ teacherId: '', academicUnitId: '', sectionId: '', subjectId: '' });

  const [showEnrollStudentsModal, setShowEnrollStudentsModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ academicUnitId: '', sectionId: '', selectedStudentIds: [] });

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

  // Bulk Import Student & Teacher States
  const [showStudentImportModal, setShowStudentImportModal] = useState(false);
  const [studentImportPreview, setStudentImportPreview] = useState(null);
  const [studentImportRows, setStudentImportRows] = useState([]);
  const [generatedStudentCreds, setGeneratedStudentCreds] = useState(null);

  const [showTeacherImportModal, setShowTeacherImportModal] = useState(false);
  const [teacherImportPreview, setTeacherImportPreview] = useState(null);
  const [teacherImportRows, setTeacherImportRows] = useState([]);
  const [generatedTeacherCreds, setGeneratedTeacherCreds] = useState(null);

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
        if (res.status === 403) {
          const json = await res.json();
          if (json.error && json.error.includes('Password change required')) {
            router.push('/change-password');
            return;
          }
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

  const handleStudentCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }

        setLoading(true);
        const res = await fetch('/api/admin/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preview', rows })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to parse student CSV');
        setStudentImportPreview(json.preview);
        setStudentImportRows(json.preview.rows || []);
      } catch (err) {
        showAlert(err.message, 'File Error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmStudentImport = async () => {
    if (!studentImportRows || studentImportRows.length === 0) return;
    const validRows = studentImportRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      showAlert('No valid student rows found.', 'Error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', rows: validRows })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to import students');
      setGeneratedStudentCreds(json.credentials || []);
      showAlert(`Imported student accounts successfully! Please copy their credentials below.`, 'Completed');
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Import Error');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }

        setLoading(true);
        const res = await fetch('/api/admin/teachers/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preview', rows })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to parse teacher CSV');
        setTeacherImportPreview(json.preview);
        setTeacherImportRows(json.preview.rows || []);
      } catch (err) {
        showAlert(err.message, 'File Error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmTeacherImport = async () => {
    if (!teacherImportRows || teacherImportRows.length === 0) return;
    const validRows = teacherImportRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      showAlert('No valid teacher rows found.', 'Error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/teachers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', rows: validRows })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to import teachers');
      setGeneratedTeacherCreds(json.credentials || []);
      showAlert(`Imported teacher accounts successfully! Please copy their credentials below.`, 'Completed');
      fetchDashboardData();
    } catch (err) {
      showAlert(err.message, 'Import Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('/api/admin/academic-years');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAcademicYears(data.years);
          const active = data.years.find(y => y.status === 'active');
          if (active) {
            setActiveYearId(active.id);
          } else if (data.years.length > 0) {
            setActiveYearId(data.years[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching years:', err);
    }
  };

  const fetchAcademicDetails = async (yearId) => {
    if (!yearId) return;
    try {
      const resUnits = await fetch(`/api/admin/academic-units?academicYearId=${yearId}`);
      if (resUnits.ok) {
        const du = await resUnits.json();
        if (du.success) setAcademicUnits(du.units);
      }

      const resSec = await fetch(`/api/admin/sections?academicYearId=${yearId}`);
      if (resSec.ok) {
        const ds = await resSec.json();
        if (ds.success) setSections(ds.sections);
      }

      const resSubs = await fetch(`/api/admin/subjects?academicYearId=${yearId}`);
      if (resSubs.ok) {
        const ds = await resSubs.json();
        if (ds.success) setSubjects(ds.subjects);
      }

      const resAssigns = await fetch(`/api/admin/teacher-assignments?academicYearId=${yearId}`);
      if (resAssigns.ok) {
        const da = await resAssigns.json();
        if (da.success) setTeacherAssignments(da.assignments);
      }

      const resEnroll = await fetch(`/api/admin/student-enrollments?academicYearId=${yearId}`);
      if (resEnroll.ok) {
        const de = await resEnroll.json();
        if (de.success) setStudentEnrollments(de.enrollments);
      }
    } catch (err) {
      console.error('Error fetching academic details:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      showAlert('Institution leaderboard and timezone settings saved successfully.', 'Success');
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAcademicYears();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeYearId) {
      fetchAcademicDetails(activeYearId);
    } else {
      setAcademicUnits([]);
      setSections([]);
      setSubjects([]);
      setTeacherAssignments([]);
      setStudentEnrollments([]);
    }
  }, [activeYearId]);

  const handleCreateYear = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yearForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create academic year');
      
      showAlert('Academic Year created successfully!', 'Success');
      setShowAddYearModal(false);
      setYearForm({ name: '', startDate: '', endDate: '', status: 'active' });
      fetchAcademicYears();
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleToggleYearStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    try {
      const targetYear = academicYears.find(y => y.id === id);
      if (!targetYear) return;
      const res = await fetch('/api/admin/academic-years', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: targetYear.name,
          startDate: targetYear.start_date,
          endDate: targetYear.end_date,
          status: newStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update academic year');
      
      showAlert(`Academic Year status updated to ${newStatus}!`, 'Success');
      fetchAcademicYears();
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/academic-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addUnitName,
          type: addUnitType,
          academicYearId: activeYearId,
          parentId: addUnitParentId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create academic unit');

      showAlert('Academic unit created successfully!', 'Success');
      setShowAddUnitModal(false);
      setAddUnitName('');
      setAddUnitParentId(null);
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleDeleteUnit = async (id) => {
    const confirmDelete = await showConfirm('Are you sure you want to delete this academic unit? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/academic-units?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete academic unit');

      showAlert('Academic unit deleted successfully.', 'Success');
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sectionForm,
          academicYearId: activeYearId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create section');

      showAlert('Section created successfully!', 'Success');
      setShowAddSectionModal(false);
      setSectionForm({ name: '', capacity: '', academicUnitId: '' });
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleDeleteSection = async (id) => {
    const confirmDelete = await showConfirm('Are you sure you want to delete this section?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/sections?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete section');

      showAlert('Section deleted successfully.', 'Success');
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subjectFormFields.name,
          code: subjectFormFields.code,
          description: subjectFormFields.description,
          academicYearId: activeYearId,
          academicUnitIds: subjectFormFields.academicUnitIds
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subject');

      showAlert('Subject created successfully!', 'Success');
      setShowAddSubjectModal(false);
      setSubjectFormFields({ id: '', name: '', code: '', description: '', academicUnitIds: [] });
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subjectFormFields.id,
          name: subjectFormFields.name,
          code: subjectFormFields.code,
          description: subjectFormFields.description,
          academicUnitIds: subjectFormFields.academicUnitIds
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subject');

      showAlert('Subject updated successfully!', 'Success');
      setShowAddSubjectModal(false);
      setSubjectFormFields({ id: '', name: '', code: '', description: '', academicUnitIds: [] });
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleDeleteSubject = async (id) => {
    const confirmDelete = await showConfirm('Are you sure you want to delete this subject?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete subject');

      showAlert('Subject deleted successfully.', 'Success');
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleCreateTeacherAssignment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assignForm,
          academicYearId: activeYearId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create teacher assignment');

      showAlert('Teacher assigned successfully!', 'Success');
      setShowAssignTeacherModal(false);
      setAssignForm({ teacherId: '', academicUnitId: '', sectionId: '', subjectId: '' });
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleDeleteTeacherAssignment = async (id) => {
    const confirmDelete = await showConfirm('Are you sure you want to remove this teacher assignment?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/teacher-assignments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove assignment');

      showAlert('Teacher assignment removed successfully.', 'Success');
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleEnrollStudents = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/student-enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: activeYearId,
          academicUnitId: enrollForm.academicUnitId,
          sectionId: enrollForm.sectionId,
          studentIds: enrollForm.selectedStudentIds
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll students');

      showAlert('Students enrolled successfully!', 'Success');
      setShowEnrollStudentsModal(false);
      setEnrollForm({ academicUnitId: '', sectionId: '', selectedStudentIds: [] });
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const handleApplyPreset = async (presetType) => {
    try {
      let presetUnits = [];
      if (presetType === 'school') {
        const classes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        presetUnits = classes.map((c, idx) => ({
          tempId: `class-${c}`,
          name: `Class ${c}`,
          type: 'CLASS',
          displayOrder: idx + 1,
          parentTempId: null
        }));
      } else if (presetType === 'puc') {
        presetUnits = [
          { tempId: '1puc', name: '1st PUC', type: 'YEAR', displayOrder: 1, parentTempId: null },
          { tempId: '2puc', name: '2nd PUC', type: 'YEAR', displayOrder: 2, parentTempId: null }
        ];
      } else if (presetType === 'university') {
        presetUnits = [
          { tempId: 'cse', name: 'Computer Science & Engineering', type: 'PROGRAM', displayOrder: 1, parentTempId: null },
          { tempId: 'aiml', name: 'Artificial Intelligence & Machine Learning', type: 'PROGRAM', displayOrder: 2, parentTempId: null }
        ];
        for (let i = 1; i <= 8; i++) {
          presetUnits.push({
            tempId: `cse-sem-${i}`,
            name: `Semester ${i}`,
            type: 'SEMESTER',
            displayOrder: i,
            parentTempId: 'cse'
          });
          presetUnits.push({
            tempId: `aiml-sem-${i}`,
            name: `Semester ${i}`,
            type: 'SEMESTER',
            displayOrder: i,
            parentTempId: 'aiml'
          });
        }
      }

      const res = await fetch('/api/admin/academic-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: activeYearId,
          presetUnits
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply preset structure');

      showAlert('Academic preset applied successfully!', 'Success');
      fetchAcademicDetails(activeYearId);
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const getSuggestedChildType = (parentType) => {
    switch (parentType) {
      case 'PROGRAM': return 'SEMESTER';
      case 'CLASS': return 'OTHER';
      case 'SEMESTER': return 'BATCH';
      case 'DEPARTMENT': return 'PROGRAM';
      default: return 'OTHER';
    }
  };

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

  const renderSetupWizard = () => {
    return (
      <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Sparkles className="w-8 h-8 text-accent-teal mx-auto animate-pulse" />
          <h2 className="text-xl font-bold font-heading">Set Up Academic Structure</h2>
          <p className="text-xs text-text-muted">
            Configure how your institution is organized. Choose a pre-defined template to get started instantly, or construct a custom hierarchy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Preset 1: School */}
          <div className="bg-white/3 border border-white/5 hover:border-accent-teal/50 rounded-2xl p-6 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-accent-teal" />
              </div>
              <h3 className="font-bold text-sm text-white">School (K-10)</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Ideal for primary and secondary schools. Sets up classes from Class 1 to Class 10 automatically.
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('school')}
              className="mt-6 w-full py-2 bg-accent-teal hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Apply School Preset
            </button>
          </div>

          {/* Preset 2: PU College */}
          <div className="bg-white/3 border border-white/5 hover:border-accent-teal/50 rounded-2xl p-6 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-accent-teal" />
              </div>
              <h3 className="font-bold text-sm text-white">PU College (11th & 12th)</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Pre-configures 1st PUC and 2nd PUC classes. Customize your streams later (e.g., PCMB, Commerce).
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('puc')}
              className="mt-6 w-full py-2 bg-accent-teal hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Apply PU College Preset
            </button>
          </div>

          {/* Preset 3: University */}
          <div className="bg-white/3 border border-white/5 hover:border-accent-teal/50 rounded-2xl p-6 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-accent-teal" />
              </div>
              <h3 className="font-bold text-sm text-white">College / University</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Configures dynamic Program majors (e.g., CSE, AIML) and dynamically maps Semesters 1 to 8.
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('university')}
              className="mt-6 w-full py-2 bg-accent-teal hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Apply University Preset
            </button>
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => {
              // Custom preset
              showAlert('Custom mode selected. You can now build your own hierarchy tree!', 'Info');
              // Insert a placeholder root unit
              handleCreateUnitPlaceholder();
            }}
            className="text-xs text-text-muted hover:text-white transition-colors underline cursor-pointer"
          >
            Or start with a blank custom structure
          </button>
        </div>
      </div>
    );
  };

  const handleCreateUnitPlaceholder = async () => {
    try {
      const res = await fetch('/api/admin/academic-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Main Campus',
          type: 'OTHER',
          academicYearId: activeYearId
        })
      });
      if (res.ok) {
        fetchAcademicDetails(activeYearId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderAcademicYearsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-white">Academic Years</h3>
          <button
            onClick={() => {
              setYearForm({ name: '', startDate: '', endDate: '', status: 'active' });
              setShowAddYearModal(true);
            }}
            className="px-4 py-2 bg-accent-teal hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent-teal/10"
          >
            <Plus className="w-4 h-4" /> Add Academic Year
          </button>
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/2 text-text-muted uppercase font-bold tracking-wider">
                <th className="p-4">Year Name</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {academicYears.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted font-semibold">
                    No academic years found. Create one to begin.
                  </td>
                </tr>
              ) : (
                academicYears.map(year => (
                  <tr key={year.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4 font-bold text-white">{year.name}</td>
                    <td className="p-4 text-text-muted">{new Date(year.start_date).toLocaleDateString()}</td>
                    <td className="p-4 text-text-muted">{new Date(year.end_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider ${
                        year.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-text-muted border border-white/10'
                      }`}>
                        {year.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleYearStatus(year.id, year.status)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          year.status === 'active' 
                            ? 'border-white/10 text-text-muted hover:text-white hover:bg-white/5' 
                            : 'border-accent-teal/20 text-accent-teal hover:bg-accent-teal/10'
                        }`}
                      >
                        {year.status === 'active' ? 'Archive' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderUnitTree = (parentId = null, depth = 0) => {
    const levelUnits = academicUnits.filter(u => u.parent_id === parentId);
    if (levelUnits.length === 0) return null;
    return (
      <div className="space-y-3 mt-3">
        {levelUnits.map(unit => (
          <div key={unit.id} className="border border-white/10 bg-white/2 rounded-2xl p-4 shadow-sm" style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-accent-teal" />
                <div>
                  <span className="text-xs font-bold text-white">{unit.name}</span>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-text-muted ml-2 font-mono uppercase tracking-wider">{unit.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAddUnitParentId(unit.id);
                    setAddUnitType(getSuggestedChildType(unit.type));
                    setAddUnitName('');
                    setShowAddUnitModal(true);
                  }}
                  className="text-[10px] text-accent-teal hover:underline font-bold cursor-pointer"
                >
                  + Add Sub-Unit
                </button>
                <span className="text-white/10">|</span>
                <button
                  onClick={() => handleDeleteUnit(unit.id)}
                  className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
            {/* Render nested children */}
            {renderUnitTree(unit.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  const renderAcademicStructureTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-white">Academic Units & Hierarchy</h3>
            <p className="text-[11px] text-text-muted">Manage classes, departments, programs, and semesters.</p>
          </div>
          <button
            onClick={() => {
              setAddUnitParentId(null);
              setAddUnitType('CLASS');
              setAddUnitName('');
              setShowAddUnitModal(true);
            }}
            className="px-4 py-2 bg-accent-teal hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent-teal/10"
          >
            <Plus className="w-4 h-4" /> Add Root Unit
          </button>
        </div>

        {academicUnits.length === 0 ? (
          renderSetupWizard()
        ) : (
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-lg">
            {renderUnitTree(null, 0)}
          </div>
        )}
      </div>
    );
  };

  const renderSectionsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-white">Sections</h3>
            <p className="text-[11px] text-text-muted">Define sections (A, B, C) for your classes or batches.</p>
          </div>
          <button disabled={academicUnits.length === 0} onClick={() => { setSectionForm({ name: '', capacity: '', academicUnitId: academicUnits[0]?.id || '' }); setShowAddSectionModal(true); }} className="px-4 py-2 bg-accent-teal hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent-teal/10 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </div>
        <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead><tr className="border-b border-white/10 bg-white/2 text-text-muted uppercase font-bold tracking-wider"><th className="p-4">Academic Unit</th><th className="p-4">Section Name</th><th className="p-4">Capacity</th><th className="p-4 text-right">Actions</th></tr></thead>
            <tbody>
              {sections.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-text-muted font-semibold">{academicUnits.length === 0 ? 'Set up your academic structure first.' : 'No sections created yet.'}</td></tr>
              ) : sections.map(sec => {
                const parentUnit = academicUnits.find(u => u.id === sec.academic_unit_id);
                return (
                  <tr key={sec.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4 font-bold text-white">{parentUnit?.name || 'Unknown'}</td>
                    <td className="p-4 text-text-muted">{sec.name}</td>
                    <td className="p-4 text-text-muted">{sec.capacity || '—'}</td>
                    <td className="p-4 text-right"><button onClick={() => handleDeleteSection(sec.id)} className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer">Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSubjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-base text-white">Subjects</h3>
        <button onClick={() => { setSubjectFormFields({ id: '', name: '', code: '', description: '', academicUnitIds: [] }); setShowAddSubjectModal(true); }} className="px-4 py-2 bg-accent-teal hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent-teal/10">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>
      <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="border-b border-white/10 bg-white/2 text-text-muted uppercase font-bold tracking-wider"><th className="p-4">Subject</th><th className="p-4">Code</th><th className="p-4">Mapped Units</th><th className="p-4 text-right">Actions</th></tr></thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-text-muted font-semibold">No subjects yet.</td></tr>
            ) : subjects.map(sub => (
              <tr key={sub.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="p-4 font-bold text-white">{sub.name}</td>
                <td className="p-4 text-text-muted font-mono">{sub.code || '—'}</td>
                <td className="p-4 text-text-muted text-[10px]">{(sub.mapped_units || []).filter(Boolean).map(uid => academicUnits.find(u => u.id === uid)?.name).filter(Boolean).join(', ') || '—'}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => { setSubjectFormFields({ id: sub.id, name: sub.name, code: sub.code || '', description: sub.description || '', academicUnitIds: (sub.mapped_units || []).filter(Boolean) }); setShowAddSubjectModal(true); }} className="text-[10px] text-sky-400 hover:underline font-bold cursor-pointer">Edit</button>
                  <button onClick={() => handleDeleteSubject(sub.id)} className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeacherAssignmentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-base text-white">Teacher Assignments</h3>
        <button disabled={teachers.length === 0 || academicUnits.length === 0 || subjects.length === 0} onClick={() => { setAssignForm({ teacherId: teachers[0]?.email || '', academicUnitId: academicUnits[0]?.id || '', sectionId: '', subjectId: subjects[0]?.id || '' }); setShowAssignTeacherModal(true); }} className="px-4 py-2 bg-accent-teal hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent-teal/10 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Assign Teacher
        </button>
      </div>
      <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="border-b border-white/10 bg-white/2 text-text-muted uppercase font-bold tracking-wider"><th className="p-4">Teacher</th><th className="p-4">Unit</th><th className="p-4">Section</th><th className="p-4">Subject</th><th className="p-4 text-right">Actions</th></tr></thead>
          <tbody>
            {teacherAssignments.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-muted font-semibold">No teacher assignments yet.</td></tr>
            ) : teacherAssignments.map(a => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="p-4 font-bold text-white">{a.teacher_id}</td>
                <td className="p-4 text-text-muted">{a.unit_name}</td>
                <td className="p-4 text-text-muted">{a.section_name || '—'}</td>
                <td className="p-4 text-text-muted">{a.subject_name}</td>
                <td className="p-4 text-right"><button onClick={() => handleDeleteTeacherAssignment(a.id)} className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStudentEnrollmentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-base text-white">Student Enrollments</h3>
        <button disabled={students.length === 0 || academicUnits.length === 0} onClick={() => { setEnrollForm({ academicUnitId: academicUnits[0]?.id || '', sectionId: '', selectedStudentIds: [] }); setShowEnrollStudentsModal(true); }} className="px-4 py-2 bg-accent-teal hover:bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent-teal/10 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Enroll Students
        </button>
      </div>
      <div className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="border-b border-white/10 bg-white/2 text-text-muted uppercase font-bold tracking-wider"><th className="p-4">Student</th><th className="p-4">Unit</th><th className="p-4">Section</th><th className="p-4">Status</th></tr></thead>
          <tbody>
            {studentEnrollments.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-text-muted font-semibold">No enrollments yet.</td></tr>
            ) : studentEnrollments.map(e => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="p-4 font-bold text-white">{e.student_name} <span className="text-text-muted font-normal text-[10px]">({e.student_id})</span></td>
                <td className="p-4 text-text-muted">{e.unit_name}</td>
                <td className="p-4 text-text-muted">{e.section_name || '—'}</td>
                <td className="p-4"><span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLeaderboardSettingsTab = () => {
    return (
      <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 max-w-2xl">
        <h2 className="text-xl font-heading font-black mb-1">Leaderboard & Timezone Settings</h2>
        <p className="text-text-muted text-xs mb-6">Manage how performance rankings and dates are resolved for your institution.</p>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Institution Timezone</label>
              <select 
                value={settings.timezone} 
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-teal/50"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Multiple Attempts Leaderboard Rule</label>
              <select 
                value={settings.multiple_attempts_rule} 
                onChange={(e) => setSettings({ ...settings, multiple_attempts_rule: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-teal/50"
              >
                <option value="BEST_ATTEMPT">Best Attempt (Highest Score)</option>
                <option value="FIRST_ATTEMPT">First Attempt Only</option>
                <option value="LATEST_ATTEMPT">Latest Attempt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Student Rankings Visibility</label>
              <select 
                value={settings.student_visibility} 
                onChange={(e) => setSettings({ ...settings, student_visibility: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-teal/50"
              >
                <option value="FULL_LEADERBOARD">Full Leaderboard (Show All)</option>
                <option value="TOP_N">Top N + My Rank (Restricted)</option>
                <option value="OWN_RANK_ONLY">Show My Rank Only</option>
                <option value="HIDDEN">Completely Hidden</option>
              </select>
            </div>

            {settings.student_visibility === 'TOP_N' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Top N Count</label>
                <input 
                  type="number" min="3" max="50"
                  value={settings.top_n_count} 
                  onChange={(e) => setSettings({ ...settings, top_n_count: parseInt(e.target.value) || 10 })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-teal/50"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Min Subject Qualifying Exams</label>
              <input 
                type="number" min="1" max="20"
                value={settings.min_qualifying_exams} 
                onChange={(e) => setSettings({ ...settings, min_qualifying_exams: parseInt(e.target.value) || 3 })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-teal/50"
              />
              <span className="text-[10px] text-text-muted">Minimum tests needed to show in Subject rankings.</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Leaderboard Level Toggles</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                <input 
                  type="checkbox"
                  checked={settings.leaderboard_enabled}
                  onChange={(e) => setSettings({ ...settings, leaderboard_enabled: e.target.checked })}
                  className="accent-accent-teal w-4 h-4"
                />
                <span className="text-xs text-white">Enable Leaderboards Globally</span>
              </label>

              <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                <input 
                  type="checkbox"
                  checked={settings.leaderboard_level_exam}
                  onChange={(e) => setSettings({ ...settings, leaderboard_level_exam: e.target.checked })}
                  className="accent-accent-teal w-4 h-4"
                />
                <span className="text-xs text-white">Individual Exam Leaderboards</span>
              </label>

              <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                <input 
                  type="checkbox"
                  checked={settings.leaderboard_level_subject}
                  onChange={(e) => setSettings({ ...settings, leaderboard_level_subject: e.target.checked })}
                  className="accent-accent-teal w-4 h-4"
                />
                <span className="text-xs text-white">Subject-Wise Cumulative Leaderboards</span>
              </label>

              <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                <input 
                  type="checkbox"
                  checked={settings.leaderboard_level_section}
                  onChange={(e) => setSettings({ ...settings, leaderboard_level_section: e.target.checked })}
                  className="accent-accent-teal w-4 h-4"
                />
                <span className="text-xs text-white">Section Leaderboards (e.g. 10th A)</span>
              </label>

              <label className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/5">
                <input 
                  type="checkbox"
                  checked={settings.leaderboard_level_unit}
                  onChange={(e) => setSettings({ ...settings, leaderboard_level_unit: e.target.checked })}
                  className="accent-accent-teal w-4 h-4"
                />
                <span className="text-xs text-white">Class/Semester Leaderboards (e.g. Grade 10)</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={savingSettings}
            className="w-full sm:w-auto bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white font-bold px-8 py-3 rounded-xl text-xs transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
          >
            {savingSettings ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    );
  };

  const renderAcademicTab = () => {
    const subTabs = [
      { id: 'years', label: 'Academic Years' },
      { id: 'structure', label: 'Structure' },
      { id: 'sections', label: 'Sections' },
      { id: 'subjects', label: 'Subjects' },
      { id: 'assign-teachers', label: 'Teacher Assignments' },
      { id: 'enroll-students', label: 'Student Enrollments' },
      { id: 'settings', label: 'Leaderboard Settings' },
    ];
    return (
      <div className="space-y-6">
        {academicYears.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Active Year:</span>
            <select value={activeYearId} onChange={(e) => setActiveYearId(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-teal/50">
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name} ({y.status})</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide border-b border-white/5">
          {subTabs.map(st => (
            <button key={st.id} onClick={() => setAcademicSubTab(st.id)} className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-t-xl whitespace-nowrap transition-all cursor-pointer ${academicSubTab === st.id ? 'text-white border-b-2 border-accent-teal' : 'text-text-muted hover:text-white'}`}>
              {st.label}
            </button>
          ))}
        </div>
        {academicSubTab === 'years' && renderAcademicYearsTab()}
        {academicSubTab === 'structure' && renderAcademicStructureTab()}
        {academicSubTab === 'sections' && renderSectionsTab()}
        {academicSubTab === 'subjects' && renderSubjectsTab()}
        {academicSubTab === 'assign-teachers' && renderTeacherAssignmentsTab()}
        {academicSubTab === 'enroll-students' && renderStudentEnrollmentsTab()}
        {academicSubTab === 'settings' && renderLeaderboardSettingsTab()}
      </div>
    );
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
            { id: 'academic', label: 'Academic Setup', icon: BookOpen },
            { id: 'teachers', label: 'Teachers', icon: Users },
            { id: 'students', label: 'Students', icon: GraduationCap },
            { id: 'profile', label: 'Institution Profile', icon: Globe },
            { id: 'change-password', label: 'Change Password', icon: Lock }
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

          {activeTab === 'academic' && (
            <motion.div
              key="academic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Academic Setup</h1>
                <p className="text-text-muted text-sm">Configure academic years, class structure, sections, subjects, teacher assignments and student enrollments.</p>
              </div>
              {renderAcademicTab()}
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
                <button
                  onClick={() => {
                    setTeacherImportPreview(null);
                    setTeacherImportRows([]);
                    setGeneratedTeacherCreds(null);
                    setShowTeacherImportModal(true);
                  }}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4 text-accent-teal" />
                  Bulk Import Teachers (CSV)
                </button>

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
                <button
                  onClick={() => {
                    setStudentImportPreview(null);
                    setStudentImportRows([]);
                    setGeneratedStudentCreds(null);
                    setShowStudentImportModal(true);
                  }}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4 text-accent-teal" />
                  Bulk Import Students (CSV)
                </button>

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

          {/* Modal: Bulk Import Teachers */}
          {showTeacherImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xl font-bold text-accent-teal">Bulk Import Teachers</h3>
                  <button
                    onClick={() => {
                      const headers = ['email', 'password'];
                      const sampleRow = ['"teacher1@school.com"', '"Temp@123"'];
                      const csv = [headers.join(','), sampleRow.join(',')].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'teacher_import_template.csv';
                      link.click();
                    }}
                    className="text-xs text-accent-teal-light hover:underline font-bold"
                  >
                    Download CSV Template
                  </button>
                </div>

                {generatedTeacherCreds ? (
                  <div className="space-y-4">
                    <p className="text-sm text-emerald-400 font-bold">✓ Teachers imported! Save these credentials now — passwords won&apos;t be shown again.</p>
                    <div className="border border-white/10 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/3 border-b border-white/10 text-text-muted uppercase font-bold">
                            <th className="p-3">Email</th>
                            <th className="p-3">Temp Password</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {generatedTeacherCreds.map((c, idx) => (
                            <tr key={idx} className="font-mono">
                              <td className="p-3 text-white">{c.email}</td>
                              <td className="p-3 text-amber-400">{c.password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={() => setShowTeacherImportModal(false)} className="w-full py-2.5 bg-accent-teal text-white text-xs font-bold rounded-xl">Close</button>
                  </div>
                ) : !teacherImportPreview ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
                    <UploadCloud className="w-12 h-12 text-text-muted" />
                    <div>
                      <p className="text-sm font-semibold">Upload teacher CSV file</p>
                      <p className="text-xs text-text-muted mt-1">Required columns: email, password</p>
                    </div>
                    <label className="px-4 py-2 bg-accent-teal hover:bg-accent-teal-light text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
                      Select CSV File
                      <input type="file" accept=".csv" onChange={handleTeacherCSVUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white/3 border border-white/5 p-3 rounded-xl">
                        <p className="text-xs text-text-muted">Total</p>
                        <p className="text-lg font-bold">{teacherImportPreview.summary?.total || teacherImportRows.length}</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-400">
                        <p className="text-xs">Valid</p>
                        <p className="text-lg font-bold">{teacherImportRows.filter(r => r.errors?.length === 0).length}</p>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400">
                        <p className="text-xs">Errors</p>
                        <p className="text-lg font-bold">{teacherImportRows.filter(r => r.errors?.length > 0).length}</p>
                      </div>
                    </div>
                    <div className="border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/3 border-b border-white/10 text-text-muted uppercase font-bold">
                            <th className="p-2.5">Row</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {teacherImportRows.map((r, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 text-text-muted">{idx + 1}</td>
                              <td className="p-2.5">{r.email}</td>
                              <td className="p-2.5">
                                {r.errors?.length > 0 ? (
                                  <span className="text-rose-400 font-bold">{r.errors[0]}</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">Ready</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <button onClick={() => setTeacherImportPreview(null)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold">Reset</button>
                      <div className="flex gap-2">
                        <button onClick={() => setShowTeacherImportModal(false)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold">Cancel</button>
                        <button
                          disabled={loading || teacherImportRows.filter(r => r.errors?.length === 0).length === 0}
                          onClick={handleConfirmTeacherImport}
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

          {/* Modal: Bulk Import Students */}
          {showStudentImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xl font-bold text-accent-teal">Bulk Import Students</h3>
                  <button
                    onClick={() => {
                      const headers = ['name', 'email', 'password', 'gender', 'mobile'];
                      const sampleRow = ['"Ali Ahmed"', '"ali@school.com"', '"Pass@123"', '"M"', '"9876543210"'];
                      const csv = [headers.join(','), sampleRow.join(',')].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'student_import_template.csv';
                      link.click();
                    }}
                    className="text-xs text-accent-teal-light hover:underline font-bold"
                  >
                    Download CSV Template
                  </button>
                </div>

                {generatedStudentCreds ? (
                  <div className="space-y-4">
                    <p className="text-sm text-emerald-400 font-bold">✓ Students imported! Save these credentials now — passwords won&apos;t be shown again.</p>
                    <div className="border border-white/10 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/3 border-b border-white/10 text-text-muted uppercase font-bold">
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Temp Password</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {generatedStudentCreds.map((c, idx) => (
                            <tr key={idx} className="font-mono">
                              <td className="p-3 text-white">{c.name}</td>
                              <td className="p-3 text-white">{c.email}</td>
                              <td className="p-3 text-amber-400">{c.password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={() => setShowStudentImportModal(false)} className="w-full py-2.5 bg-accent-teal text-white text-xs font-bold rounded-xl">Close</button>
                  </div>
                ) : !studentImportPreview ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
                    <UploadCloud className="w-12 h-12 text-text-muted" />
                    <div>
                      <p className="text-sm font-semibold">Upload student CSV file</p>
                      <p className="text-xs text-text-muted mt-1">Required columns: name, email, password, gender, mobile</p>
                    </div>
                    <label className="px-4 py-2 bg-accent-teal hover:bg-accent-teal-light text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
                      Select CSV File
                      <input type="file" accept=".csv" onChange={handleStudentCSVUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white/3 border border-white/5 p-3 rounded-xl">
                        <p className="text-xs text-text-muted">Total</p>
                        <p className="text-lg font-bold">{studentImportRows.length}</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-400">
                        <p className="text-xs">Valid</p>
                        <p className="text-lg font-bold">{studentImportRows.filter(r => r.errors?.length === 0).length}</p>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400">
                        <p className="text-xs">Errors</p>
                        <p className="text-lg font-bold">{studentImportRows.filter(r => r.errors?.length > 0).length}</p>
                      </div>
                    </div>
                    <div className="border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/3 border-b border-white/10 text-text-muted uppercase font-bold">
                            <th className="p-2.5">Row</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {studentImportRows.map((r, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 text-text-muted">{idx + 1}</td>
                              <td className="p-2.5">{r.name}</td>
                              <td className="p-2.5">{r.email}</td>
                              <td className="p-2.5">
                                {r.errors?.length > 0 ? (
                                  <span className="text-rose-400 font-bold">{r.errors[0]}</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">Ready</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <button onClick={() => setStudentImportPreview(null)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold">Reset</button>
                      <div className="flex gap-2">
                        <button onClick={() => setShowStudentImportModal(false)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold">Cancel</button>
                        <button
                          disabled={loading || studentImportRows.filter(r => r.errors?.length === 0).length === 0}
                          onClick={handleConfirmStudentImport}
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

          {activeTab === 'change-password' && (
            <motion.div
              key="change-password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md space-y-6"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Change Password</h1>
                <p className="text-text-muted text-sm">Update your secure account credentials regularly.</p>
              </div>

              <AdminChangePasswordForm />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-text-muted text-[10px] tracking-widest mt-auto">
        <p>e-EXAMINER &copy; 2026. ALL RIGHTS RESERVED.</p>
      </footer>

      {/* ========================= PHASE 2 MODALS ========================= */}

      {/* Add Year Modal */}
      <AnimatePresence>
        {showAddYearModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6">Create Academic Year</h3>
              <form onSubmit={handleCreateYear} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Name *</label>
                  <input required value={yearForm.name} onChange={e => setYearForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 2026-27" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Start Date *</label>
                    <input type="date" required value={yearForm.startDate} onChange={e => setYearForm(p => ({ ...p, startDate: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">End Date *</label>
                    <input type="date" required value={yearForm.endDate} onChange={e => setYearForm(p => ({ ...p, endDate: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Status</label>
                  <select value={yearForm.status} onChange={e => setYearForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowAddYearModal(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Unit Modal */}
      <AnimatePresence>
        {showAddUnitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6">{addUnitParentId ? 'Add Sub-Unit' : 'Add Top-Level Unit'}</h3>
              <form onSubmit={handleCreateUnit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Unit Type *</label>
                  <select value={addUnitType} onChange={e => setAddUnitType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    {['CLASS','GRADE','STANDARD','SEMESTER','YEAR','PROGRAM','STREAM','DEPARTMENT','BATCH','DIVISION','GROUP','TERM','MODULE','CUSTOM'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Name *</label>
                  <input required value={addUnitName} onChange={e => setAddUnitName(e.target.value)} placeholder="e.g. Class 10, B.Tech CSE, Semester 1" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowAddUnitModal(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Section Modal */}
      <AnimatePresence>
        {showAddSectionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6">Add Section</h3>
              <form onSubmit={handleCreateSection} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Academic Unit *</label>
                  <select required value={sectionForm.academicUnitId} onChange={e => setSectionForm(p => ({ ...p, academicUnitId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    {academicUnits.map(u => <option key={u.id} value={u.id}>{u.name} ({u.unit_type})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Section Name *</label>
                  <input required value={sectionForm.name} onChange={e => setSectionForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. A, B, C" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Capacity</label>
                  <input type="number" min="0" value={sectionForm.capacity} onChange={e => setSectionForm(p => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 60" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowAddSectionModal(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Subject Modal */}
      <AnimatePresence>
        {showAddSubjectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-black text-white mb-6">{subjectFormFields.id ? 'Edit Subject' : 'Add Subject'}</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Subject Name *</label>
                  <input required value={subjectFormFields.name} onChange={e => setSubjectFormFields(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mathematics" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Subject Code</label>
                  <input value={subjectFormFields.code} onChange={e => setSubjectFormFields(p => ({ ...p, code: e.target.value }))} placeholder="e.g. MATH101" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Description</label>
                  <textarea value={subjectFormFields.description} onChange={e => setSubjectFormFields(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional description" className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50 resize-none" />
                </div>
                {academicUnits.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Map to Academic Units</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {academicUnits.map(u => (
                        <label key={u.id} className="flex items-center gap-2 text-xs text-white cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                          <input type="checkbox" checked={subjectFormFields.academicUnitIds.includes(u.id)} onChange={e => {
                            if (e.target.checked) setSubjectFormFields(p => ({ ...p, academicUnitIds: [...p.academicUnitIds, u.id] }));
                            else setSubjectFormFields(p => ({ ...p, academicUnitIds: p.academicUnitIds.filter(id => id !== u.id) }));
                          }} className="accent-teal-500" />
                          {u.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowAddSubjectModal(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer">{subjectFormFields.id ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Teacher Modal */}
      <AnimatePresence>
        {showAssignTeacherModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-black text-white mb-6">Assign Teacher</h3>
              <form onSubmit={handleCreateTeacherAssignment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Teacher *</label>
                  <select required value={assignForm.teacherId} onChange={e => setAssignForm(p => ({ ...p, teacherId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.email} value={t.email}>{t.email}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Academic Unit *</label>
                  <select required value={assignForm.academicUnitId} onChange={e => setAssignForm(p => ({ ...p, academicUnitId: e.target.value, sectionId: '' }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    <option value="">Select Unit</option>
                    {academicUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Section (optional)</label>
                  <select value={assignForm.sectionId} onChange={e => setAssignForm(p => ({ ...p, sectionId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    <option value="">All Sections</option>
                    {sections.filter(s => s.academic_unit_id === assignForm.academicUnitId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Subject *</label>
                  <select required value={assignForm.subjectId} onChange={e => setAssignForm(p => ({ ...p, subjectId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowAssignTeacherModal(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer">Assign</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enroll Students Modal */}
      <AnimatePresence>
        {showEnrollStudentsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-black text-white mb-6">Enroll Students</h3>
              <form onSubmit={handleEnrollStudents} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Academic Unit *</label>
                  <select required value={enrollForm.academicUnitId} onChange={e => setEnrollForm(p => ({ ...p, academicUnitId: e.target.value, sectionId: '' }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    <option value="">Select Unit</option>
                    {academicUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Section (optional)</label>
                  <select value={enrollForm.sectionId} onChange={e => setEnrollForm(p => ({ ...p, sectionId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-accent-teal/50">
                    <option value="">No Section</option>
                    {sections.filter(s => s.academic_unit_id === enrollForm.academicUnitId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted uppercase font-bold">Select Students *</label>
                  <div className="max-h-48 overflow-y-auto bg-white/2 border border-white/5 rounded-xl p-2 space-y-1">
                    {students.length === 0 ? (
                      <p className="text-text-muted text-xs text-center py-4">No students in this institution yet.</p>
                    ) : students.map(st => (
                      <label key={st.email} className="flex items-center gap-2 text-xs text-white cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                        <input type="checkbox" checked={enrollForm.selectedStudentIds.includes(st.email)} onChange={e => {
                          if (e.target.checked) setEnrollForm(p => ({ ...p, selectedStudentIds: [...p.selectedStudentIds, st.email] }));
                          else setEnrollForm(p => ({ ...p, selectedStudentIds: p.selectedStudentIds.filter(id => id !== st.email) }));
                        }} className="accent-teal-500" />
                        {st.name || st.email} <span className="text-text-muted text-[10px]">({st.email})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowEnrollStudentsModal(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={enrollForm.selectedStudentIds.length === 0} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer disabled:opacity-50">Enroll ({enrollForm.selectedStudentIds.length})</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

function AdminChangePasswordForm() {
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
