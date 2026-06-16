import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useTranslation } from '../App';
import { useAuth } from '../services/hooks';
import { authApi, usersApi } from '../services/api';
import {
  User as UserIcon,
  Mail,
  Lock,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Camera,
  Settings,
  Bell,
  Fingerprint,
  Loader2
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await authApi.getMe();
        setUsername(userData.username || '');
        setEmail(userData.email || '');
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ username, email });
      await refreshUser(); // Refresh the auth context
      alert(t.user.saveChanges + " ✅");
    } catch (error: any) {
      alert('Failed to save changes: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-cyan-500/10 rounded-2xl">
          <Settings className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest">{t.nav.profile}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <GlassCard className="p-8 flex flex-col items-center text-center space-y-4">
             <div className="relative group">
               <img src={authUser?.avatar_url || "https://github.com/shadcn.png"} className="w-32 h-32 rounded-3xl border-2 border-cyan-500/30 group-hover:border-cyan-500 transition-all cursor-pointer" />
               <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Camera className="w-6 h-6 text-white" />
               </div>
             </div>
             <div>
               <h3 className="font-black text-xl text-white tracking-tight">{username || authUser?.username}</h3>
               <div className="flex items-center justify-center gap-1.5 text-[10px] text-cyan-400 font-black uppercase tracking-widest mt-1">
                 <ShieldCheck className="w-3 h-3" /> {authUser?.tier || t.user.tier}
               </div>
             </div>
             <button className="w-full py-3 bg-white/5 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">
                {t.user.upgrade}
             </button>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
             <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                   <Bell className="w-4 h-4 text-purple-400" />
                   <span className="text-xs font-bold text-gray-300">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-all" />
             </div>
             <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                   <Fingerprint className="w-4 h-4 text-pink-400" />
                   <span className="text-xs font-bold text-gray-300">Biometrics</span>
                </div>
                <div className="w-8 h-4 bg-white/10 rounded-full relative">
                   <div className="absolute left-1 top-1 w-2 h-2 bg-gray-500 rounded-full" />
                </div>
             </div>
          </GlassCard>
        </div>

        <div className="md:col-span-2 space-y-8">
          <GlassCard className="p-8 space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">{t.user.basicInfo}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <UserIcon className="w-3 h-3" /> {t.user.username}
                    </label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <Mail className="w-3 h-3" /> {t.user.email}
                    </label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium" 
                    />
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">{t.user.security}</h3>
              
              <button className="flex items-center gap-3 text-sm text-cyan-400 font-bold hover:underline transition-all">
                <Lock className="w-4 h-4" /> {t.user.changePassword}
              </button>
            </div>

            <div className="pt-4">
               <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-purple-500/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isSaving ? 'Saving...' : t.user.saveChanges}
               </button>
            </div>
          </GlassCard>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
