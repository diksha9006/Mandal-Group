import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, Target, UserCheck, UserX, MapPin, Calendar as CalendarIcon, 
  Download, Building2, ClipboardList, TrendingUp, 
  Edit3, Save, X, Plus, Trash2, CheckCircle2, 
  AlertCircle, Activity, Gauge, Clock, BarChart3, Package,
  PieChart as PieIcon, LineChart as LineIcon, ChevronRight, Globe, Layers, Boxes, Loader2,
  Wrench, Activity as ActivityIcon, UserPlus, Pencil
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, 
  LineChart, Line, AreaChart, Area
} from 'recharts';

/** 
 * FIREBASE PRODUCTION CORE
 * Requires: npm install firebase
 */
import { db } from './firebase'; 
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

// --- PERMANENT CORE SECTIONS (Self-Healing Config) ---
const defaultSections = [
  { id: "SUMMARY", type: "system", name: "Executive Summary" },
  { id: "OVERVIEW", type: "system", name: "General Overview" },
  { id: "SAMBALPUR", type: "site", name: "Sambalpur", location: "Odisha", siteName: "Sambalpur Site" },
  { id: "MANAKSIA", type: "site", name: "Manaksia", location: "Handiya", siteName: "Manaksia Site" },
  { id: "RML_4", type: "site", name: "RML 4", location: "", siteName: "RML 4 Site" },
  { id: "RML_5", type: "site", name: "RML 5", location: "", siteName: "RML 5 Site" },
  { id: "RML_6", type: "site", name: "RML 6", location: "", siteName: "RML 6 Site" },
  { id: "TATA", type: "site", name: "TATA", location: "", siteName: "TATA Project" },
  { id: "TARAPUR", type: "site", name: "TARAPUR", location: "", siteName: "TARAPUR Site" },
  { id: "ANGUL", type: "site", name: "ANGUL", location: "", siteName: "ANGUL Site" },
  { id: "SHYAM_CRM", type: "site", name: "SHYAM CRM", location: "", siteName: "SHYAM CRM" },
  { id: "SHYAM_90MW", type: "site", name: "SHYAM 90MW", location: "", siteName: "SHYAM 90MW" },
  { id: "MEJIA", type: "site", name: "MEJIA", location: "", siteName: "MEJIA Site" },
  { id: "HSM", type: "site", name: "HSM", location: "", siteName: "HSM Site" }
];

const App = () => {
  // --- CORE STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('SUMMARY');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null); 
  const [password, setPassword] = useState("");
  const [sambalpurView, setSambalpurView] = useState('deployment'); 
  const [isLoading, setIsLoading] = useState(true);

  const [sections, setSections] = useState([]);
  const [dayToDayData, setDayToDayData] = useState({});
  const [newSectionForm, setNewSectionForm] = useState({ name: '', location: '', siteName: '' });

  // --- SELF-HEALING FIRESTORE REPAIR ---
  useEffect(() => {
    const configRef = doc(db, "mandal_erp", "config");
    const unsub = onSnapshot(configRef, (docSnap) => {
      let cloudSections = docSnap.exists() ? (docSnap.data().sections || []) : [];
      let isRepaired = false;
      const repairedSections = [...cloudSections];

      defaultSections.forEach(defaultSec => {
        if (!repairedSections.some(s => s.id === defaultSec.id)) {
          repairedSections.push(defaultSec);
          isRepaired = true;
        }
      });

      if (isRepaired || !docSnap.exists()) {
        setDoc(configRef, { sections: repairedSections }, { merge: true });
      }

      setSections(repairedSections);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const reportRef = doc(db, "daily_reports", selectedDate);
    const unsub = onSnapshot(reportRef, (docSnap) => {
      if (docSnap.exists()) {
        setDayToDayData(prev => ({ ...prev, [selectedDate]: docSnap.data().sites || {} }));
      } else {
        setDayToDayData(prev => ({ ...prev, [selectedDate]: {} }));
      }
    });
    return () => unsub();
  }, [selectedDate]);

  // --- DATA HELPERS ---
  const getDayData = useCallback((date, tabId) => {
    const day = dayToDayData[date] || {};
    const siteData = day[tabId] || {};
    
    // Default Data Structures
    const defaultEquipment = [
      { id: 1, name: "Crane Operator", qty: 5 }, { id: 2, name: "Welding Machine Arc", qty: 5 },
      { id: 3, name: "Hydra Operator", qty: 6 }, { id: 4, name: "Cutting Machine", qty: 7 },
      { id: 5, name: "Farana", qty: 4 }, { id: 6, name: "Plasma", qty: 5 },
      { id: 7, name: "Compressor", qty: 4 }, { id: 8, name: "Other Equipment", qty: 6 }
    ];
    const defaultWork = [
      { id: 1, name: "Fabrication Work", value: "-" }, { id: 2, name: "Erection Work", value: "-" },
      { id: 3, name: "Mechanical Work", value: "-" }, { id: 4, name: "Other Activity", value: "-" }
    ];
    const defaultManpowerDetail = [
      { id: 1, name: "Total Planned", qty: 0 }, { id: 2, name: "Present", qty: 0 },
      { id: 3, name: "Absent", qty: 0 }, { id: 4, name: "Skilled", qty: 0 },
      { id: 5, name: "Unskilled", qty: 0 }
    ];

    return {
      manpower: siteData.manpower || [],
      stock: siteData.stock || [{ id: 1, category: "Tools & Measuring", qty: 0 }, { id: 2, category: "Welding & Cutting", qty: 0 }, { id: 3, category: "Gas Cutting Items", qty: 0 }, { id: 4, category: "Electrical Items", qty: 0 }, { id: 5, category: "Safety Items", qty: 0 }, { id: 6, category: "Other", qty: 0 }],
      used: siteData.used || [],
      equipmentStatus: siteData.equipmentStatus || (tabId === 'SAMBALPUR' ? defaultEquipment : []),
      workProgress: siteData.workProgress || (tabId === 'SAMBALPUR' ? defaultWork : []),
      manpowerDetail: siteData.manpowerDetail || (tabId === 'SAMBALPUR' ? defaultManpowerDetail : []),
      meta: siteData.meta || { company: '', location: '', siteName: '' }
    };
  }, [dayToDayData]);

  const currentData = useMemo(() => getDayData(selectedDate, activeTab), [selectedDate, activeTab, getDayData]);
  const currentSite = useMemo(() => sections.find(s => s.id === activeTab), [sections, activeTab]);

  const updateActiveDayData = async (newData) => {
    const reportRef = doc(db, "daily_reports", selectedDate);
    const updatedDateMap = { ...(dayToDayData[selectedDate] || {}), [activeTab]: newData };
    await setDoc(reportRef, { sites: updatedDateMap });
  };

  const syncSectionsToCloud = async (newSections) => {
    await setDoc(doc(db, "mandal_erp", "config"), { sections: newSections }, { merge: true });
  };

  // --- ANALYTICS ENGINE ---
  const stats = useMemo(() => {
    return {
      required: (currentData.manpower || []).reduce((a, b) => a + (Number(b.required) || 0), 0),
      available: (currentData.manpower || []).reduce((a, b) => a + (Number(b.available) || 0), 0),
      stock: (currentData.stock || []).reduce((a, b) => a + (Number(b.qty) || 0), 0),
      used: (currentData.used || []).reduce((a, b) => a + (Number(b.qty) || 0), 0),
      equipment: (currentData.equipmentStatus || []).reduce((a, b) => a + (Number(b.qty) || 0), 0),
      workCount: (currentData.workProgress || []).length,
      manDetail: (currentData.manpowerDetail || []).reduce((a, b) => a + (Number(b.qty) || 0), 0)
    };
  }, [currentData]);

  const shortfall = stats.available - stats.required;
  const attendancePct = stats.required > 0 ? ((stats.available / stats.required) * 100).toFixed(1) : 0;

  const summaryStats = useMemo(() => {
    const siteSections = sections.filter(s => s.type === 'site');
    const sitesData = siteSections.map(site => {
      const data = getDayData(selectedDate, site.id);
      const req = (data.manpower || []).reduce((a, b) => a + (Number(b.required) || 0), 0);
      const avail = (data.manpower || []).reduce((a, b) => a + (Number(b.available) || 0), 0);
      const short = avail - req;
      const att = req > 0 ? (avail / req) * 100 : 0;
      let status = avail >= req ? 'Good' : Math.abs(short) <= 5 ? 'Medium' : 'Critical';
      return { id: site.id, company: data.meta?.company || site.name, siteName: data.meta?.siteName || site.location, location: data.meta?.location || site.location, required: req, available: avail, shortfall: short, attendance: att.toFixed(1), status };
    });
    const agg = sitesData.reduce((acc, curr) => ({ required: acc.required + curr.required, available: acc.available + curr.available, shortfall: acc.shortfall + curr.shortfall }), { required: 0, available: 0, shortfall: 0 });
    return { sites: sitesData, totals: agg, overallAtt: agg.required > 0 ? (agg.available / agg.required * 100).toFixed(1) : 0, overallStatus: agg.available >= agg.required ? 'Good' : 'Critical', count: sitesData.length };
  }, [sections, getDayData, selectedDate]);

  // --- CORE ACTIONS ---
  const handleAuth = () => {
    if (password === "D@1010") {
      setIsAdminMode(true);
      setIsAuthModalOpen(false); // Fix for black screen
      setPassword("");
    } else {
      alert("Incorrect Password");
    }
  };

  const saveEditedSection = () => {
    if (!editingSection) return;
    const oldId = editingSection.originalId || editingSection.id;
    const newId = editingSection.id.toUpperCase().replace(/\s+/g, "_");
    const updatedSections = sections.map(sec =>
      sec.id === oldId ? { ...sec, id: newId, name: editingSection.name, location: editingSection.location, siteName: editingSection.siteName } : sec
    );
    syncSectionsToCloud(updatedSections);
    if (activeTab === oldId) setActiveTab(newId);
    setEditingSection(null);
  };

  const deleteSection = (id) => {
    const target = sections.find(s => s.id === id);
    if (target?.type === 'system') { alert("System Tabs are Protected."); return; }
    if (window.confirm(`Delete ${id}?`)) {
      syncSectionsToCloud(sections.filter(s => s.id !== id));
      setActiveTab('SUMMARY');
    }
  };

  const addSection = () => {
    const id = newSectionForm.name.toUpperCase().replace(/\s+/g, '_');
    const updatedSections = [...sections, { id, type: 'site', ...newSectionForm }];
    syncSectionsToCloud(updatedSections);
    setIsAddSectionModalOpen(false);
    setActiveTab(id);
    setNewSectionForm({ name: '', location: '', siteName: '' });
  };

  // --- TABLE UPDATERS ---
  const updateManpower = (id, f, v) => updateActiveDayData({ ...currentData, manpower: currentData.manpower.map(r => r.id === id ? { ...r, [f]: (['required', 'available'].includes(f)) ? (parseInt(v) || 0) : v } : r) });
  const updateStock = (id, f, v) => updateActiveDayData({ ...currentData, stock: currentData.stock.map(r => r.id === id ? { ...r, [f]: f === 'qty' ? (parseInt(v) || 0) : v } : r) });
  const updateUsed = (id, f, v) => updateActiveDayData({ ...currentData, used: currentData.used.map(r => r.id === id ? { ...r, [f]: f === 'qty' ? (parseInt(v) || 0) : v } : r) });
  const updateEquipment = (id, f, v) => updateActiveDayData({ ...currentData, equipmentStatus: currentData.equipmentStatus.map(r => r.id === id ? { ...r, [f]: f === 'qty' ? (parseInt(v) || 0) : v } : r) });
  const updateWork = (id, f, v) => updateActiveDayData({ ...currentData, workProgress: currentData.workProgress.map(r => r.id === id ? { ...r, [f]: v } : r) });
  const updateManpowerDetail = (id, f, v) => updateActiveDayData({ ...currentData, manpowerDetail: currentData.manpowerDetail.map(r => r.id === id ? { ...r, [f]: f === 'qty' ? (parseInt(v) || 0) : v } : r) });
  const updateMeta = (f, v) => updateActiveDayData({ ...currentData, meta: { ...currentData.meta, [f]: v } });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]"><Loader2 className="animate-spin text-[#4e342e]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-6 lg:p-10 font-['Plus_Jakarta_Sans'] text-slate-700 overflow-x-hidden">
      
      {/* ADMIN AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-10 w-full max-w-sm shadow-2xl scale-in-center">
            <h3 className="text-xl font-black text-[#4e342e] mb-6 text-center">Admin Access</h3>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-6 text-center outline-none focus:border-[#8d6e63]" placeholder="••••" />
            <div className="flex gap-4">
                <button onClick={() => { setIsAuthModalOpen(false); setPassword(""); }} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                <button onClick={handleAuth} className="flex-1 py-3 bg-[#4e342e] text-white rounded-xl font-bold hover:bg-[#3e2723]">Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION EDIT MODAL */}
      {editingSection && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl scale-in-center border border-white/20">
             <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-[#4e342e]">Edit Site</h3><button onClick={() => setEditingSection(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button></div>
             <div className="space-y-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Company</label><input value={editingSection.name} onChange={e => setEditingSection({...editingSection, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border font-bold outline-none" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tab ID</label><input value={editingSection.id} onChange={e => setEditingSection({...editingSection, id: e.target.value.toUpperCase().replace(/\s+/g, '_')})} className="w-full p-4 bg-slate-50 rounded-2xl border font-bold outline-none" /></div>
             </div>
             <div className="flex gap-4 mt-8"><button onClick={() => setEditingSection(null)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button><button onClick={saveEditedSection} className="flex-1 py-4 bg-[#4e342e] text-white rounded-2xl font-black uppercase shadow-xl">Save Changes</button></div>
          </div>
        </div>
      )}

      {/* ADD SECTION MODAL */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl border border-white/20 scale-in-center">
             <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-[#4e342e]">Create New Section</h3><button onClick={() => setIsAddSectionModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button></div>
             <div className="space-y-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Company</label><input value={newSectionForm.name} onChange={e => setNewSectionForm({...newSectionForm, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-[#4e342e] font-bold" placeholder="e.g. Mandal Engineering" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Location</label><input value={newSectionForm.location} onChange={e => setNewSectionForm({...newSectionForm, location: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-[#4e342e] font-bold" placeholder="e.g. Odisha" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Site Name</label><input value={newSectionForm.siteName} onChange={e => setNewSectionForm({...newSectionForm, siteName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-[#4e342e] font-bold" placeholder="e.g. Sambalpur Site" /></div>
             </div>
             <div className="flex gap-4 mt-8"><button onClick={() => setIsAddSectionModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button><button onClick={addSection} className="flex-1 py-4 bg-[#4e342e] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Create Site</button></div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="relative bg-linear-to-br from-[#8d6e63] via-[#4e342e] to-[#3e2723] rounded-[40px] p-8 lg:p-12 mb-10 shadow-2xl flex flex-col md:flex-row justify-between items-center text-white border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
        <div className="relative z-10 flex items-center gap-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[28px] flex items-center justify-center text-4xl font-black">M</div>
          <div><h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-1">Daily Manpower Report</h1><p className="text-sm font-black tracking-[0.4em] text-amber-200/80 uppercase">MANDAL GROUP</p></div>
        </div>
        <div className="relative z-10 flex flex-col items-end gap-4">
          <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/10 flex flex-col items-end shadow-xl min-w-75">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-right"><p className="text-[10px] text-white/40 font-black uppercase mb-1">Prepared By</p><p className="text-sm font-black text-amber-100">Diksha Waghmare</p></div>
              <button onClick={() => isAdminMode ? setIsAdminMode(false) : setIsAuthModalOpen(true)} className={`p-3 rounded-2xl transition-all shadow-lg ${isAdminMode ? 'bg-emerald-500' : 'bg-white/20 hover:bg-white/30'}`}>{isAdminMode ? <CheckCircle2 size={20} /> : <Edit3 size={20} />}</button>
            </div>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white text-[#4e342e] font-black text-sm px-4 py-3 rounded-xl border-2 border-[#4e342e]/10 outline-none shadow-inner" />
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <div className="flex flex-wrap items-center gap-3 mb-10 bg-white/60 backdrop-blur-md p-3 rounded-4xl border border-white shadow-sm overflow-hidden">
        {sections.map((sec) => (
          <div key={sec.id} className="relative group">
            <button onClick={() => setActiveTab(sec.id)} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === sec.id ? 'bg-[#4e342e] text-white shadow-2xl scale-105' : 'text-slate-400 hover:bg-white'}`}>{sec.id}</button>
            {isAdminMode && sec.type === 'site' && (
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingSection({ ...sec, originalId: sec.id })} className="p-1.5 bg-amber-500 text-white rounded-full shadow-lg hover:scale-110"><Pencil size={10}/></button>
                <button onClick={() => deleteSection(sec.id)} className="p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110"><Trash2 size={10}/></button>
              </div>
            )}
          </div>
        ))}
        {isAdminMode && <button onClick={() => setIsAddSectionModalOpen(true)} className="ml-auto flex items-center gap-2 px-6 py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black hover:bg-amber-700 shadow-xl"><Plus size={16}/> Add Site</button>}
      </div>

      {/* CONTENT RENDERER */}
      {activeTab === 'SUMMARY' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
             {[{ l: "Total Sites", v: summaryStats.count, i: Globe, c: '#4e342e' }, { l: "Total Required", v: summaryStats.totals.required, i: Target, c: '#f97316' }, { l: "Total Available", v: summaryStats.totals.available, i: UserCheck, c: '#4ade80' }, { l: "Overall Shortfall", v: summaryStats.totals.shortfall, i: UserX, c: '#ef4444' }, { l: "Overall Attendance", v: `${summaryStats.overallAtt}%`, i: TrendingUp, c: '#166534' }].map((k, i) => {
               const Icon = k.i;
               return (
                <div key={i} className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm flex flex-col items-center group transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="p-3 rounded-xl mb-4 bg-slate-50 text-slate-500 group-hover:bg-[#4e342e] group-hover:text-white transition-colors"><Icon size={20}/></div>
                  <h2 className="text-3xl font-black mb-1" style={{ color: (k.l.includes('Shortfall') && k.v < 0) ? '#ef4444' : k.c }}>{k.v}</h2>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{k.l}</span>
                </div>
               );
             })}
           </div>
           <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden"><div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black text-[#4e342e] uppercase tracking-[0.2em] flex items-center gap-3"><Gauge size={22} /> Executive Performance Summary</h4></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 border-b border-slate-200">{['Sr.No', 'Company', 'Site Name', 'Req', 'Avail', 'Short', 'Att%', 'Status'].map(h => (<th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{h}</th>))}</tr></thead><tbody className="divide-y divide-slate-100">{summaryStats.sites.map((site, i) => (<tr key={site.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setActiveTab(site.id)}><td className="px-8 py-6 text-center font-black text-slate-300">{i + 1}</td><td className="px-8 py-6 text-center font-bold text-[#4e342e]">{site.company}</td><td className="px-8 py-6 text-center font-bold text-slate-600">{site.siteName}</td><td className="px-8 py-6 text-center font-black">{site.required}</td><td className="px-8 py-6 text-center font-black">{site.available}</td><td className={`px-8 py-6 text-center font-black ${site.shortfall < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{site.shortfall}</td><td className="px-8 py-6 text-center font-black text-slate-600">{site.attendance}%</td><td className="px-8 py-6 text-center"><span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: site.status === 'Good' ? '#4ade80' : site.status === 'Medium' ? '#f97316' : '#ef4444' }}>{site.status}</span></td></tr>))}</tbody><tfoot className="sticky bottom-0 bg-[#4e342e] text-white border-t-4 border-white/20 shadow-2xl"><tr className="font-black"><td colSpan="3" className="px-8 py-6 text-center uppercase tracking-widest text-[11px]">Organization Totals</td><td className="px-8 py-6 text-center text-xl">{summaryStats.totals.required}</td><td className="px-8 py-6 text-center text-xl">{summaryStats.totals.available}</td><td className={`px-8 py-6 text-center text-xl ${summaryStats.totals.shortfall < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{summaryStats.totals.shortfall}</td><td className="px-8 py-6 text-center text-xl">{summaryStats.overallAtt}%</td><td className="px-8 py-6 text-center"><span className="px-6 py-2 rounded-xl bg-white/20 border border-white/30 text-[10px]">VERIFIED</span></td></tr></tfoot></table></div></div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10"><div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm h-110 group hover:shadow-2xl transition-all"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><BarChart3 size={16} /> Site Benchmarking</h4><ResponsiveContainer width="100%" height="80%"><BarChart data={summaryStats.sites}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="id" tick={{fontSize: 10, fontWeight: 800}} /><YAxis hide /><Tooltip contentStyle={{borderRadius: '20px', border: 'none'}} /><Bar name="Req" dataKey="required" fill="#f97316" radius={[10, 10, 0, 0]} /><Bar name="Avail" dataKey="available" fill="#4ade80" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm h-110 group hover:shadow-2xl transition-all"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><PieIcon size={16} /> Organization Fulfillment</h4><ResponsiveContainer width="100%" height="80%"><PieChart><Pie data={[{name: 'Avail', value: summaryStats.totals.available}, {name: 'Gap', value: Math.abs(summaryStats.totals.shortfall)}]} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value"><Cell fill="#4ade80" /><Cell fill="#ef4444" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm h-110 group hover:shadow-2xl transition-all"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><LineIcon size={16} /> Attendance Velocity</h4><ResponsiveContainer width="100%" height="80%"><AreaChart data={summaryStats.sites.map(s => ({ n: s.id, v: parseFloat(s.attendance) }))}><defs><linearGradient id="summAttGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#166534" stopOpacity={0.3}/><stop offset="95%" stopColor="#166534" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="n" tick={{fontSize: 10, fontWeight: 800}} /><YAxis domain={[0, 100]} hide /><Tooltip /><Area type="monotone" name="Att%" dataKey="v" stroke="#166534" strokeWidth={4} fillOpacity={1} fill="url(#summAttGrad)" /></AreaChart></ResponsiveContainer></div></div>
        </div>
      ) : activeTab === 'OVERVIEW' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">{summaryStats.sites.map((site) => (<div key={site.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group" onClick={() => setActiveTab(site.id)}><div className="flex justify-between items-start mb-8"><div><h4 className="text-lg font-black text-[#4e342e] mb-1">{site.company}</h4><div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider"><MapPin size={12} /> {site.location}</div></div></div><div className="grid grid-cols-2 gap-y-6"><div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Required</p><p className="text-xl font-black">{site.required}</p></div><div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Available</p><p className="text-xl font-black text-emerald-500">{site.available}</p></div><div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Attendance</p><p className="text-xl font-black">{site.attendance}%</p></div><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${site.status === 'Good' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div><span className="text-[10px] font-black uppercase text-slate-400">{site.status}</span></div></div></div>))}</div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-500">
           {/* SITE HEADER */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-8"><div className="w-20 h-20 bg-[#4e342e] rounded-3xl flex items-center justify-center text-white shadow-2xl"><Building2 size={40} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-10"><div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company</label>{isAdminMode ? <input value={currentData.meta?.company || ''} onChange={e => updateMeta('company', e.target.value)} className="block bg-slate-50 border-b-2 border-dashed border-[#4e342e] font-black text-xl text-[#4e342e] outline-none" /> : <p className="text-xl font-black text-[#4e342e]">{currentData.meta?.company || currentSite?.name}</p>}</div><div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</label>{isAdminMode ? <input value={currentData.meta?.location || ''} onChange={e => updateMeta('location', e.target.value)} className="block bg-slate-50 border-b-2 border-dashed border-[#4e342e] font-black text-xl text-[#4e342e] outline-none" /> : <p className="text-xl font-black text-[#4e342e]">{currentData.meta?.location || currentSite?.location}</p>}</div><div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Name</label>{isAdminMode ? <input value={currentData.meta?.siteName || ''} onChange={e => updateMeta('siteName', e.target.value)} className="block bg-slate-50 border-b-2 border-dashed border-[#4e342e] font-black text-xl text-[#4e342e] outline-none" /> : <p className="text-xl font-black text-[#4e342e]">{currentData.meta?.siteName || currentSite?.siteName}</p>}</div></div></div>
              {activeTab === 'SAMBALPUR' && <button onClick={() => setSambalpurView(sambalpurView === 'material' ? 'deployment' : 'material')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase transition-all shadow-xl ${sambalpurView === 'material' ? 'bg-[#4e342e] text-white' : 'bg-white text-[#4e342e] border'}`}>{sambalpurView === 'material' ? 'Deployment View' : 'Material Hub'}</button>}
           </div>

           {sambalpurView === 'material' && activeTab === 'SAMBALPUR' ? (
              <div className="space-y-12 animate-in fade-in">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden"><div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black text-[#4e342e] uppercase flex items-center gap-3"><Package size={22} /> Closing Stock</h4>{isAdminMode && <button onClick={() => updateActiveDayData({...currentData, stock: [...currentData.stock, {id: Date.now(), category: 'New', qty: 0}]})} className="p-2 bg-[#4e342e] text-white rounded-lg"><Plus size={14}/></button>}</div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400"><th className="px-8 py-4 text-center">Sr No</th><th className="px-8 py-4">Category</th><th className="px-8 py-4 text-center">Qty</th>{isAdminMode && <th className="px-8 py-4 text-center">Action</th>}</tr></thead><tbody className="divide-y divide-slate-50">{currentData.stock.map((m, i) => (<tr key={m.id} className="hover:bg-slate-50/50"><td className="px-8 py-4 text-center font-black text-slate-300">{i+1}</td><td className="px-8 py-4 font-bold">{isAdminMode ? <input value={m.category} onChange={e => updateStock(m.id, 'category', e.target.value)} className="bg-slate-100 p-1 rounded w-full outline-none" /> : m.category}</td><td className="px-8 py-4 text-center font-black">{isAdminMode ? <input type="number" value={m.qty} onChange={e => updateStock(m.id, 'qty', e.target.value)} className="bg-slate-100 p-1 rounded w-20 text-center outline-none" /> : m.qty}</td>{isAdminMode && <td className="px-8 py-4 text-center"><button onClick={() => updateActiveDayData({...currentData, stock: currentData.stock.filter(x => x.id !== m.id)})} className="text-rose-500"><Trash2 size={16}/></button></td>}</tr>))}</tbody><tfoot className="bg-[#4e342e] text-white"><tr className="font-black"><td colSpan="2" className="px-8 py-4 uppercase text-[10px]">Total Closing Stock</td><td className="px-8 py-4 text-center">{stats.stock}</td>{isAdminMode && <td></td>}</tr></tfoot></table></div></div>
                    <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden"><div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black text-[#4e342e] uppercase flex items-center gap-3"><ClipboardList size={22} /> Material Used</h4>{isAdminMode && <button onClick={() => updateActiveDayData({...currentData, used: [...currentData.used, {id: Date.now(), name: 'New', qty: 0}]})} className="p-2 bg-[#4e342e] text-white rounded-lg"><Plus size={14}/></button>}</div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400"><th className="px-8 py-4 text-center">Sr No</th><th className="px-8 py-4">Material</th><th className="px-8 py-4 text-center">Qty</th>{isAdminMode && <th className="px-8 py-4 text-center">Action</th>}</tr></thead><tbody className="divide-y divide-slate-50">{currentData.used.map((m, i) => (<tr key={m.id} className="hover:bg-slate-50/50 transition-all"><td className="px-8 py-4 text-center font-black text-slate-300">{i+1}</td><td className="px-8 py-4 font-bold">{isAdminMode ? <input value={m.name} onChange={e => updateUsed(m.id, 'name', e.target.value)} className="bg-slate-100 p-1 rounded w-full outline-none" /> : m.name}</td><td className="px-8 py-4 text-center font-black">{isAdminMode ? <input type="number" value={m.qty} onChange={e => updateUsed(m.id, 'qty', e.target.value)} className="bg-slate-100 p-1 rounded w-20 text-center outline-none" /> : m.qty}</td>{isAdminMode && <td className="px-8 py-4 text-center"><button onClick={() => updateActiveDayData({...currentData, used: currentData.used.filter(x => x.id !== m.id)})} className="text-rose-500"><Trash2 size={16}/></button></td>}</tr>))}</tbody><tfoot className="bg-[#4e342e] text-white"><tr className="font-black"><td colSpan="2" className="px-8 py-4 uppercase text-[10px]">Total Material Used</td><td className="px-8 py-4 text-center">{stats.used}</td>{isAdminMode && <td></td>}</tr></tfoot></table></div></div>
                 </div>
                 
                 <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden"><div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black text-[#4e342e] uppercase flex items-center gap-3"><Wrench size={22} /> Equipment Status</h4>{isAdminMode && <button onClick={() => updateActiveDayData({...currentData, equipmentStatus: [...currentData.equipmentStatus, {id: Date.now(), name: 'New', qty: 0}]})} className="p-2 bg-[#4e342e] text-white rounded-lg"><Plus size={14}/></button>}</div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400"><th className="px-8 py-4 text-center">Sr No</th><th className="px-8 py-4">Equipment</th><th className="px-8 py-4 text-center">Qty</th>{isAdminMode && <th className="px-8 py-4 text-center">Action</th>}</tr></thead><tbody className="divide-y divide-slate-50">{currentData.equipmentStatus.map((m, i) => (<tr key={m.id} className="hover:bg-slate-50/50"><td className="px-8 py-4 text-center font-black text-slate-300">{i+1}</td><td className="px-8 py-4 font-bold">{isAdminMode ? <input value={m.name} onChange={e => updateEquipment(m.id, 'name', e.target.value)} className="bg-slate-100 p-1 rounded w-full outline-none" /> : m.name}</td><td className="px-8 py-4 text-center font-black">{isAdminMode ? <input type="number" value={m.qty} onChange={e => updateEquipment(m.id, 'qty', e.target.value)} className="bg-slate-100 p-1 rounded w-20 text-center outline-none" /> : m.qty}</td>{isAdminMode && <td className="px-8 py-4 text-center"><button onClick={() => updateActiveDayData({...currentData, equipmentStatus: currentData.equipmentStatus.filter(x => x.id !== m.id)})} className="text-rose-500"><Trash2 size={16}/></button></td>}</tr>))}</tbody><tfoot className="bg-[#4e342e] text-white"><tr className="font-black"><td colSpan="2" className="px-8 py-4 uppercase text-[10px]">Total Active Equipment</td><td className="px-8 py-4 text-center">{stats.equipment}</td>{isAdminMode && <td></td>}</tr></tfoot></table></div></div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden"><div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black text-[#4e342e] uppercase flex items-center gap-3"><ActivityIcon size={22} /> Work Progress</h4>{isAdminMode && <button onClick={() => updateActiveDayData({...currentData, workProgress: [...currentData.workProgress, {id: Date.now(), name: 'New', value: '-'}]})} className="p-2 bg-[#4e342e] text-white rounded-lg"><Plus size={14}/></button>}</div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400"><th className="px-8 py-4 text-center">Sr No</th><th className="px-8 py-4">Work Type</th><th className="px-8 py-4 text-center">Status</th>{isAdminMode && <th className="px-8 py-4 text-center">Action</th>}</tr></thead><tbody className="divide-y divide-slate-50">{currentData.workProgress.map((m, i) => (<tr key={m.id} className="hover:bg-slate-50/50"><td className="px-8 py-4 text-center font-black text-slate-300">{i+1}</td><td className="px-8 py-4 font-bold">{isAdminMode ? <input value={m.name} onChange={e => updateWork(m.id, 'name', e.target.value)} className="bg-slate-100 p-1 rounded w-full outline-none" /> : m.name}</td><td className="px-8 py-4 text-center font-bold text-slate-500">{isAdminMode ? <input value={m.value} onChange={e => updateWork(m.id, 'value', e.target.value)} className="bg-slate-100 p-1 rounded w-full outline-none text-center" /> : m.value}</td>{isAdminMode && <td className="px-8 py-4 text-center"><button onClick={() => updateActiveDayData({...currentData, workProgress: currentData.workProgress.filter(x => x.id !== m.id)})} className="text-rose-500"><Trash2 size={16}/></button></td>}</tr>))}</tbody><tfoot className="bg-[#4e342e] text-white"><tr className="font-black"><td colSpan="2" className="px-8 py-4 uppercase text-[10px]">Total Work Nodes</td><td className="px-8 py-4 text-center">{stats.workCount}</td>{isAdminMode && <td></td>}</tr></tfoot></table></div></div><div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden"><div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black text-[#4e342e] uppercase flex items-center gap-3"><UserPlus size={22} /> Manpower Detail</h4>{isAdminMode && <button onClick={() => updateActiveDayData({...currentData, manpowerDetail: [...currentData.manpowerDetail, {id: Date.now(), name: 'New Detail', qty: 0}]})} className="p-2 bg-[#4e342e] text-white rounded-lg"><Plus size={14}/></button>}</div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400"><th className="px-8 py-4 text-center">Sr No</th><th className="px-8 py-4">Detail</th><th className="px-8 py-4 text-center">Qty</th>{isAdminMode && <th className="px-8 py-4 text-center">Action</th>}</tr></thead><tbody className="divide-y divide-slate-50">{currentData.manpowerDetail.map((m, i) => (<tr key={m.id} className="hover:bg-slate-50/50"><td className="px-8 py-4 text-center font-black text-slate-300">{i+1}</td><td className="px-8 py-4 font-bold">{isAdminMode ? <input value={m.name} onChange={e => updateManpowerDetail(m.id, 'name', e.target.value)} className="bg-slate-100 p-1 rounded w-full outline-none" /> : m.name}</td><td className="px-8 py-4 text-center font-black">{isAdminMode ? <input type="number" value={m.qty} onChange={e => updateManpowerDetail(m.id, 'qty', e.target.value)} className="bg-slate-100 p-1 rounded w-20 text-center outline-none" /> : m.qty}</td>{isAdminMode && <td className="px-8 py-4 text-center"><button onClick={() => updateActiveDayData({...currentData, manpowerDetail: currentData.manpowerDetail.filter(x => x.id !== m.id)})} className="text-rose-500"><Trash2 size={16}/></button></td>}</tr>))}</tbody><tfoot className="bg-[#4e342e] text-white"><tr className="font-black"><td colSpan="2" className="px-8 py-4 uppercase text-[10px]">Total Aggregate Force</td><td className="px-8 py-4 text-center">{stats.manDetail}</td>{isAdminMode && <td></td>}</tr></tfoot></table></div></div></div>
              </div>
           ) : (
              <>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {[{ l: "Required", v: stats.required, i: Target, c: '#f97316' }, { l: "Available", v: stats.available, i: UserCheck, c: '#4ade80' }, { l: "Shortfall", v: shortfall, i: UserX, c: '#ef4444' }, { l: "Attendance %", v: `${attendancePct}%`, i: TrendingUp, c: '#166534' }].map((k, i) => {
                     const Icon = k.i;
                     return (
                      <div key={i} className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm flex flex-col items-center group hover:-translate-y-1 transition-all">
                        <div className="p-4 rounded-2xl mb-4 bg-slate-50 text-[#4e342e] group-hover:bg-[#4e342e] group-hover:text-white transition-colors"><Icon size={24}/></div>
                        <h2 className="text-4xl font-black mb-1" style={{ color: (k.l === 'Shortfall' && k.v < 0) ? '#ef4444' : k.c }}>{k.v}</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{k.l}</span>
                      </div>
                     );
                   })}
                 </div>
                 <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden mt-10"><div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="text-sm font-black text-[#4e342e] uppercase flex items-center gap-3"><ClipboardList size={22} /> Deployment Registry</h4>{isAdminMode && <button onClick={() => updateActiveDayData({...currentData, manpower: [...currentData.manpower, {id: Date.now(), site: '', type: '', required: 0, available: 0}]})} className="px-6 py-2 bg-[#4e342e] text-white rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg"><Plus size={14} /> Add Row</button>}</div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50">{['Sr.No', 'Site', 'Work', 'Req', 'Avail', 'Gap', 'Status'].map(h => (<th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">{h}</th>))}{isAdminMode && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Action</th>}</tr></thead><tbody className="divide-y divide-slate-100">{currentData.manpower.map((wt, i) => { const diff = wt.available - wt.required; const status = Math.abs(diff) <= 2 ? 'Good' : 'Critical'; return (<tr key={wt.id} className="hover:bg-slate-50/50 transition-all"><td className="px-8 py-6 text-center font-black text-slate-300">{i + 1}</td><td className="px-8 py-6 text-center font-bold">{isAdminMode ? <input value={wt.site || ''} onChange={e => updateManpower(wt.id, 'site', e.target.value)} className="bg-slate-50 p-1 rounded w-full text-center outline-none" /> : wt.site}</td><td className="px-8 py-6 text-center font-bold text-slate-500">{isAdminMode ? <input value={wt.type || ''} onChange={e => updateManpower(wt.id, 'type', e.target.value)} className="bg-slate-50 p-1 rounded w-full text-center outline-none" /> : wt.type}</td><td className="px-8 py-6 text-center font-black">{isAdminMode ? <input type="number" value={wt.required || 0} onChange={e => updateManpower(wt.id, 'required', e.target.value)} className="bg-slate-50 p-1 rounded w-16 text-center outline-none" /> : wt.required}</td><td className="px-8 py-6 text-center font-black">{isAdminMode ? <input type="number" value={wt.available || 0} onChange={e => updateManpower(wt.id, 'available', e.target.value)} className="bg-slate-50 p-1 rounded w-16 text-center outline-none" /> : wt.available}</td><td className={`px-8 py-6 text-center font-black ${diff < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{diff}</td><td className="px-8 py-6 text-center"><span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-white shadow-lg" style={{ backgroundColor: status === 'Good' ? '#4ade80' : '#ef4444' }}>{status}</span></td>{isAdminMode && <td className="px-8 py-6 text-center"><button onClick={() => updateActiveDayData({...currentData, manpower: currentData.manpower.filter(x => x.id !== wt.id)})} className="text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button></td>}</tr>); })}</tbody></table></div></div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 mt-10"><div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm h-100"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><BarChart3 size={16} /> Site Chart</h4><ResponsiveContainer width="100%" height="80%"><BarChart data={currentData.manpower}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="type" hide /><Tooltip /><Bar dataKey="available" fill="#4ade80" radius={[10, 10, 0, 0]} /><Bar dataKey="required" fill="#f97316" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm h-100"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><PieIcon size={16} /> Gap Analysis</h4><ResponsiveContainer width="100%" height="80%"><PieChart><Pie data={[{name: 'Avail', value: stats.available}, {name: 'Gap', value: Math.abs(shortfall)}]} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value"><Cell fill="#4ade80" /><Cell fill="#ef4444" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm h-100"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><LineIcon size={16} /> Site Trend</h4><ResponsiveContainer width="100%" height="80%"><AreaChart data={[{n:'M', v:40},{n:'T',v:30},{n:'W',v:attendancePct},{n:'T',v:80}]}><XAxis dataKey="n" hide /><Tooltip /><Area type="monotone" dataKey="v" stroke="#166534" fill="#16653422" strokeWidth={4} /></AreaChart></ResponsiveContainer></div></div>
              </>
           )}
        </div>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <div>© 2026 Mandal Group • Enterprise Reporting v22.0.0</div>
        <div className="flex gap-8 items-center"><div className="flex items-center gap-2 text-emerald-500"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow"></div> Systems Active</div></div>
      </footer>

      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { background: #f4f7f9; overflow-x: hidden; }
        .scale-in-center { animation: scale-in-center 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        @keyframes scale-in-center { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .shadow-glow { box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
        .animate-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #4e342e33; border-radius: 10px; }
        `}
      </style>
    </div>
  );
};

export default App;