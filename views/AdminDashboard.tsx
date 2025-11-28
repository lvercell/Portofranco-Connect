
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { Role, User, Booking, SubjectDef } from '../types';

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
  const [newSubName, setNewSubName] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('📚');
  const [newSubColor, setNewSubColor] = useState('bg-gray-100 text-gray-800');

  // Report Filter State
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [showAbsences, setShowAbsences] = useState(false);
  
  const [customBg, setCustomBg] = useState('');

  const refresh = async () => {
    const allUsers = await dataService.getAllUsers();
    setUsers(allUsers);
    
    const allSubs = await dataService.getSubjects();
    setSubjects(allSubs);

    const allBookings = await dataService.getBookings();
    setBookings(allBookings);
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
      if(!newSubId || !newSubName) {
          alert("Please fill ID and Name");
          return;
      }
      try {
          const sub: SubjectDef = {
              id: newSubId.toLowerCase().replace(/\s/g, '_'),
              translations: { [language]: newSubName, 'en': newSubName, 'it': newSubName, 'es': newSubName, 'fr': newSubName, 'de': newSubName }, 
              color: newSubColor,
              icon: newSubIcon,
              active: true
          };
          await dataService.createSubject(sub);
          setNewSubId(''); setNewSubName('');
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

  // --- Filtering Logic ---
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
        className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === id ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
      >
          <span>{icon}</span> {label}
      </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 min-h-screen">
      
      {/* 0. Pending Requests Alert */}
      {pendingUsers.length > 0 && (
          <div className="bg-orange-50 p-6 rounded-xl shadow-sm border border-orange-200">
             <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-orange-800">⏳ {t('pendingRequests')}</h2>
                    <p className="text-sm text-orange-700">Approve new user registrations.</p>
                </div>
                <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">{pendingUsers.length}</span>
             </div>
             <div className="grid gap-4 max-h-60 overflow-y-auto">
                 {pendingUsers.map(u => (
                     <div key={u.id} className="bg-white p-4 rounded-lg flex justify-between items-center shadow-sm">
                         <div>
                             <p className="font-bold text-gray-800">{u.name} <span className="text-xs text-gray-500 font-normal">({u.role})</span></p>
                             <p className="text-sm text-gray-500">{u.email}</p>
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
              <TabButton id="USERS" label={t('manageUsers')} icon="👥" />
              <TabButton id="SUBJECTS" label={t('manageSubjects')} icon="📚" />
              <TabButton id="REPORTS" label={t('reportsAdvanced')} icon="📊" />
              <TabButton id="SETTINGS" label={t('settings')} icon="🎨" />
          </div>

          <div className="p-6">
              
              {/* --- USERS TAB --- */}
              {activeTab === 'USERS' && (
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('role')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {users.filter(u => u.status !== 'PENDING').map((u) => (
                            <tr key={u.id}>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{u.role}</td>
                                <td className="px-6 py-4">
                                    {u.isLeader && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold">Leader</span>}
                                    {u.isAdmin && <span className="ml-1 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-bold">Admin</span>}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                    {!u.isAdmin && u.role === Role.TEACHER && (
                                        <button onClick={() => toggleLeader(u.id, u.isLeader)} className="text-indigo-600 hover:text-indigo-900">
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
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-wrap gap-4 items-end">
                          <div className="flex-1 min-w-[150px]">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID (e.g. math)</label>
                              <input type="text" value={newSubId} onChange={e => setNewSubId(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="unique_id" />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('subjectName')}</label>
                              <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="Display Name"/>
                          </div>
                          <div className="w-20">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('icon')}</label>
                              <select value={newSubIcon} onChange={e => setNewSubIcon(e.target.value)} className="w-full border p-2 rounded text-sm">
                                  {SUBJECT_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                              </select>
                          </div>
                           <div className="w-32">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('color')}</label>
                              <select value={newSubColor} onChange={e => setNewSubColor(e.target.value)} className="w-full border p-2 rounded text-sm">
                                  <option value="bg-blue-100 text-blue-800">Blue</option>
                                  <option value="bg-red-100 text-red-800">Red</option>
                                  <option value="bg-green-100 text-green-800">Green</option>
                                  <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                                  <option value="bg-purple-100 text-purple-800">Purple</option>
                                  <option value="bg-pink-100 text-pink-800">Pink</option>
                                  <option value="bg-orange-100 text-orange-800">Orange</option>
                                  <option value="bg-gray-100 text-gray-800">Gray</option>
                              </select>
                          </div>
                          <button onClick={handleAddSubject} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 mb-[1px]">
                              {t('save')}
                          </button>
                      </div>

                      {/* List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subjects.map(sub => (
                              <div key={sub.id} className={`p-3 rounded-lg border flex justify-between items-center ${sub.color}`}>
                                  <div className="flex items-center gap-2">
                                      <span className="text-xl">{sub.icon}</span>
                                      <span className="font-bold">{sub.translations[language] || sub.translations['en']}</span>
                                      <span className="text-[10px] opacity-50 ml-1 font-mono">{sub.id}</span>
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
                      <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Month</label>
                              <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border p-2 rounded text-sm" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('filterByTeacher')}</label>
                              <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className="border p-2 rounded text-sm min-w-[150px]">
                                  <option value="ALL">All Teachers</option>
                                  {users.filter(u => u.role === Role.TEACHER).map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('filterBySubject')}</label>
                              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="border p-2 rounded text-sm min-w-[150px]">
                                  <option value="ALL">All Subjects</option>
                                  {subjects.map(s => (
                                      <option key={s.id} value={s.id}>{s.translations[language]}</option>
                                  ))}
                              </select>
                          </div>
                          <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer pb-2">
                                  <input type="checkbox" checked={showAbsences} onChange={e => setShowAbsences(e.target.checked)} />
                                  <span className="text-sm font-bold text-gray-700">{t('showAbsencesOnly')}</span>
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
                                <tr className="border-b-2 border-black">
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600">{t('date')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600">{t('student')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600">{t('subject')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600">{t('teacher')}</th>
                                    <th className="py-2 text-sm uppercase font-bold text-gray-600 text-right">{t('attendance')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredBookings.length === 0 && (
                                    <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">{t('noClasses')}</td></tr>
                                )}
                                {filteredBookings.map(b => (
                                    <tr key={b.id} className="group hover:bg-gray-50">
                                        <td className="py-3 text-sm text-gray-500">{b.date}</td>
                                        <td className="py-3 font-medium">{b.studentName}</td>
                                        <td className="py-3 text-gray-700">{getSubjectName(b.subjectId)}</td>
                                        <td className="py-3 text-sm">{b.teacherName || '-'}</td>
                                        <td className="py-3 text-right">
                                            {b.attendance === 'PRESENT' && <span className="text-green-600 font-bold">✅ {t('markPresent')}</span>}
                                            {b.attendance === 'ABSENT' && <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">❌ {t('markAbsent')}</span>}
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
                      <h3 className="font-bold text-gray-700">Wallpaper</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <input type="text" placeholder="Custom Image URL" value={customBg} onChange={e => setCustomBg(e.target.value)} className="flex-1 border p-2 rounded text-sm"/>
                        <button className="bg-gray-800 text-white px-3 py-1 rounded text-sm">Set</button>
                      </form>
                  </div>
              )}

          </div>
      </div>
    </div>
  );
};
