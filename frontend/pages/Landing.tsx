import React from 'react';
import { useTranslation } from '../App';
import { 
  Zap, Play, Globe, Shield, Sparkles, ArrowRight, Video, Github, User, LogOut,
  TrendingUp, PenTool, Send, Brain, Newspaper, Clock, Rocket, Layers,
  Radio, MessageSquare, Eye, BarChart3
} from 'lucide-react';
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

  const FeatureCard = ({ icon: Icon, title, desc, delay, gradient, stats }: any) => (
    <GlassCard 
      hoverEffect 
      className="p-8 space-y-4 group animate-in slide-in-from-bottom-12 fade-in duration-1000 fill-mode-both"
      style={{ animationDelay: delay }}
    >
      <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center text-white group-hover:scale-110 transition-all duration-500 shadow-lg`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">{title}</h3>
        <p className="text-gray-400 leading-relaxed text-sm font-medium">{desc}</p>
      </div>
      {stats && (
        <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
          {stats.map((stat: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );

  const WorkflowStep = ({ icon: Icon, title, desc, step }: any) => (
    <div className="relative">
      <div className="flex items-start gap-6">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Icon className="w-6 h-6" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black border-2 border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-400">
            {step}
          </div>
        </div>
        <div className="flex-1 pb-8">
          <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
          <p className="text-gray-400 text-sm">{desc}</p>
        </div>
      </div>
      {step < 4 && (
        <div className="absolute left-7 top-14 w-0.5 h-full bg-gradient-to-b from-cyan-500/50 to-transparent" />
      )}
    </div>
  );

  const HotspotCard = ({ title, source, trend, avatar }: any) => (
    <GlassCard className="p-6 space-y-3 group cursor-pointer hover:bg-white/5 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-orange-400">
          <Radio className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{source}</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
              {trend}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="relative w-full bg-black overflow-hidden font-sans">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 md:px-12 flex items-center justify-between glass-frosted transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">AI<span className="font-light text-gray-400">Trend</span></span>
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

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000 fill-mode-both">
           <TrendingUp className="w-3 h-3 animate-pulse" />
           <span>AI-Powered Content Automation</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1] mb-6">
          <AnimatedText text={t.landing.heroTitle} />
        </h1>

        <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-400 font-medium mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
          {t.landing.heroSubtitle}
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full md:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-both">
          <button
            onClick={handleStartCreating}
            className="w-full md:w-auto group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl font-bold text-sm uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]"
          >
             <span className="relative z-10 flex items-center justify-center gap-3">
               {t.landing.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </span>
          </button>

          <button className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 backdrop-blur-md">
             <Play className="w-4 h-4 fill-white" /> {t.landing.watchDemo}
          </button>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl w-full">
          {[
            { value: '50+', label: '热点源' },
            { value: '99%', label: '去重率' },
            { value: '30s', label: '发布耗时' },
            { value: '10k+', label: '创作者' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-32 px-6 md:px-12 relative z-10 bg-gradient-to-b from-black/50 to-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">{t.landing.workflow.title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.landing.workflow.desc}</p>
            <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-purple-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <WorkflowStep 
              icon={TrendingUp}
              title={t.landing.workflow.step1}
              desc={t.landing.workflow.step1Desc}
              step={1}
            />
            <WorkflowStep 
              icon={Brain}
              title={t.landing.workflow.step2}
              desc={t.landing.workflow.step2Desc}
              step={2}
            />
            <WorkflowStep 
              icon={PenTool}
              title={t.landing.workflow.step3}
              desc={t.landing.workflow.step3Desc}
              step={3}
            />
            <WorkflowStep 
              icon={Send}
              title={t.landing.workflow.step4}
              desc={t.landing.workflow.step4Desc}
              step={4}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 space-y-4">
           <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">{t.landing.features.title}</h2>
           <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-purple-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <FeatureCard 
             icon={TrendingUp} 
             title={t.landing.features.hotspot} 
             desc={t.landing.features.hotspotDesc} 
             delay="0ms"
             gradient="bg-gradient-to-br from-orange-500 to-red-500"
             stats={[
               { value: '50+', label: '数据源' },
               { value: '24/7', label: '实时更新' },
               { value: '99%', label: '去重率' },
             ]}
           />
           <FeatureCard 
             icon={Brain} 
             title={t.landing.features.ai} 
             desc={t.landing.features.aiDesc} 
             delay="150ms"
             gradient="bg-gradient-to-br from-purple-500 to-pink-500"
             stats={[
               { value: '5+', label: '智能体' },
               { value: '4层', label: '分析框架' },
               { value: '10x', label: '效率提升' },
             ]}
           />
           <FeatureCard 
             icon={Video} 
             title={t.landing.features.video} 
             desc={t.landing.features.videoDesc} 
             delay="300ms"
             gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
             stats={[
               { value: '30s', label: '生成耗时' },
               { value: '1080p', label: '最高画质' },
               { value: '100+', label: '形象库' },
             ]}
           />
           <FeatureCard 
             icon={Newspaper} 
             title={t.landing.features.article} 
             desc={t.landing.features.articleDesc} 
             delay="450ms"
             gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
             stats={[
               { value: '1000+', label: '字数/篇' },
               { value: '1min', label: '创作耗时' },
               { value: '85%', label: '原创率' },
             ]}
           />
           <FeatureCard 
             icon={Send} 
             title={t.landing.features.publish} 
             desc={t.landing.features.publishDesc} 
             delay="600ms"
             gradient="bg-gradient-to-br from-amber-500 to-orange-500"
             stats={[
               { value: '10+', label: '平台' },
               { value: '自动', label: '发布' },
               { value: '实时', label: '状态' },
             ]}
           />
           <FeatureCard 
             icon={Clock} 
             title={t.landing.features.auto} 
             desc={t.landing.features.autoDesc} 
             delay="750ms"
             gradient="bg-gradient-to-br from-violet-500 to-indigo-500"
             stats={[
               { value: '定时', label: '任务' },
               { value: '每天', label: '更新' },
               { value: '一键', label: '启用' },
             ]}
           />
        </div>
      </section>

      {/* Live Hotspot Section */}
      <section className="py-32 px-6 md:px-12 relative z-10 bg-gradient-to-b from-black to-black/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white">{t.landing.hotspot.title}</h2>
              <p className="text-gray-400 mt-2">{t.landing.hotspot.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400 font-bold">实时更新</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: '2026年上半年AI行业投融资报告出炉', source: '36氪', trend: '🔥 +234%' },
              { title: '字节跳动推出新一代AI视频生成模型', source: 'TechCrunch', trend: '🔥 +189%' },
              { title: '马斯克宣布xAI完成新一轮融资', source: 'Twitter', trend: '🔥 +156%' },
              { title: '国产大模型市场份额首次超越国外', source: '新浪财经', trend: '📈 +123%' },
              { title: 'AI创作平台用户数突破1亿', source: '艾瑞咨询', trend: '📈 +98%' },
              { title: '苹果AI功能即将落地iOS 18', source: 'MacRumors', trend: '📊 +76%' },
            ].map((item, i) => (
              <HotspotCard 
                key={i}
                title={item.title}
                source={item.source}
                trend={item.trend}
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all">
              <Eye className="w-4 h-4" />
              查看全部热点
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">{t.landing.showcase.title}</h2>
          <p className="text-gray-400">{t.landing.showcase.desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-red-400">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white">公众号文章</h4>
                <p className="text-sm text-gray-500">AI创作 · 自动发布</p>
              </div>
            </div>
            <div className="prose prose-invert">
              <p className="text-gray-300 text-sm leading-relaxed">
                "AI行业在2026年上半年迎来了爆发式增长，投融资总额突破500亿美元。各大科技巨头纷纷加码AI赛道，国产大模型竞争力持续提升..."
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-400">阅读量: 12,580</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400">点赞: 328</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white">数字人视频</h4>
                <p className="text-sm text-gray-500">AI生成 · 一键发布</p>
              </div>
            </div>
            <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
              <img 
                src="https://picsum.photos/id/237/800/450" 
                alt="Video Preview"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-400">播放量: 89,234</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400">评论: 1,256</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 md:px-12 relative z-10">
        <GlassCard className="max-w-5xl mx-auto p-12 md:p-24 text-center space-y-10 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-white/10 relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
           
           <h2 className="relative z-10 text-4xl md:text-6xl font-black tracking-tighter uppercase text-white">
             {t.landing.trust}
           </h2>
           
           <div className="relative z-10 flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <span className="font-black text-2xl tracking-widest">WEIBO</span>
              <span className="font-black text-2xl tracking-widest">ZHIHU</span>
              <span className="font-black text-2xl tracking-widest">WECHAT</span>
              <span className="font-black text-2xl tracking-widest">TIKTOK</span>
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
        <span>© 2024 AI Trend Publisher.</span>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
};