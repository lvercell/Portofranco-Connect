import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Announcement } from '../types';

export const LeaderDashboard = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>(dataService.getAnnouncements());

  const handleAI = async () => {
    if (!topic) return;
    setIsLoading(true);
    const result = await geminiService.draftAnnouncement(topic, language);
    setTitle(result.title);
    setContent(result.content);
    setIsLoading(false);
  };

  const handlePublish = () => {
    if (!user || !title || !content) return;
    const newAnnouncement: Announcement = {
      id: dataService.generateId(), // Safe ID generation
      title,
      content,
      date: new Date().toLocaleDateString(),
      authorName: user.name
    };
    dataService.createAnnouncement(newAnnouncement);
    setAnnouncements(dataService.getAnnouncements());
    setTitle('');
    setContent('');
    setTopic('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4 text-purple-700">{t('newAnnouncement')}</h2>
        
        {/* AI Helper */}
        <div className="bg-purple-50 p-4 rounded mb-6 border border-purple-100">
          <label className="block text-sm font-medium text-purple-900 mb-2">{t('aiPrompt')}</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 border p-2 rounded focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Change of classroom for Math on Tuesday"
            />
            <button 
              onClick={handleAI}
              disabled={isLoading || !topic}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span className="mr-2">✨</span> {t('generateAI')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="Title" 
            className="w-full text-lg font-bold border-b-2 border-gray-200 p-2 focus:outline-none focus:border-purple-500"
          />
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            rows={5} 
            className="w-full border p-3 rounded"
            placeholder="Announcement content..."
          />
          <div className="flex justify-end">
            <button 
              onClick={handlePublish}
              className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700"
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <h3 className="text-xl font-bold mb-4 text-gray-700">{t('announcements')} History</h3>
      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="bg-white p-5 rounded shadow-sm border-l-4 border-purple-500">
            <div className="flex justify-between items-baseline mb-2">
              <h4 className="text-lg font-bold text-gray-800">{a.title}</h4>
              <span className="text-xs text-gray-500">{a.date} - {a.authorName}</span>
            </div>
            <p className="text-gray-600 whitespace-pre-wrap">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};