import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Landing } from './pages/Landing';
import { Dashboard, NotificationProvider } from './pages/Dashboard';
import { QuickCreate } from './pages/QuickCreate';
import { SimpleCreate } from './pages/SimpleCreate';
import { AssetsStudio } from './pages/AssetsStudio';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { LoginModal } from './components/LoginModal';
import {
  LayoutGrid,
  Zap,
  Layers,
  LogOut,
  Languages,
  User as UserIcon,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Home,
  Github,
  CheckCircle,
  Settings as SettingsIcon,
  ImagePlus
} from 'lucide-react';
import { Locale } from './types';
import { translations } from './i18n';
import { useAuth } from './services/hooks';
import { authApi } from './services/api';

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations.en;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};

const App = () => {
  // Auth state
  const { user, loading: authLoading, login, loginWithPassword, register, logout } = useAuth();

  // Default to landing page if no hash
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');
  const [locale, setLocale] = useState<Locale>('zh');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const t = translations[locale];

  // Handle GitHub OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      login(code)
        .then(() => {
          // Show success message
          setLoginSuccess(true);
          // Clean up the URL
          window.history.replaceState({}, '', window.location.pathname);
          // Navigate to dashboard after a short delay
          setTimeout(() => {
            setLoginSuccess(false);
            window.location.hash = '#dashboard';
          }, 1500);
        })
        .catch((error) => {
          console.error('Login failed:', error);
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, [login]);

  useEffect(() => {
    const handleHashChange = () => {
      // Default to #home if hash is empty
      const hash = window.location.hash || '#home';
      setCurrentHash(hash);
      setIsProfileOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check
    if (!window.location.hash) {
       window.location.hash = '#home';
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  const handleLogin = async () => {
    try {
      const { auth_url } = await authApi.getGitHubAuthURL();
      window.location.href = auth_url;
    } catch (error) {
      console.error('Failed to get GitHub auth URL:', error);
      alert('Failed to initiate login. Please try again.');
    }
  };

  const handlePasswordLogin = async (username: string, password: string) => {
    await loginWithPassword(username, password);
    setLoginSuccess(true);
    setTimeout(() => {
      setLoginSuccess(false);
      window.location.hash = '#dashboard';
    }, 1500);
  };

  const handleRegister = async (username: string, password: string) => {
    await register(username, password);
    setLoginSuccess(true);
    setTimeout(() => {
      setLoginSuccess(false);
      window.location.hash = '#dashboard';
    }, 1500);
  };

  const handleRequireAuth = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      navigateTo('#home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleBillingClick = () => {
    alert(t.humor.billing);
    setIsProfileOpen(false);
  };

  const isLanding = currentHash === '#home';

  const renderPage = () => {
    // Show auth loading state
    if (authLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-black">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    // Pages that require authentication
    const protectedPages = ['#create', '#simple-create', '#assets', '#profile', '#settings', '#dashboard'];
    if (protectedPages.includes(currentHash) && !user) {
      return (
        <Landing
          user={user}
          onLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onRequireAuth={handleRequireAuth}
        />
      );
    }

    switch (currentHash) {
      case '#create': return <QuickCreate />;
      case '#simple-create': return <SimpleCreate />;
      case '#assets': return <AssetsStudio />;
      case '#profile': return <Profile />;
      case '#settings': return <Settings />;
      case '#dashboard': return <Dashboard />;
      case '#home':
      default: return (
        <Landing
          user={user}
          onLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onRequireAuth={handleRequireAuth}
        />
      );
    }
  };

  const navItemClass = (hash: string) => `
    w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
    ${currentHash === hash 
      ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-300 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}
  `;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      <NotificationProvider>
        <div className="flex min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 overflow-hidden">

        {/* Login Success Toast */}
        {loginSuccess && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl shadow-2xl shadow-green-500/20 backdrop-blur-xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-bold text-green-300">{t.auth.loginSuccess || 'Login Successful!'}</p>
                <p className="text-sm text-green-400/70">{t.auth.redirecting || 'Redirecting to dashboard...'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onGithubLogin={handleLogin}
          onPasswordLogin={handlePasswordLogin}
          onRegister={handleRegister}
        />

        {/* Render Sidebar ONLY if NOT on Landing Page */}
        {!isLanding && (
          <aside className="hidden md:flex w-20 lg:w-64 flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl fixed h-full z-50">
            <div className="p-6 flex items-center gap-3">
              <div 
                onClick={() => navigateTo('#home')}
                className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                 <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden lg:block bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                TikTok<span className="font-light">Gen</span>
              </span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-8">
                <button onClick={() => navigateTo('#home')} className={navItemClass('#home')}>
                    <Home className="w-5 h-5" />
                    <span className="hidden lg:block">Home</span>
                </button>
                <button onClick={() => navigateTo('#dashboard')} className={navItemClass('#dashboard')}>
                    <LayoutGrid className="w-5 h-5" />
                    <span className="hidden lg:block">{t.nav.dashboard}</span>
                </button>
                <button onClick={() => navigateTo('#create')} className={navItemClass('#create')}>
                    <Zap className="w-5 h-5" />
                    <span className="hidden lg:block font-medium">{t.nav.create}</span>
                </button>
                <button onClick={() => navigateTo('#simple-create')} className={navItemClass('#simple-create')}>
                    <ImagePlus className="w-5 h-5" />
                    <span className="hidden lg:block font-medium">{locale === 'zh' ? '简单创作' : 'Simple Create'}</span>
                </button>
                <button onClick={() => navigateTo('#assets')} className={navItemClass('#assets')}>
                    <Layers className="w-5 h-5" />
                    <span className="hidden lg:block">{t.nav.assets}</span>
                </button>
            </nav>

            <div className="p-4 space-y-2 border-t border-white/5 relative" ref={profileRef}>
                 {isProfileOpen && (
                   <div className="absolute bottom-full left-4 right-4 mb-4 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-300 z-[60]">
                      <div className="relative space-y-5">
                        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                          <div className="relative">
                            <img src={user?.avatar_url || "https://github.com/shadcn.png"} className="w-12 h-12 rounded-full border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/20" alt="Avatar" />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900" />
                          </div>
                          <div>
                            <p className="font-bold text-base">{user?.username || 'Guest'}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                              <ShieldCheck className="w-3 h-3" /> {user?.tier || 'free'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="p-3 bg-white/5 rounded-xl space-y-2">
                            <div className="flex justify-between text-[11px] font-medium">
                              <span className="text-gray-400">{t.nav.usage}</span>
                              <span className="text-white">42 / 60 {t.user.minutes}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 w-[70%] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-1">
                            <button onClick={() => { navigateTo('#profile'); setIsProfileOpen(false); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-gray-300 transition-all group">
                              <div className="flex items-center gap-3">
                                <UserIcon className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm font-medium">{t.nav.profile}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </button>

                            <button onClick={() => { navigateTo('#settings'); setIsProfileOpen(false); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-gray-300 transition-all group">
                              <div className="flex items-center gap-3">
                                <SettingsIcon className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium">{t.nav.settings || 'API Settings'}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </button>

                            <button onClick={handleBillingClick} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-gray-300 transition-all group">
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium">{t.nav.billing}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </button>

                            <button
                              onClick={() => { setLocale(locale === 'en' ? 'zh' : 'en'); setIsProfileOpen(false); }}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-gray-300 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <Languages className="w-4 h-4 text-pink-400" />
                                <span className="text-sm font-medium">{locale === 'en' ? '中文 (ZH)' : 'English (EN)'}</span>
                              </div>
                            </button>
                          </div>

                          <div className="pt-2 border-t border-white/10">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all">
                              <LogOut className="w-4 h-4" />
                              <span className="text-sm font-bold">{t.nav.logout}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                   </div>
                 )}

                 <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${isProfileOpen ? 'bg-white/10 shadow-lg shadow-black/50 ring-1 ring-white/20' : 'hover:bg-white/5'} cursor-pointer group`}
                 >
                    <div className="relative">
                      <img src={user?.avatar_url || "https://github.com/shadcn.png"} alt="User" className="w-10 h-10 rounded-xl border border-white/20 group-hover:border-cyan-400 transition-all" />
                    </div>
                    <div className="hidden lg:flex flex-col items-start overflow-hidden">
                        <span className="text-sm text-white font-bold truncate w-full tracking-tight">{user?.username || 'Guest'}</span>
                        <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-widest opacity-80">{user?.tier || 'free'}</span>
                    </div>
                 </button>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-500 overflow-y-auto overflow-x-hidden h-screen custom-scrollbar ${isLanding ? 'ml-0' : 'md:ml-20 lg:ml-64'}`}>
            <div className="relative">
               {/* Global Background for App Pages (Not Landing) */}
               {!isLanding && (
                 <>
                   <div className="fixed top-0 left-0 w-full h-[500px] bg-purple-600/10 blur-[150px] pointer-events-none" />
                   <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-cyan-600/5 blur-[150px] pointer-events-none" />
                 </>
               )}
              {renderPage()}
            </div>
        </main>
      </div>
      </NotificationProvider>
    </LanguageContext.Provider>
  );
};

export default App;
