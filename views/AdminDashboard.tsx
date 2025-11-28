

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { Role, User, Booking, SubjectDef, SUPPORTED_LANGUAGES, Language } from '../types';

const WALLPAPER_PRESETS = [
  { name: 'Library', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' },
  { name: 'Pencils', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop' },
  { name: 'Minimal Geo', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
];

const SUBJECT_ICONS = [
    '📚','➗','📐','⚛️','🧪','🧬','🌍','🗺️','🎨','🎵','🎭','⚽','🏃','🇬🇧','🇮🇹','🇪🇸','🇫🇷','🇩🇪','💻','⚖️','🧠','🏛️','📝','🏺','💼'
];

type Tab = 'USERS' | 'SUBJECTS' | 'REPORTS' | 'SETTINGS';

export const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const { backgroundImage, setBackgroundImage } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('USERS');
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<SubjectDef[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Subject Form State
  const [newSubId, setNewSubId] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('📚');
  const [newSubColor, setNewSubColor] = useState('bg-gray-100 text-gray-800');
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({
      it: '', es: '', en: '', fr: '', de: ''
  });

  // Report Filter State
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [showAbsences, setShowAbsences] = useState(false);
  
  const [customBg, setCustomBg] = useState('');
  const [currentAccessCode, setCurrentAccessCode] = useState('');

  const refresh = async () => {
    const allUsers = await dataService.getAllUsers();
    setUsers(allUsers);
    const allSubs = await dataService.getSubjects();
    setSubjects(allSubs);
    const allBookings = await dataService.getBookings();
    setBookings(allBookings);
    const code = await dataService.getAccessCode();
    setCurrentAccessCode(code);
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleLeader = async (userId: string, currentStatus: boolean = false) => {
    await dataService.toggleLeaderStatus(userId, currentStatus);
    refresh();
  };

  const approveUser = async (userId: string) => {
      await dataService.approveUser(userId);
      refresh();
  };

  const deleteUser = async (userId: string) => {
      if(window.confirm('Are you sure you want to delete this user?')) {
          await dataService.deleteUser(userId);
          refresh();
      }
  };

  const handleAddSubject = async () => {
      if(!newSubId || !newSubNames.it) {
          alert("Please fill ID and Italian Name (at least)");
          return;
      }
      try {
          const finalTranslations: Record<string, string> = {};
          Object.keys(SUPPORTED_LANGUAGES).forEach(lang => {
              finalTranslations[lang] = newSubNames[lang] || newSubNames['it'];
          });

          const sub: SubjectDef = {
              id: newSubId.toLowerCase().replace(/\s/g, '_'),
              translations: finalTranslations,
              color: newSubColor,
              icon: newSubIcon,
              active: true
          };
          await dataService.createSubject(sub);
          setNewSubId('');
          setNewSubNames({ it: '', es: '', en: '', fr: '', de: '' });
          refresh();
          alert("Subject saved!");
      } catch (e: any) {
          console.error(e);
          alert("Error creating subject: " + e.message);
      }
  };

  const handleDeleteSubject = async (id: string) => {
      if(window.confirm('Delete subject?')) {
          await dataService.deleteSubject(id);
          refresh();
      }
  };

  const handleCustomBg = (e: React.FormEvent) => {
    e.preventDefault();
    if(customBg) setBackgroundImage(customBg);
  }
  
  const handleUpdateAccessCode = async () => {
      await dataService.saveAccessCode(currentAccessCode);
      alert("School Access Code Updated!");
  };

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  
  const filteredBookings = bookings.filter(b => {
      const matchMonth = b.date.startsWith(filterMonth);
      const matchTeacher = filterTeacher === 'ALL' || b.teacherId === filterTeacher;
      const matchSubject = filterSubject === 'ALL' || b.subjectId === filterSubject;
      const matchAbsence = !showAbsences || b.attendance === 'ABSENT';
      return matchMonth && matchTeacher && matchSubject && matchAbsence;
  });

  const getSubjectName = (id: string) => {
      const s = subjects.find(sub => sub.id === id);
      return s ? (s.translations[language] || s.translations['en']) : id;
  };

  const TabButton = ({ id, label, icon }: { id: Tab, label: string, icon: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === id ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
          <span>{icon}</span> {label}
      </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 min-h-screen">
      
      {/* 0. Pending Requests Alert */}
      {pendingUsers.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/40 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800">
             <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-orange-800 dark:text-orange-200">⏳ {t('pendingRequests')}</h2>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Approve new user registrations.</p>
                </div>
                <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-100 px-3 py-1 rounded-full text-xs font-bold">{pendingUsers.length}</span>
             </div>
             <div className="grid gap-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                 {pendingUsers.map(u => (
                     <div key={u.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center shadow-sm">
                         <div>
                             <p className="font-bold text-gray-800 dark:text-gray-100">{u.name} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({u.role})</span></p>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                             <p className="text-xs text-gray-400">DOB: {u.dob} (Age: {u.age})</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => deleteUser(u.id)} className="text-red-500 text-sm hover:underline px-2">Reject</button>
                            <button onClick={() => approveUser(u.id)} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700 shadow-sm">{t('approve')}</button>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      )}

      {/* Main Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
              <TabButton id="USERS" label={t('manageUsers')} icon="👥" />
              <TabButton id="SUBJECTS" label={t('manageSubjects')} icon="📚" />
              <TabButton id="REPORTS" label={t('reportsAdvanced')} icon="📊" />
              <TabButton id="SETTINGS" label={t('settings')} icon="🎨" />
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              
              {/* --- USERS TAB --- */}
              {activeTab === 'USERS' && (
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('role')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('status')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.filter(u => u.status !== 'PENDING').map((u) => (
                            <tr key={u.id}>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.role}</td>
                                <td className="px-6 py-4">
                                    {u.isLeader && <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded-full font-bold">Leader</span>}
                                    {u.isAdmin && <span className="ml-1 bg-gray-800 dark:bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold">Admin</span>}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                    {!u.isAdmin && u.role === Role.TEACHER && (
                                        <button onClick={() => toggleLeader(u.id, u.isLeader)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900">
                                            {u.isLeader ? t('demoteLeader') : t('promoteToLeader')}
                                        </button>
                                    )}
                                    {!u.isAdmin && (
                                        <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900 ml-4">
                                            {t('delete')}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                 </div>
              )}

              {/* --- SUBJECTS TAB --- */}
              {activeTab === 'SUBJECTS' && (
                  <div className="space-y-8">
                      {/* Add Form */}
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 sticky top-0 z-10 space-y-3">
                          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase border-b pb-2 mb-2">Create New Subject</h3>
                          <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">ID (unique)</label>
                                <input type="text" value={newSubId} onChange={e => setNewSubId(e.target.value)} className="w-full border dark:border-gray-500 dark:bg-gray-800 dark:text-white p-2 rounded text-sm" placeholder="e.g. math_advanced" />
                            </div>
                            
                            <div className="w-20">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('icon')}</label>
                                <select value={newSubIcon} onChange={e => setNewSubIcon(e.target.value)} className="w-full border dark:border-gray-500 dark:bg-gray-800 dark:text-white p-2 rounded text-sm">
                                    {SUBJECT_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            
                            <div className="w-32">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('color')}</label>
                                <select value={newSubColor} onChange={e => setNewSubColor(e.target.value)} className="w-full border dark:border-gray-500 dark:bg-gray-800 dark:text-white p-2 rounded text-sm">
                                    <option value="bg-blue-100 text-blue-800">{t('col_blue')}</option>
                                    <option value="bg-red-100 text-red-800">{t('col_red')}</option>
                                    <option value="bg-green-100 text-green-800">{t('col_green')}</option>
                                    <option value="bg-yellow-100 text-yellow-800">{t('col_yellow')}</option>
                                    <option value="bg-purple-100 text-purple-800">{t('col_purple')}</option>
                                    <option value="bg-pink-100 text-pink-800">{t('col_pink')}</option>
                                    <option value="bg-orange-100 text-orange-800">{t('col_orange')}</option>
                                    <option value="bg-gray-100 text-gray-800">{t('col_gray')}</option>
                                </select>
                            </div>
                          </div>
                          
                          {/* Multi-language inputs */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                             {Object.keys(newSubNames).map(lang => (
                                 <div key={lang}>
                                     <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">{SUPPORTED_LANGUAGES[lang as Language]}</label>
                                     <input 
                                        type="text" 
                                        value={newSubNames[lang]} 
                                        onChange={e => setNewSubNames({...newSubNames, [lang]: e.target.value})}
                                        className="w-full border dark:border-gray-500 dark:bg-gray-800 dark:text-white p-2 rounded text-sm" 
                                        placeholder={`Name in ${lang.toUpperCase()}`}
                                     />
                                 </div>
                             ))}
                          </div>
                          
                          <div className="pt-2 text-right">
                            <button onClick={handleAddSubject} className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 shadow-sm">
                                {t('save')}
                            </button>
                          </div>
                      </div>

                      {/* List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subjects.map(sub => (
                              <div key={sub.id} className={`p-3 rounded-lg border flex justify-between items-center ${sub.color} dark:opacity-90`}>
                                  <div className="flex items-center gap-2">
                                      <span className="text-xl">{sub.icon}</span>
                                      <div className="flex flex-col">
                                          <span className="font-bold">{sub.translations[language] || sub.translations['en']}</span>
                                          <span className="text-[10px] opacity-60 font-mono">{Object.values(sub.translations).slice(0, 2).join(', ')}...</span>
                                      </div>
                                  </div>
                                  <button onClick={() => handleDeleteSubject(sub.id)} className="bg-white/50 hover:bg-white text-red-600 p-1 rounded transition-colors">🗑️</button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* --- REPORTS TAB --- */}
              {activeTab === 'REPORTS' && (
                  <div className="space-y-6">
                      <div className="flex flex-wrap gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 sticky top-0 z-10">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase mb-1">Month</label>
                              <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border dark:border-gray-500 dark:bg-gray-800 dark:text-white p-2 rounded text-sm" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase mb-1">{t('filterByTeacher')}</label>
                              <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className="border dark:border-gray-500 dark:bg-gray-800 dark:text-white p-2 rounded text-sm min-w-[150px]">
                                  <option value="ALL">All Teachers</option>
                                  {users.filter(u => u.role === Role.TEACHER).map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase mb-1">{t('filterBySubject')}</label>
                              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="border dark:border-gray-500 dark:bg-gray-800 dark:text-white p-2 rounded text-sm min-w-[150px]">
                                  <option value="ALL">All Subjects</option>
                                  {subjects.map(s => (
                                      <option key={s.id} value={s.id}>{s.translations[language]}</option>
                                  ))}
                              </select>
                          </div>
                          <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer pb-2">
                                  <input type="checkbox" checked={showAbsences} onChange={e => setShowAbsences(e.target.checked)} />
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('showAbsencesOnly')}</span>
                              </label>
                          </div>
                          <div className="flex items-end ml-auto">
                             <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-black">
                                 🖨️ {t('printReport')}
                             </button>
                          </div>
                      </div>

                      <div className="overflow-x-auto print:visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black dark:border-white">
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600 dark:text-gray-300">{t('date')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600 dark:text-gray-300">{t('student')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600 dark:text-gray-300">{t('subject')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600 dark:text-gray-300">{t('teacher')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600 dark:text-gray-300 text-right">{t('attendance')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredBookings.length === 0 && (
                                    <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">{t('noClasses')}</td></tr>
                                )}
                                {filteredBookings.map(b => (
                                    <tr key={b.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{b.date}</td>
                                        <td className="py-3 font-medium dark:text-gray-200">{b.studentName}</td>
                                        <td className="py-3 text-gray-700 dark:text-gray-300">{getSubjectName(b.subjectId)}</td>
                                        <td className="py-3 text-sm dark:text-gray-300">{b.teacherName || '-'}</td>
                                        <td className="py-3 text-right">
                                            {b.attendance === 'PRESENT' && <span className="text-green-600 dark:text-green-400 font-bold">✅ {t('markPresent')}</span>}
                                            {b.attendance === 'ABSENT' && <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">❌ {t('markAbsent')}</span>}
                                            {b.attendance === 'PENDING' && <span className="text-gray-400">-</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              )}

              {/* --- SETTINGS TAB --- */}
              {activeTab === 'SETTINGS' && (
                  <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
                          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">🎨 Wallpaper</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {WALLPAPER_PRESETS.map(p => (
                                <button 
                                key={p.name}
                                onClick={() => setBackgroundImage(p.url)}
                                className={`h-24 rounded-lg bg-cover bg-center border-4 transition-all hover:opacity-100 ${backgroundImage === p.url ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-60'}`}
                                style={{ backgroundImage: `url(${p.url})` }}
                                >
                                <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">{p.name}</span>
                                </button>
                            ))}
                          </div>
                          <form onSubmit={handleCustomBg} className="flex gap-2 max-w-md">
                            <input type="text" placeholder="Custom Image URL" value={customBg} onChange={e => setCustomBg(e.target.value)} className="flex-1 border dark:border-gray-500 dark:bg-gray-700 dark:text-white p-2 rounded text-sm"/>
                            <button className="bg-gray-800 dark:bg-gray-600 text-white px-3 py-1 rounded text-sm">Set</button>
                          </form>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800">
                          <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">🔐 Security</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Restricts registration to users who know this code.</p>
                          <div className="flex gap-2 max-w-md">
                              <input 
                                type="text" 
                                value={currentAccessCode} 
                                onChange={e => setCurrentAccessCode(e.target.value)} 
                                className="flex-1 border dark:border-gray-500 dark:bg-gray-700 dark:text-white p-2 rounded font-mono font-bold"
                              />
                              <button onClick={handleUpdateAccessCode} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700">
                                  Update Code
                              </button>
                          </div>
                      </div>
                  </div>
              )}

          </div>
      </div>
    </div>
  );
};