import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Booking } from '../types';
import { SUBJECTS_DATA } from '../constants';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [errorState, setErrorState] = useState('');

  const refreshData = () => {
    // Force reload from service to ensure UI is in sync
    const currentBookings = dataService.getBookings().filter(b => b.studentId === user?.id);
    setBookings([...currentBookings]); 
    setAvailableDates(dataService.getAvailableDates());
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
        setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  const handleBooking = () => {
    if (!user || !selectedDate || !selectedSubjectId) return;
    try {
      dataService.createBooking(user, selectedSubjectId, selectedDate);
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

  const handleCancel = (e: React.MouseEvent | React.TouchEvent, bookingId: string) => {
    // Aggressively stop propagation to prevent parent clicks
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        if ('nativeEvent' in e) e.nativeEvent.stopImmediatePropagation();
    }
    
    // Simple confirm
    if(window.confirm(t('cancelBooking') + "?")) {
        try {
          dataService.cancelBooking(bookingId);
          setMessage("Booking cancelled");
          // Clear selection if we just cancelled the currently selected subject (via the grid)
          setSelectedSubjectId(''); 
          refreshData(); 
        } catch(err) {
          console.error("Cancel failed", err);
          setErrorState("Failed to cancel. Try again.");
        }
    }
  };

  const getSubjectName = (id: string) => {
    const sub = SUBJECTS_DATA.find(s => s.id === id);
    return sub ? sub.translations[language] : id;
  };

  const getSubjectIcon = (id: string) => {
    const sub = SUBJECTS_DATA.find(s => s.id === id);
    return sub ? sub.icon : '📚';
  };

  const toggleSubject = (id: string) => {
    if (selectedSubjectId === id) {
      setSelectedSubjectId('');
    } else {
      setSelectedSubjectId(id);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Messages */}
      {(message || errorState) && (
        <div className={`p-4 rounded-lg shadow-md flex items-center justify-between ${errorState ? 'bg-red-50 text-red-800 border-l-4 border-red-500' : 'bg-green-50 text-green-800 border-l-4 border-green-500'}`}>
           <span className="font-medium">{errorState || message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Booking Logic */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Date Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">🗓️</span>
                {t('selectDate')}
             </h2>
             <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {availableDates.map(date => (
                    <button
                        key={date}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                            selectedDate === date 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-md transform scale-105' 
                            : 'border-gray-200 hover:border-indigo-300 text-gray-600 bg-gray-50'
                        }`}
                    >
                        <span className="block text-xs uppercase tracking-wider opacity-70">
                            {new Date(date).toLocaleDateString(language, { weekday: 'short' })}
                        </span>
                        <span className="block text-lg">
                            {new Date(date).toLocaleDateString(language, { day: 'numeric', month: 'short' })}
                        </span>
                    </button>
                ))}
             </div>
             <p className="text-xs text-indigo-500 font-medium mt-2 text-right">🕒 14:30 - 16:30</p>
          </div>

          {/* 2. Subject Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-orange-100 text-orange-700 p-2 rounded-lg mr-3">📚</span>
                {t('selectSubjectTitle')}
             </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SUBJECTS_DATA.map(sub => {
                    const existingBooking = bookings.find(b => b.date === selectedDate && b.subjectId === sub.id);
                    const isBooked = !!existingBooking;

                    return (
                        <div
                            key={sub.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                if (isBooked && existingBooking) {
                                    handleCancel(e, existingBooking.id);
                                } else {
                                    toggleSubject(sub.id);
                                }
                            }}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group cursor-pointer select-none ${
                                isBooked 
                                ? 'bg-gray-100 border-gray-200 opacity-90 hover:bg-red-50 hover:border-red-300' 
                                : selectedSubjectId === sub.id
                                    ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200 ring-offset-1'
                                    : 'border-gray-100 hover:border-orange-200 hover:shadow-sm bg-white'
                            }`}
                        >
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{sub.icon}</div>
                            <div className={`font-semibold text-sm leading-tight ${selectedSubjectId === sub.id ? 'text-orange-900' : 'text-gray-700'}`}>
                                {sub.translations[language]}
                            </div>
                            
                            {selectedSubjectId === sub.id && !isBooked && (
                                <div className="absolute top-2 right-2 text-orange-500 animate-bounce-short">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </div>
                            )}

                            {isBooked && (
                                <div className="absolute top-2 right-2">
                                    <span className="group-hover:hidden text-[10px] font-bold uppercase border border-gray-400 text-gray-500 px-1.5 py-0.5 rounded bg-white">
                                        {t('booked')}
                                    </span>
                                    <span className="hidden group-hover:inline-flex items-center gap-1 text-[10px] font-bold uppercase border border-red-500 text-red-500 px-1.5 py-0.5 rounded bg-white shadow-sm">
                                        🗑️
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8">
                <button 
                    type="button"
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSubjectId}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    {t('confirmBooking')}
                </button>
            </div>
          </div>
        </div>

        {/* Right Column: My Bookings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-700 p-2 rounded-lg mr-3">🎒</span>
                {t('myClasses')}
            </h2>
            
            {bookings.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                    <div className="text-5xl mb-4 grayscale opacity-30">🧘</div>
                    <p className="text-gray-400 font-medium">{t('noClasses')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(b => (
                        <div key={b.id} className="relative bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group pl-4 pr-14">
                            
                            <div className={`absolute top-2 bottom-2 left-1 w-1 rounded-full ${b.teacherId ? 'bg-green-500' : 'bg-yellow-400'}`}></div>

                            <div className="pl-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">{getSubjectIcon(b.subjectId)}</span>
                                    <span className="font-bold text-gray-800 text-sm leading-tight">{getSubjectName(b.subjectId)}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <span className="font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                        {new Date(b.date).toLocaleDateString(language, { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                
                                <div className="mt-2">
                                     {b.teacherId ? (
                                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            ✅ {b.teacherName}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            ⏳ Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                type="button"
                                onClick={(e) => handleCancel(e, b.id)}
                                className="absolute top-1/2 -translate-y-1/2 right-3 z-20 bg-white text-red-500 p-3 rounded-lg border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
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