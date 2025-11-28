import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Booking, Holiday, SubjectDef } from '../types';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [errorState, setErrorState] = useState('');
  const [subjects, setSubjects] = useState<SubjectDef[]>([]);

  const refreshData = async () => {
    if (!user) return;
    
    // Fetch parallel data
    const [allBookings, hols, subs, classDays] = await Promise.all([
        dataService.getBookings(),
        dataService.getHolidays(),
        dataService.getSubjects(),
        dataService.getClassDays()
    ]);
    
    const myBookings = allBookings.filter(b => b.studentId === user.id || (b as any).student_id === user.id);
    
    setSubjects(subs);
    setHolidays(hols);
    setBookings(myBookings); 
    
    setAvailableDates(dataService.getAvailableDates(classDays));
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
        const validDate = availableDates.find(d => !holidays.find(h => h.date === d));
        if (validDate) setSelectedDate(validDate);
    }
  }, [availableDates, holidays]);

  const handleBooking = async () => {
    if (!user || !selectedDate || !selectedSubjectId) return;
    try {
      await dataService.createBooking(user, selectedSubjectId, selectedDate);
      setMessage(t('booked') + "!");
      setErrorState('');
      setSelectedSubjectId('');
      refreshData();
    } catch (e: any) {
        console.error(e);
        if (e.message === 'MAX_SUBJECTS') setErrorState(t('maxSubjects'));
        else if (e.message === 'DUPLICATE_SUBJECT') setErrorState(t('alreadyBooked'));
        else setErrorState(`Error: ${e.message}`);
    }
    setTimeout(() => { setMessage(''); setErrorState(''); }, 4000);
  };

  const handleCancel = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    try {
      await dataService.cancelBooking(bookingId);
      setMessage("Booking cancelled");
      if (bookings.find(b => b.id === bookingId)?.subjectId === selectedSubjectId) {
        setSelectedSubjectId('');
      }
      refreshData(); 
    } catch(err) {
      console.error("Cancel failed", err);
      setErrorState("Failed to cancel.");
    }
  };

  const getSubjectName = (id: string) => {
    const sub = subjects.find(s => s.id === id);
    return sub ? (sub.translations[language] || sub.translations['en']) : id;
  };

  const getSubjectIcon = (id: string) => {
    const sub = subjects.find(s => s.id === id);
    return sub ? sub.icon : '📚';
  };

  const toggleSubject = (id: string) => {
    if (selectedSubjectId === id) setSelectedSubjectId('');
    else setSelectedSubjectId(id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {(message || errorState) && (
        <div className={`p-4 rounded-lg shadow-md flex items-center justify-center text-lg ${errorState ? 'bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-l-4 border-red-500' : 'bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-l-4 border-green-500'}`}>
           <span className="font-bold">{errorState || message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Booking Logic */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
          
          {/* 1. Date Selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 p-2 rounded-lg mr-3">🗓️</span>
                {t('selectDate')}
             </h2>
             <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {availableDates.map(date => {
                    const holiday = holidays.find(h => h.date === date);
                    const isHoliday = !!holiday;
                    
                    return (
                        <div key={date} className="relative group">
                            <button
                                type="button"
                                disabled={isHoliday}
                                onClick={() => setSelectedDate(date)}
                                className={`flex-shrink-0 px-6 py-4 rounded-xl border-2 transition-all duration-200 min-w-[100px] ${
                                    isHoliday 
                                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 cursor-not-allowed opacity-60' 
                                    : selectedDate === date 
                                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold shadow-md transform scale-105' 
                                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600'
                                }`}
                            >
                                <span className="block text-xs uppercase tracking-wider opacity-70 mb-1">
                                    {new Date(date).toLocaleDateString(language, { weekday: 'short' })}
                                </span>
                                <span className="block text-2xl font-bold">
                                    {new Date(date).toLocaleDateString(language, { day: 'numeric', month: 'short' })}
                                </span>
                            </button>
                            {isHoliday && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
                                    ⛔ {holiday.reason}
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
             <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mt-2 text-right tracking-wide">🕒 14:30 - 16:30</p>
          </div>

          {/* 2. Subject Selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col flex-1 min-h-[500px]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center shrink-0">
                <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 p-2 rounded-lg mr-3">📚</span>
                {t('selectSubjectTitle')}
             </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start">
                {subjects.map(sub => {
                    const existingBooking = bookings.find(b => b.date === selectedDate && (b.subjectId === sub.id || (b as any).subject_id === sub.id));
                    const isBooked = !!existingBooking;

                    return (
                        <div
                            key={sub.id}
                            onClick={() => !isBooked && toggleSubject(sub.id)}
                            className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group select-none h-32 flex flex-col justify-between ${
                                isBooked 
                                ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-default opacity-80' 
                                : selectedSubjectId === sub.id
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md ring-2 ring-orange-200 dark:ring-orange-800 cursor-pointer transform scale-[1.02]'
                                    : 'border-gray-100 dark:border-gray-600 hover:border-orange-200 dark:hover:border-orange-700 hover:shadow-md bg-white dark:bg-gray-700/50 cursor-pointer hover:-translate-y-1'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-3xl filter drop-shadow-sm">{sub.icon}</div>
                                {selectedSubjectId === sub.id && !isBooked && (
                                    <div className="text-orange-500 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                )}
                            </div>
                            
                            <div className={`font-bold text-sm leading-tight line-clamp-2 ${selectedSubjectId === sub.id ? 'text-orange-900 dark:text-orange-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                {sub.translations[language] || sub.translations['en']}
                            </div>
                            
                            {isBooked && existingBooking && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[1px] rounded-2xl animate-fade-in">
                                    <button
                                        onClick={(e) => handleCancel(e, existingBooking.id)}
                                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow hover:bg-red-600 flex items-center gap-1 transition-transform transform hover:scale-105 ring-2 ring-white dark:ring-gray-800"
                                        title={t('cancelBooking')}
                                    >
                                        🗑️ Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
                <button 
                    type="button"
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSubjectId}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <span>{t('confirmBooking')}</span>
                    {!selectedDate || !selectedSubjectId ? '🔒' : '✨'}
                </button>
            </div>
          </div>
        </div>

        {/* Right Column: My Bookings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center sticky top-0 bg-white dark:bg-gray-800 pb-2 z-10 border-b border-gray-50 dark:border-gray-700">
                <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 p-2 rounded-lg mr-3">🎒</span>
                {t('myClasses')}
            </h2>
            
            {bookings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl flex-1 flex flex-col justify-center items-center">
                    <div className="text-6xl mb-4 grayscale opacity-30 animate-bounce-short">🧘</div>
                    <p className="text-gray-400 font-medium px-4">{t('noClasses')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(b => (
                        <div key={b.id} className="relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group pl-4 pr-12">
                            <div className={`absolute top-2 bottom-2 left-1.5 w-1.5 rounded-full ${b.teacherId || (b as any).teacher_id ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-yellow-400'}`}></div>
                            <div className="pl-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-2xl">{getSubjectIcon(b.subjectId || (b as any).subject_id)}</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-100 text-base leading-tight">{getSubjectName(b.subjectId || (b as any).subject_id)}</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                    <span className="font-bold bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                        {new Date(b.date).toLocaleDateString(language, { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <div>
                                     {b.teacherId || (b as any).teacher_id ? (
                                        <span className="text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 px-2 py-1 rounded-full inline-flex items-center gap-1">
                                            ✅ {b.teacherName || (b as any).teacher_name}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800 px-2 py-1 rounded-full inline-flex items-center gap-1 animate-pulse">
                                            ⏳ Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={(e) => handleCancel(e, b.id)}
                                className="absolute top-1/2 -translate-y-1/2 right-3 z-20 bg-white dark:bg-gray-600 text-red-500 dark:text-red-300 p-2 rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-500 hover:text-white hover:border-red-600 transition-all shadow-sm cursor-pointer flex items-center justify-center opacity-80 hover:opacity-100"
                                title={t('cancelBooking')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};