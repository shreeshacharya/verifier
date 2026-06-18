
import React, { useState, useRef } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Search, 
  Filter, 
  FileUp,
  Download, 
  GraduationCap,
  School,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Lock,
  LogIn,
  ShieldCheck
} from 'lucide-react';

const AdminDashboard = ({ db, setDb }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importStats, setImportStats] = useState(null);
  const fileInputRef = useRef(null);
  
  const [newRecord, setNewRecord] = useState({
    studentName: '',
    degreeName: '',
    institution: '',
    graduationYear: new Date().getFullYear(),
    certificateId: '',
    status: 'active'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError(data.message || 'Invalid institutional credentials.');
      }
    } catch (error) {
      setLoginError('Connection to server failed.');
    }
  };

  const downloadTemplate = () => {
    const csvContent = "register_number,student_name,semester,exam_month_year,total_marks,class_or_result,college\n4MW22CS183,VINYAS,6,JUL-2025,,PASS,VTU\n4MW22CS145,Mohammed Ali,6,JUL-2025,,PASS,VTU";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "vericert_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRecord.studentName || !newRecord.certificateId) return;

    const record = {
      ...newRecord,
      id: Math.random().toString(36).substr(2, 9),
      issueDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      if (response.ok) {
        setDb(prev => [record, ...prev]);
        setNewRecord({
          studentName: '',
          degreeName: '',
          institution: '',
          graduationYear: new Date().getFullYear(),
          certificateId: '',
          status: 'active'
        });
        setShowAddForm(false);
        setImportStats({ count: 1, msg: 'Individual student record added.' });
      }
    } catch (error) {
      console.error('Failed to add record:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDb(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const newRecords = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });

        const certId = row['register_number'] || row['usn'];
        const name = row['student_name'];
        const college = row['college'];
        const sem = row['semester'];
        const dateStr = row['exam_month_year'];
        const marks = row['total_marks'];
        const res = row['class_or_result'];

        let year = new Date().getFullYear();
        if (dateStr) {
          const match = dateStr.match(/\d{4}/);
          if (match) year = parseInt(match[0]);
        }

        if (name && certId) {
          newRecords.push({
            id: Math.random().toString(36).substr(2, 9),
            studentName: name,
            degreeName: sem ? `Semester ${sem}` : 'University Result',
            institution: college || 'University',
            certificateId: certId,
            graduationYear: year,
            issueDate: dateStr || '',
            status: 'active',
            semester: sem,
            totalMarks: marks,
            resultStatus: res
          });
        }
      }

      if (newRecords.length > 0) {
        setDb(prev => [...newRecords, ...prev]);
        setImportStats({ count: newRecords.length, msg: `Imported ${newRecords.length} student records successfully.` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in fade-in duration-500">
        <div className="w-full max-w-md bg-white p-10 rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-slate-900 p-4 rounded-3xl mb-4">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Institutional Access</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Admin login required to manage records.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Username</label>
              <input 
                type="text"
                required
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium"
                placeholder="Institutional ID"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Password</label>
              <input 
                type="password"
                required
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
            {loginError && (
              <p className="text-xs text-red-500 font-bold flex items-center bg-red-50 p-3 rounded-xl">
                <AlertCircle size={14} className="mr-2" />
                {loginError}
              </p>
            )}
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center space-x-2 mt-4 shadow-lg shadow-slate-200"
            >
              <LogIn size={20} />
              <span>LOGIN TO PORTAL</span>
            </button>
          </form>
          
          <p className="text-center text-[10px] text-slate-400 mt-8 leading-relaxed font-bold uppercase tracking-widest">
            Log in with: shreesha / password
          </p>
        </div>
      </div>
    );
  }

  const filteredDb = db.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.certificateId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">University Registry</h1>
          <p className="text-slate-500 text-sm font-medium">Manage student result sheets and verified credentials.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all text-xs font-bold"
          >
            <Download size={14} />
            <span>Format CSV</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 text-xs font-bold"
          >
            <FileUp size={14} />
            <span>Bulk Import</span>
          </button>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-500 px-4 py-2 rounded-xl hover:text-red-500 hover:border-red-100 transition-all text-xs font-bold"
          >
            <span>Logout</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCsvUpload} />
        </div>
      </div>

      {importStats && (
        <div className={`p-4 rounded-2xl flex items-center justify-between bg-green-50 border border-green-100 text-green-800 animate-in slide-in-from-top-4`}>
          <div className="flex items-center space-x-3">
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold">{importStats.msg}</span>
          </div>
          <button onClick={() => setImportStats(null)}><X size={16} /></button>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search USN or Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold transition-all"
            />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 text-slate-900 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-colors"
          >
            <PlusCircle size={18} />
            <span>Manual Entry</span>
          </button>
        </div>

        {showAddForm && (
          <div className="p-8 bg-slate-50/50 border-b border-slate-100 animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Add Single Student</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                placeholder="Student Name" required
                value={newRecord.studentName}
                onChange={e => setNewRecord({...newRecord, studentName: e.target.value})}
                className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold"
              />
              <input 
                placeholder="USN / Register No" required
                value={newRecord.certificateId}
                onChange={e => setNewRecord({...newRecord, certificateId: e.target.value})}
                className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-mono font-bold"
              />
              <input 
                placeholder="University" required
                value={newRecord.institution}
                onChange={e => setNewRecord({...newRecord, institution: e.target.value})}
                className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold"
              />
              <button type="submit" className="md:col-span-3 bg-slate-900 text-white font-black rounded-2xl py-4 text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg">
                Save to Registry
              </button>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-10 py-5">Register No (USN)</th>
                <th className="px-10 py-5">Student</th>
                <th className="px-10 py-5">Sem</th>
                <th className="px-10 py-5">Status</th>
                <th className="px-10 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDb.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-10 py-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-mono font-black border border-blue-100 shadow-sm">
                      {record.certificateId}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="font-black text-slate-900 text-sm tracking-tight">{record.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{record.institution}</div>
                  </td>
                  <td className="px-10 py-6 text-sm text-slate-900 font-black">
                    {record.semester || '-'}
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      record.resultStatus?.toLowerCase().includes('pass') || record.resultStatus?.toLowerCase().includes('distinc')
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {record.resultStatus || 'VALID'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
