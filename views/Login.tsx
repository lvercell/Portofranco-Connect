import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Role, User } from '../types';
import { dataService } from '../services/dataService';

export const Login = () => {
  const { login, verifyMfa, loginStep, register } = useAuth();
  const { t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  
  // Register State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number>(18);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (loginStep === 'CREDENTIALS') {
        await login(email, password);
      } else {
        await verifyMfa(otp);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (age < 16 && (!parentName || !parentEmail)) {
      setError("Parent details required for minors.");
      return;
    }

    const newUser: User = {
      id: dataService.generateId(), // Safe ID generation
      name,
      email,
      password,
      phone,
      age,
      role,
      parentName: age < 16 ? parentName : undefined,
      parentEmail: age < 16 ? parentEmail : undefined,
      subjects: role === Role.TEACHER ? [] : undefined 
    };

    try {
      await register(newUser);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loginStep === 'MFA' && !isRegistering) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-10 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
            <h2 className="text-2xl font-bold text-gray-800">{t('verify')}</h2>
            <p className="text-sm text-gray-500 mt-2">Enter the code sent to your email.</p>
          </div>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center text-sm font-medium">{error}</div>}
          
          <form onSubmit={handleLogin}>
             <div className="mb-6">
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                className="w-full text-center text-2xl tracking-widest border-2 border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                placeholder="• • • •"
                maxLength={4}
                required
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              {t('verify')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-10 border border-gray-100 relative overflow-hidden">
        
        {/* Decor Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <h2 className="text-3xl font-black mb-2 text-center text-gray-800 tracking-tight">
          {isRegistering ? t('register') : t('login')}
        </h2>
        <p className="text-center text-gray-400 mb-8 text-sm">Welcome to Doposcuola Connect</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border-l-4 border-red-500">{error}</div>}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('role')}</label>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setRole(Role.STUDENT)} className={`p-2 rounded border ${role === Role.STUDENT ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}>{t('student')}</button>
                    <button type="button" onClick={() => setRole(Role.TEACHER)} className={`p-2 rounded border ${role === Role.TEACHER ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}>{t('teacher')}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('name')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-200 border p-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" required />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-gray-200 border p-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-gray-200 border p-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" required />
          </div>

          {isRegistering && (
            <>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('phone')}</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-gray-200 border p-2 rounded-lg" required />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('age')}</label>
                    <input type="number" value={age} onChange={e => setAge(parseInt(e.target.value))} className="w-full border-gray-200 border p-2 rounded-lg" required min={5} />
                 </div>
               </div>

              {age < 16 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-2">
                  <p className="text-xs text-amber-800 mb-2 font-medium">⚠️ {t('gdprNotice')}</p>
                  <div className="space-y-2">
                     <input type="text" placeholder={t('parentName')} value={parentName} onChange={e => setParentName(e.target.value)} className="w-full border border-amber-200 p-2 rounded text-sm" required />
                     <input type="email" placeholder={t('parentEmail')} value={parentEmail} onChange={e => setParentEmail(e.target.value)} className="w-full border border-amber-200 p-2 rounded text-sm" required />
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg mt-4">
            {isRegistering ? t('registerButton') : t('loginButton')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-indigo-600 font-semibold hover:underline"
          >
            {isRegistering ? t('login') : t('register')}
          </button>
        </div>
        
        {/* Help Tip for Prototype */}
        {!isRegistering && (
            <div className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-400">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold">Admin/Teacher</div>
                        <div>lvercell@gmail.com</div>
                        <div>060696Satanas</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold">Student</div>
                        <div>student@doposcuola.com</div>
                        <div>1234</div>
                    </div>
                </div>
                <div className="text-center mt-2 font-mono bg-gray-100 rounded py-1">OTP: 1234</div>
            </div>
        )}
      </div>
    </div>
  );
};