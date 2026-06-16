import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Asset, AssetType, AudioMode, VideoGenerationMode } from '../types';
import {
  Play, Mic, User as UserIcon, FileText, Wand2, Loader2, Sparkles,
  Edit3, Library, Save, Smile, Zap, Volume2, Waves, X, Search, CheckCircle2, Music, Pause, Upload
} from 'lucide-react';
import { useTranslation } from '../App';
import { useAssets, useProjects } from '../services/hooks';
import { assetsApi, generationApi } from '../services/api';

type StoryboardFrame = {
  asset_id: string;
  scene_index: number;
  prompt: string;
  video_prompt?: string;
  image_url: string;
};

export const QuickCreate: React.FC = () => {
  const { t, locale } = useTranslation();
  const isZh = locale === 'zh';
  const { assets: systemAssets, loading: assetsLoading, refetch: refetchAssets } = useAssets();
  const { createProject } = useProjects();

  // Filter assets by type
  const avatars = systemAssets.filter(a => a.type === 'avatar');
  const voices = systemAssets.filter(a => a.type === 'voice');
  const scripts = systemAssets.filter(a => a.type === 'script');

  // Selected assets
  const [selectedAvatar, setSelectedAvatar] = useState<Asset | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Asset | null>(null);
  const [selectedScript, setSelectedScript] = useState<Asset | null>(null);

  // UI state
  const [audioMode, setAudioMode] = useState<AudioMode>('tts');
  const [videoGenerationMode, setVideoGenerationMode] = useState<VideoGenerationMode>('tts_required');
  const [scriptMode, setScriptMode] = useState<'library' | 'editor'>('library');
  const [customScript, setCustomScript] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('professional');
  const [emotionMode, setEmotionMode] = useState<'preset' | 'vector' | 'audio_ref' | 'text_ref'>('preset');
  const [emotionVector, setEmotionVector] = useState<number[]>([0.05, 0, 0, 0, 0, 0, 0.05, 0.9]);
  const [emotionText, setEmotionText] = useState('');
  const [emotionAlpha, setEmotionAlpha] = useState(0.6);
  const [emotionAudioAssetId, setEmotionAudioAssetId] = useState('');
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingEmotionAudio, setIsUploadingEmotionAudio] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSynthesizingPreview, setIsSynthesizingPreview] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerType, setPickerType] = useState<AssetType | null>(null);
  const zhStoryboardStyle = '电影感 TikTok 商品广告，真实商业摄影风格';
  const enStoryboardStyle = 'cinematic TikTok product ad';
  const [storyboardStyle, setStoryboardStyle] = useState(zhStoryboardStyle);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [storyboardFrames, setStoryboardFrames] = useState<StoryboardFrame[]>([]);
  const [selectedStoryboardFrameIds, setSelectedStoryboardFrameIds] = useState<string[]>([]);
  const [storyboardPreviewFrame, setStoryboardPreviewFrame] = useState<StoryboardFrame | null>(null);

  // Voice audio playback state
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Avatar preview modal state
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  // Update defaults when assets load
  useEffect(() => {
    if (!selectedAvatar && avatars.length > 0) setSelectedAvatar(avatars[0]);
    if (!selectedVoice && voices.length > 0) setSelectedVoice(voices[0]);
    if (!selectedScript && scripts.length > 0) setSelectedScript(scripts[0]);
  }, [systemAssets]);

  // Stop voice audio when voice changes or picker closes
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
      setIsVoicePlaying(false);
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setIsPreviewPlaying(false);
    }
    setPreviewAudioUrl(null);
  }, [selectedVoice]);

  // Clear preview result when script source changes
  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);
    setPreviewAudioUrl(null);
    setStoryboardFrames([]);
    setSelectedStoryboardFrameIds([]);
    setStoryboardPreviewFrame(null);
  }, [selectedScript, customScript]);

  useEffect(() => {
    setStoryboardFrames([]);
    setSelectedStoryboardFrameIds([]);
    setStoryboardPreviewFrame(null);
  }, [selectedAvatar]);

  useEffect(() => {
    setStoryboardFrames([]);
    setSelectedStoryboardFrameIds([]);
    setStoryboardPreviewFrame(null);
  }, [prompt, storyboardStyle]);

  useEffect(() => {
    return () => {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    setStoryboardStyle((current) => {
      if (locale === 'zh' && current === enStoryboardStyle) return zhStoryboardStyle;
      if (locale === 'en' && current === zhStoryboardStyle) return enStoryboardStyle;
      return current;
    });
  }, [locale]);

  const emotions = [
    { id: 'happy', label: t.create.emotions.happy, icon: <Smile className="w-4 h-4" /> },
    { id: 'professional', label: t.create.emotions.professional, icon: <Zap className="w-4 h-4" /> },
    { id: 'gentle', label: t.create.emotions.gentle, icon: <Volume2 className="w-4 h-4" /> },
    { id: 'excited', label: t.create.emotions.excited, icon: <Sparkles className="w-4 h-4" /> }
  ];
  const previewEmotionLabel =
    emotionMode === 'preset'
      ? (emotions.find(e => e.id === selectedEmotion)?.label || selectedEmotion)
      : emotionMode === 'vector'
      ? '8D Vector'
      : emotionMode === 'text_ref'
      ? 'Text Ref'
      : 'Audio Ref';
  const emotionDimensions = [
    "高兴", "愤怒", "悲伤", "害怕", "厌恶", "忧郁", "惊讶", "平静"
  ];
  const performanceTags = isZh
    ? ['😊 友好亲切', '💪 自信有力', '😎 酷感自然', '🎉 兴奋热情', '😐 严肃专业', '🤫 轻声低语']
    : ['😊 Friendly', '💪 Confident', '😎 Cool', '🎉 Excited', '😐 Serious', '🤫 Whispering'];

  const getEmotionPayload = () => {
    if (emotionMode === 'vector') {
      return {
        emotion_mode: 'vector' as const,
        emotion_vector: emotionVector,
      };
    }
    if (emotionMode === 'text_ref') {
      return {
        emotion_mode: 'text_ref' as const,
        emotion_text: emotionText.trim() || undefined,
      };
    }
    if (emotionMode === 'audio_ref') {
      return {
        emotion_mode: 'audio_ref' as const,
        emotion_alpha: emotionAlpha,
        emotion_audio_asset_id: emotionAudioAssetId || undefined,
      };
    }
    return {
      emotion_mode: 'preset' as const,
      emotion: selectedEmotion,
    };
  };

  const getCurrentScript = () => {
    if (scriptMode === 'editor') {
      return { text: customScript, id: undefined as string | undefined };
    }
    return { text: selectedScript?.content || '', id: selectedScript?.id };
  };

  const toggleStoryboardFrame = (assetId: string) => {
    setSelectedStoryboardFrameIds((prev) =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleEmotionVectorChange = (index: number, value: number) => {
    setEmotionVector((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const uploadVoiceAsset = async (file: File, asEmotionReference = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, '') || `Voice ${Date.now()}`);

    if (asEmotionReference) {
      setIsUploadingEmotionAudio(true);
    } else {
      setIsUploadingVoice(true);
    }

    try {
      const uploaded = await assetsApi.uploadVoice(formData);
      await refetchAssets();
      if (asEmotionReference) {
        setEmotionAudioAssetId(uploaded.id);
      } else {
        setSelectedVoice(uploaded);
      }
    } finally {
      if (asEmotionReference) {
        setIsUploadingEmotionAudio(false);
      } else {
        setIsUploadingVoice(false);
      }
    }
  };

  // Play/Pause voice audio
  const handleVoicePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!selectedVoice?.file_url) return;

    if (isVoicePlaying && voiceAudioRef.current) {
      // Pause
      voiceAudioRef.current.pause();
      setIsVoicePlaying(false);
    } else {
      // Play
      if (voiceAudioRef.current) {
        voiceAudioRef.current.play();
        setIsVoicePlaying(true);
      } else {
        const audio = new Audio(selectedVoice.file_url);
        voiceAudioRef.current = audio;
        audio.play();
        setIsVoicePlaying(true);

        audio.onended = () => {
          setIsVoicePlaying(false);
          voiceAudioRef.current = null;
        };

        audio.onerror = () => {
          setIsVoicePlaying(false);
          voiceAudioRef.current = null;
        };
      }
    }
  };

  const handleSynthesizePreview = async () => {
    if (!selectedVoice) return;
    setIsSynthesizingPreview(true);

    // 根据 scriptMode 决定使用哪个脚本内容
    let scriptText: string | undefined;
    if (scriptMode === 'editor') {
      scriptText = customScript;
    } else {
      scriptText = selectedScript?.content;
    }

    if (!scriptText) {
      setIsSynthesizingPreview(false);
      return;
    }

    try {
      // Call API to generate audio preview
      const result = await generationApi.audioPreview({
        voice_id: selectedVoice.id,
        text: scriptText.substring(0, 200), // Limit preview text
        emotion: selectedEmotion,
        ...getEmotionPayload(),
      });
      setPreviewAudioUrl(result.audio_url);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setIsPreviewPlaying(false);
    } catch (error: any) {
      console.error('Preview synth failed:', error);
      alert(error?.message || 'Preview synth failed');
    } finally {
      setIsSynthesizingPreview(false);
    }
  };

  const handleTogglePreviewPlayback = async () => {
    if (!previewAudioUrl) {
      alert('请先合成');
      return;
    }

    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      return;
    }

    try {
      if (!previewAudioRef.current || previewAudioRef.current.src !== previewAudioUrl) {
        const audio = new Audio(previewAudioUrl);
        previewAudioRef.current = audio;
        audio.onended = () => setIsPreviewPlaying(false);
        audio.onpause = () => setIsPreviewPlaying(false);
        audio.onerror = () => setIsPreviewPlaying(false);
      }
      await previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    } catch (error: any) {
      console.error('Preview play failed:', error);
      setIsPreviewPlaying(false);
      alert(error?.message || 'Preview play failed');
    }
  };

  const handleSavePreviewAudio = async () => {
    if (!previewAudioUrl || !selectedVoice) {
      alert('请先合成');
      return;
    }
    // 根据 scriptMode 决定使用哪个脚本内容
    let scriptText: string | undefined;
    if (scriptMode === 'editor') {
      scriptText = customScript;
    } else {
      scriptText = selectedScript?.content;
    }
    setIsSavingPreview(true);
    try {
      const savedAsset = await generationApi.saveAudioPreview({
        audio_url: previewAudioUrl,
        voice_id: selectedVoice.id,
        text: scriptText?.substring(0, 200),
        title: `${selectedVoice.title}-preview-${new Date().toLocaleString()}`,
      });
      await refetchAssets();
      setSelectedVoice(savedAsset);
      alert('已保存到音色库');
    } catch (error: any) {
      console.error('Save preview failed:', error);
      alert(error?.message || '保存失败');
    } finally {
      setIsSavingPreview(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!customScript) return;

    try {
      await assetsApi.createScript({
        title: `Custom Script ${new Date().toLocaleDateString()}`,
        content: customScript,
        tags: 'Custom'
      });
      alert(t.create.labels.saveScript + " ✅");
      setCustomScript('');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save script');
    }
  };

  const handleGenerateStoryboard = async () => {
    const { text } = getCurrentScript();
    if (!text.trim()) {
      alert(t.create.placeholders.script);
      return;
    }
    setIsGeneratingStoryboard(true);
    try {
      const result = await generationApi.generateStoryboard({
        script_content: text,
        user_prompt: prompt,
        style: storyboardStyle,
        frame_count: 3,
        aspect_ratio: '9:16',
        reference_image_url: selectedAvatar?.file_url || undefined,
        language: locale,
      });
      setStoryboardFrames(result.frames);
      setSelectedStoryboardFrameIds(result.frames.map(frame => frame.asset_id));
      await refetchAssets();
    } catch (error: any) {
      console.error('Storyboard generation failed:', error);
      alert('Failed to generate storyboard: ' + (error?.message || error));
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAvatar || !selectedVoice) {
      alert(t.create.labels.selectAsset);
      return;
    }

    // 根据 scriptMode 决定使用哪个脚本内容
    let scriptText: string | undefined;
    let scriptIdForSubmit: string | undefined;

    if (videoGenerationMode === 'audio_sync' || audioMode === 'tts') {
      const currentScript = getCurrentScript();
      scriptText = currentScript.text;
      scriptIdForSubmit = currentScript.id;

      if (!scriptText) {
        alert(t.create.placeholders.script);
        return;
      }
    }

    // 在直接使用音频模式下验证音色有音频文件
    if (videoGenerationMode === 'tts_required' && audioMode === 'direct' && !selectedVoice.file_url) {
      alert(t.create.labels.noAudioFile);
      return;
    }

    const selectedStoryboardIds = videoGenerationMode === 'audio_sync'
      ? selectedStoryboardFrameIds.filter(id => storyboardFrames.some(frame => frame.asset_id === id))
      : [];

    setIsSubmitting(true);

    try {
      const project = await createProject({
        title: `Video Project - ${new Date().toLocaleDateString()}`,
        avatar_id: selectedAvatar.id,
        voice_id: selectedVoice.id,
        script_id: (videoGenerationMode === 'audio_sync' || audioMode === 'tts') ? scriptIdForSubmit : undefined,
        script_content: (videoGenerationMode === 'audio_sync' || audioMode === 'tts') ? scriptText : undefined,
        emotion: selectedEmotion,
        ...getEmotionPayload(),
        performance_prompt: prompt,
        resolution: '480p',
        use_voice_audio_directly: videoGenerationMode === 'tts_required' && audioMode === 'direct',
        video_generation_mode: videoGenerationMode,
        storyboard_asset_ids: selectedStoryboardIds,
        storyboard_mode: videoGenerationMode === 'audio_sync' && selectedStoryboardIds.length > 0 ? 'keyframes' : 'none',
        language: locale,
      });

      setIsSubmitting(false);
      alert(t.create.alert);
      window.location.hash = '#dashboard';
    } catch (error: any) {
      setIsSubmitting(false);
      alert('Failed to create project: ' + error.message);
    }
  };

  const selectAsset = (asset: Asset) => {
    // Stop any playing audio when selecting new asset
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
      setIsVoicePlaying(false);
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setIsPreviewPlaying(false);
    }

    if (asset.type === 'avatar') setSelectedAvatar(asset);
    if (asset.type === 'voice') setSelectedVoice(asset);
    if (asset.type === 'script') setSelectedScript(asset);
    setPickerType(null);
  };

  // Handle avatar preview
  const handleAvatarPreview = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    setAvatarPreviewUrl(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400 drop-shadow-2xl">
          {t.create.title}
        </h1>
        <p className="text-gray-400 text-xl font-light">{t.create.subtitle}</p>
      </div>

      {assetsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Step 1: Avatar */}
            <div className="space-y-4">
              <h3 className="text-cyan-400 font-bold flex items-center gap-3 text-lg">
                <span className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-sm border border-cyan-500/40 font-black">1</span>
                {t.create.steps.face}
              </h3>
              <GlassCard onClick={() => setPickerType('avatar' as any)} hoverEffect className="h-[450px] flex flex-col relative group overflow-hidden">
                {selectedAvatar?.file_url ? (
                  <img src={selectedAvatar.file_url} alt="Avatar" className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-slate-800 absolute inset-0 flex items-center justify-center">
                    <UserIcon className="w-20 h-20 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-6 w-full space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-2xl text-white tracking-tight truncate uppercase">{selectedAvatar?.title || t.create.placeholders.avatar}</p>
                      <p className="text-xs text-cyan-300/80 font-bold tracking-widest uppercase">{selectedAvatar?.metadata?.tags?.join(' • ')}</p>
                    </div>
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur group-hover:bg-cyan-500 transition-all ml-4">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                    {t.create.labels.swap}
                  </button>
                </div>
              </GlassCard>
            </div>

            {/* Step 2: Voice */}
            <div className="space-y-4">
              <h3 className="text-pink-400 font-bold flex items-center gap-3 text-lg">
                <span className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-sm border border-pink-500/40 font-black">2</span>
                {t.create.steps.voice}
              </h3>
              <div className="space-y-4">
                <GlassCard className="h-[260px] p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full group-hover:bg-pink-500/20 transition-all" />
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xl text-white truncate tracking-tight uppercase">{selectedVoice?.title || t.create.placeholders.voice}</p>
                      <p className="text-xs text-pink-300 font-bold uppercase tracking-tighter opacity-70">{selectedVoice?.metadata?.tags?.join(' • ')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-pink-300/60 font-black uppercase tracking-widest">
                      <span>{t.create.labels.qualityOptimization}</span>
                      <span>{t.create.labels.ready100}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 w-full animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerType('voice' as any);
                      }}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all text-gray-400 group-hover:text-white group-hover:border-white/10"
                    >
                      {t.create.labels.swap}
                    </button>
                    <label className="w-full py-2.5 bg-pink-500/10 hover:bg-pink-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest border border-pink-500/30 transition-all text-pink-200 text-center cursor-pointer block">
                      {isUploadingVoice ? 'UPLOADING...' : 'UPLOAD NEW VOICE'}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={isUploadingVoice}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            await uploadVoiceAsset(file, false);
                          } catch (error: any) {
                            alert('Failed to upload voice: ' + error.message);
                          } finally {
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                </GlassCard>

                {/* Voice Preview Card with Play/Pause */}
                <GlassCard className="p-5 space-y-4 bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t.create.labels.cloningStatus}</span>
                    </div>
                    {selectedVoice?.file_url && (
                      <button
                        onClick={handleVoicePlayPause}
                        className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg transition-all text-xs font-bold"
                      >
                        {isVoicePlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            {t.create.labels.pauseVoice}
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            {t.create.labels.playVoice}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium leading-relaxed italic">
                    {t.create.labels.cloningDesc.replace('{voice}', selectedVoice?.title || '')}
                  </div>
                </GlassCard>

                {/* Audio Mode Switcher */}
                <GlassCard className="p-5 space-y-4 bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Music className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t.create.audioMode.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAudioMode('tts')}
                      className={`p-3 rounded-xl transition-all border text-left ${audioMode === 'tts' ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Volume2 className={`w-4 h-4 ${audioMode === 'tts' ? 'text-purple-300' : 'text-gray-500'}`} />
                        <span className={`text-xs font-bold ${audioMode === 'tts' ? 'text-purple-300' : 'text-gray-400'}`}>{t.create.audioMode.tts}</span>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-relaxed">{t.create.audioMode.ttsDesc}</p>
                    </button>
                    <button
                      onClick={() => setAudioMode('direct')}
                      className={`p-3 rounded-xl transition-all border text-left ${audioMode === 'direct' ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Music className={`w-4 h-4 ${audioMode === 'direct' ? 'text-purple-300' : 'text-gray-500'}`} />
                        <span className={`text-xs font-bold ${audioMode === 'direct' ? 'text-purple-300' : 'text-gray-400'}`}>{t.create.audioMode.direct}</span>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-relaxed">{t.create.audioMode.directDesc}</p>
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Step 3: Script */}
            <div className="space-y-4">
              <h3 className="text-purple-400 font-bold flex items-center gap-3 text-lg">
                <span className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-sm border border-purple-500/40 font-black">3</span>
                {t.create.steps.content}
              </h3>
              <div className="space-y-4">
                {videoGenerationMode === 'tts_required' && audioMode === 'direct' ? (
                  /* Direct Audio Mode - Show info instead of script selection */
                  <GlassCard className="h-[350px] p-6 flex flex-col items-center justify-center relative overflow-hidden bg-white/[0.03]">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
                    <div className="relative z-10 text-center space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Music className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-xl text-purple-300 tracking-tight uppercase">{t.create.labels.audioModeInfo}</p>
                        <p className="text-sm text-gray-500 mt-2 italic">
                          {t.create.labels.usingAudioFrom.replace('{voice}', selectedVoice?.title || '')}
                        </p>
                      </div>
                      {selectedVoice?.file_url && (
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-bold">{t.create.labels.audioFileReady}</span>
                        </div>
                      )}
                      {!selectedVoice?.file_url && (
                        <div className="flex items-center justify-center gap-2 text-red-400">
                          <X className="w-4 h-4" />
                          <span className="text-xs font-bold">{t.create.labels.noAudioFile}</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ) : (
                  <>
                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                      <button onClick={() => setScriptMode('library')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${scriptMode === 'library' ? 'bg-white/10 text-white shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}>
                        <Library className="w-3.5 h-3.5" /> {t.create.labels.library}
                      </button>
                      <button onClick={() => setScriptMode('editor')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${scriptMode === 'editor' ? 'bg-white/10 text-white shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}>
                        <Edit3 className="w-3.5 h-3.5" /> {t.create.labels.editor}
                      </button>
                    </div>

                    <GlassCard className="h-[350px] p-6 flex flex-col relative overflow-hidden bg-white/[0.03]">
                      {scriptMode === 'library' ? (
                        <div className="flex flex-col h-full">
                          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            <h4 className="font-black text-xl text-purple-300 tracking-tight uppercase">{selectedScript?.title}</h4>
                            <div className="h-0.5 w-12 bg-purple-500/30 rounded-full" />
                            <p className="text-sm text-gray-300 leading-relaxed font-medium italic">"{selectedScript?.content}"</p>
                          </div>
                          <button onClick={() => setPickerType('script')} className="mt-4 w-full py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-[10px] hover:bg-purple-500 hover:text-white transition-all uppercase tracking-widest">
                            {t.create.labels.swap}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full space-y-4">
                          <textarea
                            value={customScript}
                            onChange={(e) => setCustomScript(e.target.value)}
                            placeholder={t.create.placeholders.script}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white resize-none font-medium leading-relaxed custom-scrollbar"
                          />
                          <button
                            onClick={handleSaveToLibrary}
                            disabled={!customScript}
                            className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 uppercase tracking-widest"
                          >
                            <Save className="w-3.5 h-3.5" /> {t.create.labels.saveScript}
                          </button>
                        </div>
                      )}
                    </GlassCard>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,0.9fr)_minmax(480px,1.1fr)] gap-5 items-start pb-12">
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400/10 rounded-lg">
                  <Wand2 className="w-5 h-5 text-yellow-400" />
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tighter">{t.create.labels.prompt}</h4>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.create.placeholders.prompt}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-y min-h-28 font-medium custom-scrollbar transition-all leading-relaxed"
              />
              <div className="flex flex-wrap gap-2">
                {performanceTags.map(tag => (
                  <button key={tag} onClick={() => setPrompt(p => p ? `${p}, ${tag}` : tag)} className="px-4 py-1.5 bg-white/5 hover:bg-white/20 rounded-full text-[10px] border border-white/5 transition-all text-gray-400 font-black uppercase tracking-wider">
                    {tag}
                  </button>
                ))}
              </div>
            </GlassCard>

            <div className="space-y-4">
              <GlassCard className="p-6 space-y-4 bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {isZh ? '视频生成方式' : 'Video Mode'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVideoGenerationMode('tts_required')}
                    className={`p-3 rounded-xl transition-all border text-left ${videoGenerationMode === 'tts_required' ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className={`text-xs font-bold ${videoGenerationMode === 'tts_required' ? 'text-cyan-200' : 'text-gray-400'}`}>
                      {isZh ? '口播数字人' : 'Talking Avatar'}
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed mt-1">
                      {isZh ? '脚本先生成语音，再驱动视频。' : 'Script becomes TTS audio before video.'}
                    </p>
                  </button>
                  <button
                    onClick={() => setVideoGenerationMode('audio_sync')}
                    className={`p-3 rounded-xl transition-all border text-left ${videoGenerationMode === 'audio_sync' ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className={`text-xs font-bold ${videoGenerationMode === 'audio_sync' ? 'text-cyan-200' : 'text-gray-400'}`}>
                      {isZh ? '音画同步' : 'Audio Sync'}
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed mt-1">
                      {isZh ? '跳过 TTS，用脚本和分镜生成视频。' : 'Skip TTS and use script plus storyboard.'}
                    </p>
                  </button>
                </div>
              </GlassCard>

              {videoGenerationMode === 'audio_sync' && (
                <GlassCard className="p-6 space-y-5 bg-white/[0.03]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Wand2 className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          {isZh ? '3 张镜头分镜' : '3 Shot Storyboard'}
                        </span>
                        <span className="mt-1 block text-[10px] text-gray-500">
                          {selectedAvatar?.file_url
                            ? (isZh ? `参考当前形象：${selectedAvatar.title}` : `Using avatar reference: ${selectedAvatar.title}`)
                            : (isZh ? '未选择形象图时，将按脚本文本直接生成。' : 'No avatar image selected; generating from script only.')}
                        </span>
                        <span className="mt-1 block text-[10px] text-emerald-300/80">
                          {isZh ? '分镜是可选增强项；不选择分镜时，会直接用形象图、脚本和动作提示词生成。' : 'Storyboards are optional; without selected frames, the avatar, script, and action prompt drive the video.'}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-200">
                      {isZh ? '输出 3 张完整分镜图' : '3 full-frame shots'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {isZh ? '分镜风格 / 额外要求' : 'Storyboard style / extra direction'}
                    </p>
                    <textarea
                      value={storyboardStyle}
                      onChange={(e) => setStoryboardStyle(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-y min-h-24 leading-relaxed custom-scrollbar"
                      placeholder={isZh ? '例如：电影感商品广告、真实商业摄影、自然光、主角始终保持同一人...' : 'e.g. cinematic product ad, realistic commercial lighting, keep the same person across panels...'}
                    />
                  </div>
                  <button
                    onClick={handleGenerateStoryboard}
                    disabled={isGeneratingStoryboard}
                    className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-200 font-black text-[10px] uppercase tracking-[0.2em] border border-emerald-500/30 flex items-center justify-center gap-2 hover:bg-emerald-500/30 disabled:opacity-40"
                  >
                    {isGeneratingStoryboard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isGeneratingStoryboard ? (isZh ? '生成中' : 'Generating') : (isZh ? '生成 3 张分镜' : 'Generate 3 Storyboards')}
                  </button>
                  {storyboardFrames.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400">
                        {selectedStoryboardFrameIds.length > 0
                          ? (isZh ? '已选分镜将作为 keyframes 多图输入；每张图下面的视频镜头提示词会参与最终生成。' : 'Selected frames are sent as keyframes; each video shot prompt is used in the final prompt.')
                          : (isZh ? '当前未使用分镜：将只使用形象图、脚本和动作/表演提示词生成音画同步视频。' : 'No storyboard selected: the audio-sync video will use only the avatar, script, and action prompt.')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStoryboardFrameIds(storyboardFrames.map(frame => frame.asset_id))}
                          className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-200 transition-all hover:bg-emerald-500/20"
                        >
                          {isZh ? '使用全部分镜' : 'Use all frames'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStoryboardFrameIds([])}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black text-gray-300 transition-all hover:bg-white/10"
                        >
                          {isZh ? '不使用分镜' : 'No storyboard'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {storyboardFrames.map(frame => {
                          const selected = selectedStoryboardFrameIds.includes(frame.asset_id);
                          return (
                            <div
                              key={frame.asset_id}
                              className={`min-w-0 rounded-2xl border p-3 transition-all ${selected ? 'border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.08)]' : 'border-white/10 bg-black/20'}`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-black text-white">{isZh ? `分镜 ${frame.scene_index}` : `Shot ${frame.scene_index}`}</p>
                                    <p className="mt-0.5 text-[10px] text-gray-500">{selected ? (isZh ? '将用于生成视频' : 'Included in video') : (isZh ? '不会用于生成视频' : 'Excluded from video')}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleStoryboardFrame(frame.asset_id)}
                                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-black border transition-all ${selected ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                  >
                                    {selected ? (isZh ? '已选' : 'On') : (isZh ? '选择' : 'Select')}
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setStoryboardPreviewFrame(frame)}
                                  className="relative w-full aspect-[9/16] max-h-[320px] rounded-xl overflow-hidden bg-black/40 border border-white/10 group"
                                >
                                  <img src={frame.image_url} alt={`Scene ${frame.scene_index}`} className="w-full h-full object-cover" />
                                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/70 px-2 py-1 text-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isZh ? '放大查看' : 'Zoom'}
                                  </span>
                                </button>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{isZh ? '生图提示词' : 'Image prompt'}</p>
                                    <div className="max-h-20 overflow-y-auto rounded-xl bg-black/30 border border-white/5 p-2.5 text-[11px] leading-relaxed text-gray-300 custom-scrollbar">
                                      {frame.prompt}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-emerald-300/80 uppercase tracking-widest mb-1">{isZh ? '视频镜头提示词' : 'Video shot prompt'}</p>
                                    <div className="max-h-24 overflow-y-auto rounded-xl bg-emerald-950/30 border border-emerald-400/10 p-2.5 text-[11px] leading-relaxed text-emerald-50/80 custom-scrollbar">
                                      {frame.video_prompt || (isZh ? '旧分镜未保存视频镜头提示词，请重新生成分镜。' : 'Old storyboard has no video shot prompt. Please regenerate.')}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setStoryboardPreviewFrame(frame)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-gray-300 transition-all hover:bg-white/10"
                                  >
                                    {isZh ? '放大与查看完整提示词' : 'Zoom and full prompts'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {isZh ? '分镜会使用动作/表演提示词、脚本和当前形象图；更换形象、脚本或提示词后请重新生成。' : 'Storyboards use the performance prompt, script, and selected avatar; regenerate after changing them.'}
                      </p>
                    </div>
                  )}
                </GlassCard>
              )}

              {videoGenerationMode === 'tts_required' && audioMode === 'tts' && (
                <GlassCard className="p-6 space-y-6 bg-white/5 border-white/10 backdrop-blur-xl relative overflow-hidden">
                  <div className={`absolute inset-0 bg-cyan-500/5 transition-opacity duration-700 ${(isSynthesizingPreview || isPreviewPlaying) ? 'opacity-100' : 'opacity-0'}`} />

                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl transition-all ${(isSynthesizingPreview || isPreviewPlaying) ? 'bg-cyan-500 text-white scale-110' : 'bg-cyan-500/10 text-cyan-400'}`}>
                          {(isSynthesizingPreview || isPreviewPlaying) ? <Waves className="w-6 h-6 animate-pulse" /> : <Volume2 className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className="text-sm font-black text-white block uppercase tracking-tight">{t.create.labels.preview}</span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {t.create.labels.checkSync.replace('{voice}', selectedVoice?.title || '').replace('{emotion}', previewEmotionLabel)}
                          </span>
                          <span className={`block text-[10px] mt-1 font-medium ${previewAudioUrl ? 'text-green-400' : 'text-gray-500'}`}>
                            {previewAudioUrl ? t.create.labels.previewReady : t.create.labels.previewNotReady}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.create.emotions.title}</p>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'preset', label: 'Preset' },
                          { id: 'vector', label: '8D Vector' },
                          { id: 'text_ref', label: 'Text Ref' },
                          { id: 'audio_ref', label: 'Audio Ref' },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setEmotionMode(mode.id as 'preset' | 'vector' | 'audio_ref' | 'text_ref')}
                            className={`p-2 rounded-xl text-[10px] font-black border transition-all ${emotionMode === mode.id ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      {emotionMode === 'preset' && (
                        <div className="grid grid-cols-4 gap-2">
                          {emotions.map(e => (
                            <button
                              key={e.id}
                              onClick={() => setSelectedEmotion(e.id)}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${selectedEmotion === e.id ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'bg-white/5 border-transparent text-gray-600 hover:text-white'}`}
                            >
                              {e.icon}
                              <span className="text-[9px] font-black uppercase">{e.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {emotionMode === 'vector' && (
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                          {emotionDimensions.map((label, idx) => (
                            <div key={label} className="space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-400">
                                <span>{label}</span>
                                <span>{emotionVector[idx].toFixed(2)}</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={emotionVector[idx]}
                                onChange={(e) => handleEmotionVectorChange(idx, Number(e.target.value))}
                                className="w-full accent-cyan-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {emotionMode === 'text_ref' && (
                        <textarea
                          value={emotionText}
                          onChange={(e) => setEmotionText(e.target.value)}
                          placeholder="输入一段体现情绪的文本（用于提取情绪）"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none h-20"
                        />
                      )}

                      {emotionMode === 'audio_ref' && (
                        <div className="space-y-2">
                          <select
                            value={emotionAudioAssetId}
                            onChange={(e) => setEmotionAudioAssetId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          >
                            <option value="">选择情绪参考音频（音色库）</option>
                            {voices.map((v) => (
                              <option key={v.id} value={v.id}>{v.title}</option>
                            ))}
                          </select>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-gray-400">
                              <span>情绪影响因子</span>
                              <span>{emotionAlpha.toFixed(2)}</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={emotionAlpha}
                              onChange={(e) => setEmotionAlpha(Number(e.target.value))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                          <label className="w-full py-2 px-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-pink-200 text-center cursor-pointer block">
                            {isUploadingEmotionAudio ? 'UPLOADING...' : 'UPLOAD REFERENCE AUDIO'}
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              disabled={isUploadingEmotionAudio}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  await uploadVoiceAsset(file, true);
                                } catch (error: any) {
                                  alert('Failed to upload emotion audio: ' + error.message);
                                } finally {
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleSynthesizePreview}
                        disabled={isSynthesizingPreview}
                        className="w-full py-3 rounded-xl bg-cyan-500 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                      >
                        {isSynthesizingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {isSynthesizingPreview ? t.create.labels.generating : t.create.labels.synthesize}
                      </button>

                      <button
                        onClick={handleTogglePreviewPlayback}
                        disabled={!previewAudioUrl || isSynthesizingPreview}
                        className="w-full py-3 rounded-xl bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/15 flex items-center justify-center gap-2 hover:bg-white/15 disabled:opacity-40"
                      >
                        {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPreviewPlaying ? t.create.labels.pausePreview : t.create.labels.playPreview}
                      </button>

                      <button
                        onClick={handleSavePreviewAudio}
                        disabled={!previewAudioUrl || isSavingPreview || isSynthesizingPreview}
                        className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-200 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-emerald-500/30 flex items-center justify-center gap-2 hover:bg-emerald-500/30 disabled:opacity-40"
                      >
                        {isSavingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSavingPreview ? t.create.labels.savingPreview : t.create.labels.savePreview}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {videoGenerationMode === 'tts_required' && audioMode === 'direct' && (
                <GlassCard className="p-6 space-y-6 bg-white/5 border-white/10 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Music className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block uppercase tracking-tight">{t.create.labels.directAudioMode}</span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {t.create.labels.directAudioDesc}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium leading-relaxed italic bg-white/5 p-4 rounded-xl">
                    {t.create.labels.directAudioInfo.replace('{voice}', selectedVoice?.title || '')}
                  </div>
                </GlassCard>
              )}

              <button
                onClick={handleGenerate}
                disabled={isSubmitting}
                className="w-full relative group p-1 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 transform hover:-translate-y-1 active:translate-y-0 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 animate-gradient-x" />
                <div className="relative bg-slate-900 rounded-[22px] py-6 flex items-center justify-center gap-4 hover:bg-transparent transition-all duration-500">
                  {isSubmitting ? (
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-white group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                  )}
                  <span className="text-2xl font-black text-white uppercase tracking-tighter">
                    {isSubmitting ? t.create.labels.launching : t.create.labels.generate}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Selection Modal (Asset Picker) */}
          {pickerType && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
              <GlassCard className="max-w-4xl w-full max-h-[85vh] flex flex-col p-8 space-y-6 relative shadow-2xl border-white/10 bg-slate-900/90 overflow-hidden">
                <button onClick={() => {
                  // Stop audio when closing picker
                  if (voiceAudioRef.current) {
                    voiceAudioRef.current.pause();
                    voiceAudioRef.current = null;
                    setIsVoicePlaying(false);
                  }
                  setPickerType(null);
                }} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full z-10">
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <Library className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">{t.create.labels.selectAsset.replace('{type}', pickerType === 'avatar' ? t.assets.tabs.avatar : pickerType === 'voice' ? t.assets.tabs.voice : t.assets.tabs.script)}</h2>
                    <p className="text-gray-500 text-sm font-medium">{t.create.labels.browseCollection}</p>
                  </div>
                </div>

                <div className="relative flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" placeholder={t.create.labels.search} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-medium" />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {systemAssets.filter(a => a.type === pickerType).map(asset => (
                        <div
                          key={asset.id}
                          onClick={() => selectAsset(asset)}
                          className={`relative rounded-2xl border-2 transition-all p-4 cursor-pointer group ${asset.id === (pickerType === 'avatar' ? selectedAvatar?.id : pickerType === 'voice' ? selectedVoice?.id : selectedScript?.id) ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'border-white/5 bg-white/[0.03] hover:border-white/20'}`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 ${asset.type === 'avatar' && asset.file_url ? 'hover:ring-2 hover:ring-cyan-500/50 transition-all' : ''}`}
                            >
                              {asset.type === 'avatar' ? (
                                <img
                                  src={asset.file_url}
                                  className={`w-full h-full object-cover ${asset.file_url ? 'cursor-zoom-in' : ''}`}
                                  alt={asset.title}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (asset.file_url) {
                                      handleAvatarPreview(e, asset.file_url);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {asset.type === 'voice' ? <Mic className="w-6 h-6 text-pink-500" /> : <FileText className="w-6 h-6 text-purple-500" />}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <p className="font-bold text-white truncate text-sm">{asset.title}</p>
                              <p className="text-[10px] text-gray-500 font-medium mt-1">{asset.metadata?.tags?.[0] || t.assets.system}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5 flex-shrink-0">
                  <button onClick={() => {
                    // Stop audio when closing picker
                    if (voiceAudioRef.current) {
                      voiceAudioRef.current.pause();
                      voiceAudioRef.current = null;
                      setIsVoicePlaying(false);
                    }
                    setPickerType(null);
                  }} className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-[0.2em] transition-all">
                    {t.create.labels.close}
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Storyboard Preview Modal */}
          {storyboardPreviewFrame && (
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setStoryboardPreviewFrame(null)}
            >
              <div
                className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setStoryboardPreviewFrame(null)}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="grid max-h-[92vh] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="flex min-h-0 items-center justify-center bg-black/60 p-4 lg:p-8">
                    <img
                      src={storyboardPreviewFrame.image_url}
                      alt={`Scene ${storyboardPreviewFrame.scene_index}`}
                      className="max-h-[58vh] w-full object-contain rounded-2xl lg:max-h-[86vh]"
                    />
                  </div>
                  <div className="flex min-h-0 flex-col gap-4 border-t border-white/10 p-5 lg:border-l lg:border-t-0">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                        {isZh ? '3 张镜头分镜' : '3 Shot Storyboard'}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {isZh ? `分镜 ${storyboardPreviewFrame.scene_index} 预览` : `Shot ${storyboardPreviewFrame.scene_index} Preview`}
                      </h3>
                    </div>
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {isZh ? '完整生图提示词' : 'Full image prompt'}
                      </p>
                      <div className="max-h-[28vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-gray-300 custom-scrollbar">
                        {storyboardPreviewFrame.prompt}
                      </div>
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-300/80">
                          {isZh ? '视频镜头提示词' : 'Video shot prompt'}
                        </p>
                        <div className="max-h-[28vh] overflow-y-auto rounded-2xl border border-emerald-400/10 bg-emerald-950/30 p-4 text-sm leading-relaxed text-emerald-50/80 custom-scrollbar">
                          {storyboardPreviewFrame.video_prompt || (isZh ? '旧分镜未保存视频镜头提示词，请重新生成分镜。' : 'Old storyboard has no video shot prompt. Please regenerate.')}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleStoryboardFrame(storyboardPreviewFrame.asset_id);
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                        selectedStoryboardFrameIds.includes(storyboardPreviewFrame.asset_id)
                          ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {selectedStoryboardFrameIds.includes(storyboardPreviewFrame.asset_id)
                        ? (isZh ? '已选择用于生成视频' : 'Selected for video')
                        : (isZh ? '选择用于生成视频' : 'Select for video')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avatar Preview Modal */}
          {avatarPreviewUrl && (
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setAvatarPreviewUrl(null)}
            >
              <div className="relative max-w-3xl max-h-[90vh]">
                <button
                  onClick={() => setAvatarPreviewUrl(null)}
                  className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={avatarPreviewUrl}
                  alt="Avatar Preview"
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
