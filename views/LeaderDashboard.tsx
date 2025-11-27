import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Announcement } from '../types';

export const LeaderDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const data = await dataService.getAnnouncements();
    setAnnouncements(data);
  };

  const handlePublish = async () => {
    if (!user || !title || !content) return;
    
    const newAnnouncement: Partial<Announcement> = {
      title,
      content,
      date: new Date().toLocaleDateString(),
      authorName: user.name
    };

    await dataService.createAnnouncement(newAnnouncement as Announcement);
    
    setTitle('');
    setContent('');
    loadAnnouncements();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4 text-purple-700">{t('newAnnouncement')}</h2>
        
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
              disabled={!title || !content}
              className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
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