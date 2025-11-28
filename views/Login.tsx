
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Role, User } from '../types';
import { dataService } from '../services/dataService';

export const Login = () => {
  const { login, loginWithPassword, verifyMfa, loginStep, register, loading, isPasswordRecovery, setIsPasswordRecovery } = useAuth();
  const { t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login Method Toggle
  const [loginMethod, setLoginMethod] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [isRecovering, setIsRecovering] = useState(false); // Forgot password view

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Register State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number>(0);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);

  useEffect(() => {
    if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }
        setAge(calculatedAge);
    }
  }, [dob]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // --- PASSWORD RECOVERY FLOW (Step 2: Set New Password) ---
  if (isPasswordRecovery) {
      const handleUpdatePassword = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitting(true);
          try {
              await dataService.updatePassword(newPassword);
              setSuccessMsg(t('passwordUpdated'));
              setTimeout(() => {
                  setIsPasswordRecovery(false);
                  setSuccessMsg('');
                  setLoginMethod('PASSWORD');
              }, 2000);
          } catch (err: any) {
              setError(err.message);
          } finally {
              setIsSubmitting(false);
          }
      };

      return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-10 border border-gray-100">
                <h2 className="text-2xl font-bold text-center mb-6">{t('setNewPassword')}</h2>
                {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMsg}</div>}
                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('enterNewPassword')}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded" required minLength={6} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">
                        {isSubmitting ? t('loading') : t('updatePassword')}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (loginStep === 'CREDENTIALS') {
        if (loginMethod === 'OTP') {
             await login(email); 
        } else {
             await loginWithPassword(email, password);
        }
      } else {
        await verifyMfa(otp);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Invalid login credentials")) {
          setError(loginMethod === 'PASSWORD' ? "Invalid credentials. If you signed up with Email/OTP, use that method first." : "Invalid credentials.");
      } else if (err.message && err.message.includes("Error sending magic link")) {
         setError("Error sending email. Rate limit exceeded or SMTP error.");
      } else {
         setError(err.message || "An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      setSuccessMsg('');
      try {
          await dataService.sendPasswordReset(email);
          setSuccessMsg("Link sent! Check your email.");
      } catch (err: any) {
          setError(err.message || "Failed to send link");
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

    // ID is assigned by Supabase Auth on verification, we create a placeholder obj
    const newUser: User = {
      id: '', 
      name,
      email,
      phone,
      age,
      dob,
      role,
      parentName: age < 16 ? parentName : undefined,
      parentEmail: age < 16 ? parentEmail : undefined,
      subjects: role === Role.TEACHER ? [] : undefined 
    };

    try {
      await register(newUser);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Error sending magic link")) {
         setError("Error sending email. Rate limit exceeded.");
      } else {
         setError(err.message || "Registration failed.");
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- MFA / OTP Input Screen ---
  if (loginStep === 'MFA') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-10 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
            <h2 className="text-2xl font-bold text-gray-800">{t('verify')}</h2>
            <p className="text-sm text-gray-500 mt-2">Check your email ({email}) for the code or click the link.</p>
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
                // Removed required to allow link-only flow conceptually, but keeps UX standard
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

  // --- RECOVERY SCREEN (Forgot Password) ---
  if (isRecovering) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-10 border border-gray-100">
                <h2 className="text-2xl font-bold text-center mb-2">{t('recoverPassword')}</h2>
                <p className="text-center text-gray-500 text-sm mb-6">Enter your email to receive a reset link.</p>
                
                {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMsg}</div>}
                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleRecoverPassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('email')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" required />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3 rounded-xl font-bold">
                        {isSubmitting ? t('loading') : t('sendRecoveryLink')}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button onClick={() => setIsRecovering(false)} className="text-sm text-indigo-600 hover:underline">{t('backToLogin')}</button>
                </div>
            </div>
        </div>
      );
  }

  // --- MAIN LOGIN / REGISTER SCREEN ---
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-10 border border-gray-100 relative overflow-hidden">
        
        {/* Decor Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <h2 className="text-3xl font-black mb-6 text-center text-gray-800 tracking-tight">
          {isRegistering ? t('register') : t('login')}
        </h2>
        
        {/* Login Method Toggle (Only when not registering) */}
        {!isRegistering && (
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                    type="button"
                    onClick={() => setLoginMethod('OTP')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMethod === 'OTP' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    {t('loginWithOtp')}
                </button>
                <button 
                    type="button"
                    onClick={() => setLoginMethod('PASSWORD')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMethod === 'PASSWORD' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    {t('loginWithPassword')}
                </button>
            </div>
        )}

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

          {/* Password Input - Only if LoginMethod is Password AND not registering */}
          {!isRegistering && loginMethod === 'PASSWORD' && (
              <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-600 uppercase">{t('password')}</label>
                    <button type="button" onClick={() => setIsRecovering(true)} className="text-xs text-indigo-500 hover:underline">{t('cantAccess')}</button>
                 </div>
                 <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-gray-200 border p-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" required />
              </div>
          )}

          {isRegistering && (
            <>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('phone')}</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-gray-200 border p-2 rounded-lg" required />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{t('dob')}</label>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full border-gray-200 border p-2 rounded-lg" required />
                 </div>
               </div>
               
               {age > 0 && (
                  <div className="text-xs text-gray-500 text-right">Age: {age}</div>
               )}

              {age < 16 && age > 0 && (
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
            {isSubmitting ? t('loading') : (isRegistering ? t('registerButton') : "Enter")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setEmail('');
                setLoginMethod('OTP'); // Reset to default
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
