import React from 'react';
import { useTranslation } from '../App';
import { Zap, Play, Globe, Shield, Sparkles, ArrowRight, Video, Github, User, LogOut } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

interface LandingProps {
  user?: {
    id: string;
    username: string;
    email?: string;
    avatar_url?: string;
    tier: string;
  } | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onRequireAuth?: () => boolean;
}

export const Landing: React.FC<LandingProps> = ({ user, onLogin, onLogout, onRequireAuth }) => {
  const { t } = useTranslation();

  const handleLaunchApp = () => {
    if (!user && onRequireAuth) {
      onRequireAuth();
      return;
    }
    window.location.hash = '#dashboard';
  };

  const handleStartCreating = () => {
    if (!user && onRequireAuth) {
      onRequireAuth();
      return;
    }
    window.location.hash = '#create';
  };

  // Helper for the "Letter by Letter" reveal effect
  const AnimatedText = ({ text, className = "" }: { text: string; className?: string }) => {
    return (
      <span className={`inline-flex flex-wrap justify-center overflow-hidden ${className}`}>
        {text.split("").map((char, i) => (
          <span 
            key={i} 
            className="animate-text-reveal block"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    );
  };

  const Feature = ({ icon: Icon, title, desc, delay }: any) => (
    <GlassCard 
      hoverEffect 
      className="p-8 space-y-4 group animate-in slide-in-from-bottom-12 fade-in duration-1000 fill-mode-both"
      style={{ animationDelay: delay }}
    >
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-500">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm font-medium">{desc}</p>
    </GlassCard>
  );

  return (
    <div className="relative w-full bg-black overflow-hidden font-sans">
      {/* 1. Atmospheric Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* 2. Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 md:px-12 flex items-center justify-between glass-frosted transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">TikTok<span className="font-light text-gray-400">Gen</span></span>
        </div>
        
        <div className="flex items-center gap-6">
           {user ? (
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-3">
                 <img
                   src={user.avatar_url || "https://github.com/shadcn.png"}
                   alt={user.username}
                   className="w-8 h-8 rounded-full border border-white/20"
                 />
                 <span className="hidden md:block text-sm font-medium text-white">{user.username}</span>
               </div>
               <button
                 onClick={onLogout}
                 className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors"
               >
                 <LogOut className="w-4 h-4" />
               </button>
             </div>
           ) : (
             <button
               onClick={onLogin}
               className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
             >
               <Github className="w-4 h-4" /> Log In
             </button>
           )}

           {/* CTA with Border Beam */}
           <button
             onClick={handleLaunchApp}
             className="border-beam-container group relative rounded-full"
           >
             <div className="relative px-8 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-transform z-10">
               {user ? 'Dashboard' : 'Launch App'}
             </div>
             <div className="border-beam-line rounded-full" />
           </button>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Slogan */}
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-12 animate-in fade-in slide-in-from-top-6 duration-1000 fill-mode-both">
          营销短视频一键生成平台
        </h2>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000 fill-mode-both">
           <Sparkles className="w-3 h-3 animate-pulse" />
           <span>Next Gen AI Video Engine</span>
        </div>

        {/* Title with Text Reveal */}
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
          <AnimatedText text={t.landing.heroTitle} />
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 font-medium mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
          {t.landing.heroSubtitle}
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full md:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-both">
          <button
            onClick={handleStartCreating}
            className="w-full md:w-auto group relative px-10 py-5 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
          >
             <span className="relative z-10 flex items-center justify-center gap-3">
               {t.landing.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </span>
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 backdrop-blur-md">
             <Play className="w-4 h-4 fill-white" /> {t.landing.watchDemo}
          </button>
        </div>
      </section>

      {/* 4. Infinite Marquee Showcase */}
      <section className="py-20 space-y-12 relative z-10">
        <h2 className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 animate-in fade-in duration-1000 delay-1000 fill-mode-both">
          {t.landing.showcase}
        </h2>
        
        <div className="relative w-full h-[320px] mask-marquee overflow-hidden">
          <div className="absolute top-0 left-0 flex gap-6 animate-marquee whitespace-nowrap pl-6">
            {[...Array(2)].map((_, setIndex) => (
               <React.Fragment key={setIndex}>
                 {[10, 11, 12, 13, 14, 15, 16, 17].map((i) => (
                    <div 
                      key={i} 
                      className="inline-block w-[220px] h-[320px] rounded-[32px] overflow-hidden border border-white/10 relative group cursor-pointer"
                    >
                      <img 
                        src={`https://picsum.photos/id/${i + 50}/400/600`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                         <span className="text-white font-bold text-lg">Model {i}</span>
                         <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Available</span>
                      </div>
                    </div>
                 ))}
               </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 space-y-4">
           <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">{t.landing.features.title}</h2>
           <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-purple-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Feature 
             icon={Sparkles} 
             title={t.landing.features.avatar} 
             desc={t.landing.features.avatarDesc} 
             delay="0ms"
           />
           <Feature 
             icon={Globe} 
             title={t.landing.features.voice} 
             desc={t.landing.features.voiceDesc} 
             delay="150ms"
           />
           <Feature 
             icon={Shield} 
             title={t.landing.features.script} 
             desc={t.landing.features.scriptDesc} 
             delay="300ms"
           />
        </div>
      </section>

      {/* 6. Footer CTA */}
      <section className="py-20 px-6 md:px-12 relative z-10">
        <GlassCard className="max-w-5xl mx-auto p-12 md:p-24 text-center space-y-10 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-white/10 relative overflow-hidden">
           {/* Background decorative glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
           
           <h2 className="relative z-10 text-4xl md:text-6xl font-black tracking-tighter uppercase text-white">
             {t.landing.trust}
           </h2>
           
           <div className="relative z-10 flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <span className="font-black text-2xl tracking-widest">TIKTOK</span>
              <span className="font-black text-2xl tracking-widest">YOUTUBE</span>
              <span className="font-black text-2xl tracking-widest">INSTAGRAM</span>
           </div>

           <div className="relative z-10 pt-8">
             <button
               onClick={handleStartCreating}
               className="border-beam-container rounded-2xl mx-auto inline-block"
             >
                <div className="relative px-12 py-5 bg-white text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                  Start Creating Now
                </div>
                <div className="border-beam-line rounded-2xl" />
             </button>
           </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-gray-500 text-[10px] font-bold uppercase tracking-widest relative z-10 bg-black">
        <span>© 2024 TikTokGen AI.</span>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
        </div>
      </footer>
    </div>
  );
};
