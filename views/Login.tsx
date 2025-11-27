import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Role, User } from '../types';

export const Login = () => {
  const { login, verifyMfa, loginStep, register, loading } = useAuth();
  const { t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Register State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number>(18);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (loginStep === 'CREDENTIALS') {
        await login(email); // No password, just email for OTP
      } else {
        await verifyMfa(otp);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (age < 16 && (!parentName || !parentEmail)) {
      setError("Parent details required for minors.");
      setIsSubmitting(false);
      return;
    }

    // ID is assigned by Supabase Auth on verification
    const newUser: User = {
      id: '', 
      name,
      email,
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
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loginStep === 'MFA') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-10 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
            <h2 className="text-2xl font-bold text-gray-800">{t('verify')}</h2>
            <p className="text-sm text-gray-500 mt-2">Check your email ({email}) for the code.</p>
          </div>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center text-sm font-medium">{error}</div>}
          
          <form onSubmit={handleLogin}>
             <div className="mb-6">
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                className="w-full text-center text-2xl tracking-widest border-2 border-gray-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                placeholder="• • • • • •"
                maxLength={6}
                required
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50">
              {isSubmitting ? t('loading') : t('verify')}
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

          {/* No Password field for OTP flow */}

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

          <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg mt-4 disabled:opacity-50">
            {isSubmitting ? t('loading') : (isRegistering ? t('registerButton') : "Send OTP Code")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setEmail('');
            }}
            className="text-sm text-indigo-600 font-semibold hover:underline"
          >
            {isRegistering ? t('login') : t('register')}
          </button>
        </div>
      </div>
    </div>
  );
};