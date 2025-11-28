
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Booking, SubjectDef } from '../types';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [activeDate, setActiveDate] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [subjects, setSubjects] = useState<SubjectDef[]>([]);

  const refresh = async () => {
    const dates = dataService.getAvailableDates();
    if (!activeDate && dates.length > 0) setActiveDate(dates[0]);
    
    // Fetch bookings and subjects concurrently
    const [data, subs] = await Promise.all([
        dataService.getBookings(),
        dataService.getSubjects()
    ]);
    
    setSubjects(subs);
    setAllBookings(data);
  };

  useEffect(() => {
    refresh();
  }, [activeDate]);

  const handleClaim = async (bookingId: string) => {
    if (!user) return;
    try {
      await dataService.claimBooking(bookingId, user);
      refresh();
    } catch (e) {
      alert("Error claiming class");
    }
  };

  const handleUnclaim = async (bookingId: string) => {
    try {
        await dataService.unclaimBooking(bookingId);
        refresh();
    } catch (e) {
        console.error("Error unclaiming", e);
    }
  };

  const saveNote = async (bookingId: string) => {
    await dataService.updateBookingNotes(bookingId, noteContent);
    setEditingNoteId(null);
    setNoteContent('');
    refresh();
  };

  const markAttendance = async (bookingId: string, status: 'PRESENT' | 'ABSENT') => {
      await dataService.updateAttendance(bookingId, status);
      refresh();
  };

  const getSubjectDetails = (id: string) => {
    return subjects.find(s => s.id === id) || { translations: { [language]: id }, color: 'bg-gray-100', icon: '❓' };
  };

  // Filter logic
  const unclaimed = allBookings.filter(b => b.date === activeDate && !b.teacherId);
  const myClasses = allBookings.filter(b => b.date === activeDate && b.teacherId === user?.id);

  return (
    <div className="space-y-6">
      
      {/* Date Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-2 rounded-full shadow-sm border inline-flex gap-2 flex-wrap justify-center">
            {dataService.getAvailableDates().map(date => (
            <button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeDate === date 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-100'
                }`}
            >
                {new Date(date).toLocaleDateString(language, { weekday: 'short', day: 'numeric', month: 'short' })}
            </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Available Pool */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50 p-4 border-b border-gray-100">
             <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {t('availableClasses')}
             </h2>
          </div>
          
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto flex-1">
            {unclaimed.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <p>{t('noClasses')}</p>
                </div>
            )}
            {unclaimed.map(b => {
               const sub = getSubjectDetails(b.subjectId);
               return (
                <div key={b.id} className="group border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center hover:shadow-md transition-all hover:border-green-300 gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-gray-50 shadow-inner`}>
                            {sub.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{sub.translations[language] || sub.translations['en']}</h3>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wide">Student</span>
                                {b.studentName}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleClaim(b.id)}
                        className="w-full sm:w-auto bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    >
                        {t('claim')}
                    </button>
                </div>
               );
            })}
          </div>
        </div>

        {/* My Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="bg-indigo-50 p-4 border-b border-indigo-100">
             <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <span className="text-xl">👩‍🏫</span>
                {t('myClasses')}
             </h2>
            </div>
            
          <div className="p-4 space-y-4 flex-1">
            {myClasses.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <p>{t('noClasses')}</p>
                </div>
            )}
            {myClasses.map(b => {
              const sub = getSubjectDetails(b.subjectId);
              return (
              <div key={b.id} className="relative bg-white border-l-4 border-indigo-500 shadow-sm p-5 rounded-r-xl group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <span className="text-2xl">{sub.icon}</span>
                     <div>
                        <span className="font-bold text-gray-800 block text-lg">{sub.translations[language] || sub.translations['en']}</span>
                        <span className="text-sm text-gray-500">{b.studentName}</span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                      <div className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">14:30 - 16:30</div>
                      <button 
                        onClick={() => handleUnclaim(b.id)}
                        className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded bg-white hover:bg-red-500 hover:text-white transition-colors"
                      >
                         {t('releaseClass')}
                      </button>
                  </div>
                </div>

                {/* Attendance Controls */}
                <div className="flex gap-2 mb-4 border-t border-b py-2 border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase self-center mr-2">{t('attendance')}:</span>
                    <button 
                        onClick={() => markAttendance(b.id, 'PRESENT')}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${b.attendance === 'PRESENT' ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-400 hover:border-green-400'}`}
                    >
                        ✅ {t('markPresent')}
                    </button>
                    <button 
                        onClick={() => markAttendance(b.id, 'ABSENT')}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${b.attendance === 'ABSENT' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-400 hover:border-red-400'}`}
                    >
                        ❌ {t('markAbsent')}
                    </button>
                </div>
                
                {/* Notes Section */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                  {editingNoteId === b.id ? (
                    <div>
                      <textarea
                        className="w-full p-2 border rounded text-sm mb-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write student progress notes here..."
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                           onClick={() => setEditingNoteId(null)}
                           className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveNote(b.id)}
                          className="text-xs bg-yellow-500 text-white px-3 py-1 rounded font-medium hover:bg-yellow-600"
                        >
                          {t('saveNotes')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                        className="cursor-pointer"
                        onClick={() => {
                            setEditingNoteId(b.id);
                            setNoteContent(b.notes || '');
                        }}
                    >
                       <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">{t('notes')}</span>
                            <span className="text-xs text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit ✏️</span>
                       </div>
                       <p className={`text-sm ${b.notes ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                           {b.notes || "Click to add notes regarding this session..."}
                       </p>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};
