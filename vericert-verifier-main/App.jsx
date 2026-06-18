
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  LayoutDashboard, 
  Info, 
  FileCheck, 
  Upload, 
  History, 
  Settings,
  Menu,
  X,
  PlusCircle,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileX
} from 'lucide-react';

import Verifier from './components/Verifier';
import AdminDashboard from './components/AdminDashboard';

const SidebarItem = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const App = () => {
  const [db, setDb] = useState([
    {
      id: 'vtu-1',
      certificateId: '4MW22CS145',
      studentName: 'Mohammed Ali',
      degreeName: 'Bachelor of Engineering',
      institution: 'VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI',
      graduationYear: 2025,
      issueDate: '2025-07-20',
      status: 'active',
      semester: '6',
      resultStatus: 'PASS'
    },
    {
      id: 'vtu-2',
      certificateId: '4MW22CS183',
      studentName: 'VINYAS',
      degreeName: 'Bachelor of Engineering',
      institution: 'VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI',
      graduationYear: 2025,
      issueDate: '2025-07-20',
      status: 'active',
      semester: '6',
      resultStatus: 'PASS'
    },
    {
      id: 'puc-1',
      certificateId: '661281',
      studentName: 'SHREESHA',
      degreeName: 'Pre-University Certificate',
      institution: 'JNANAGANGA PU COLLEGE',
      graduationYear: 2022,
      issueDate: '2022-04-15',
      status: 'active',
      semester: 'PUC2',
      resultStatus: 'DISTINCTION'
    }
  ]);
  const loading = false;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium">Connecting to Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout db={db} setDb={setDb} />
    </HashRouter>
  );
};

const Layout = ({ db, setDb }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">VeriCert</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem to="/" icon={<Search size={20} />} label="Verify Degree" active={isActive('/')} />
          <SidebarItem to="/admin" icon={<LayoutDashboard size={20} />} label="Institution Admin" active={isActive('/admin')} />
          <SidebarItem to="/about" icon={<Info size={20} />} label="How it Works" active={isActive('/about')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Status</p>
            <p className="text-sm text-slate-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              AI Core Online
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="text-blue-600 w-6 h-6" />
          <span className="text-lg font-bold">VeriCert</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-16 px-6 space-y-4">
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className="block py-4 border-b text-lg font-medium">Verify Degree</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className="block py-4 border-b text-lg font-medium">Admin Panel</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/about" className="block py-4 text-lg font-medium">About System</Link>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-20 md:pt-10">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Verifier db={db} />} />
            <Route path="/admin" element={<AdminDashboard db={db} setDb={setDb} />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const About = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="text-center max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Securing the Future of Credentials</h1>
      <p className="text-slate-600 leading-relaxed">
        VeriCert uses advanced Gemini AI vision models to bridge the gap between physical certificates and digital trust.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      {[
        {
          title: "AI Vision Scan",
          desc: "Our models perform sub-pixel analysis to detect font inconsistencies and digital manipulation often missed by the human eye.",
          icon: <Search className="text-blue-600" />
        },
        {
          title: "Database Cross-Check",
          desc: "Extracted data is instantly matched against encrypted institution records to ensure the credential was actually issued.",
          icon: <Database className="text-green-600" />
        },
        {
          title: "Tamper Proofing",
          desc: "Identify unauthorized changes to graduation years, names, or grades with specialized forensic analysis tools.",
          icon: <ShieldCheck className="text-purple-600" />
        }
      ].map((feature, i) => (
        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
            {feature.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default App;
