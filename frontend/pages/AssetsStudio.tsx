import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Asset, AssetType } from '../types';
import {
  Plus,
  Upload,
  Mic,
  FileText,
  Play,
  Pause,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  X,
  FileImage,
  Type,
  CheckCircle2,
  FileArchive,
  Loader2,
  Trash2,
  Keyboard
} from 'lucide-react';
import { useTranslation } from '../App';
import { useAssets } from '../services/hooks';
import { assetsApi, generationApi } from '../services/api';

type CreationMode = 'options' | 'ai' | 'upload' | 'type';

export const AssetsStudio: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AssetType>(AssetType.AVATAR);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Avatar preview state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Creation Form State
  const [creationMode, setCreationMode] = useState<CreationMode>('options');
  const [assetName, setAssetName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refImageUrls, setRefImageUrls] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatedScripts, setGeneratedScripts] = useState<Array<{content: string; estimated_seconds: number; word_count: number}>>([]);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch assets from API
  const { assets: allAssets, loading, refetch } = useAssets();
  const filteredAssets = allAssets.filter(a => a.type === activeTab);

  const typeName = activeTab === AssetType.SCRIPT ? t.assets.tabs.script :
                   activeTab === AssetType.VOICE ? t.assets.tabs.voice :
                   t.assets.tabs.avatar;

  const handleOpenModal = () => {
    setCreationMode('options');
    setAssetName('');
    setPrompt('');
    setScriptContent('');
    setRefImages([]);
    setRefImageUrls([]);
    setSelectedFile(null);
    setGeneratedScripts([]);
    setSelectedScriptIndex(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && refImages.length < 4) {
      const newImages = [...refImages];
      const newUrls = [...refImageUrls];

      for (let i = 0; i < files.length && newImages.length < 4; i++) {
        const file = files[i];
        newImages.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
      setRefImages(newImages);
      setRefImageUrls(newUrls);
    }
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!assetName) setAssetName(file.name.split('.')[0]);
    }
  };

  const removeImage = (index: number) => {
    setRefImages(prev => prev.filter((_, i) => i !== index));
    setRefImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handlePlayAudio = (assetId: string, fileUrl: string) => {
    // If clicking the same audio that's currently playing
    if (playingAudioId === assetId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingAudioId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Play new audio
    const audio = new Audio(fileUrl);
    audioRef.current = audio;

    audio.play();
    setPlayingAudioId(assetId);

    audio.onended = () => {
      setPlayingAudioId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingAudioId(null);
      audioRef.current = null;
      alert('Failed to play audio');
    };
  };

  // Handle AI script generation
  const handleGenerateScripts = async () => {
    if (!prompt) {
      alert(t.zh ? "请输入产品描述" : "Please enter product description");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await generationApi.generateScript({
        product_name: assetName || "Product",
        product_description: prompt,
        tone: "casual",
        duration_seconds: 30
      });
      setGeneratedScripts(result.scripts);
      setIsSubmitting(false);
    } catch (error: any) {
      setIsSubmitting(false);
      alert('Failed to generate scripts: ' + error.message);
    }
  };

  const handleStartGeneration = async () => {
    if (!assetName) {
      alert(t.zh ? "请先为您的资产命名。" : "Please enter a name for your asset.");
      return;
    }

    // Script type mode - use direct content
    if (creationMode === 'type' && activeTab === AssetType.SCRIPT) {
      if (!scriptContent) {
        alert(t.zh ? "请输入脚本内容" : "Please enter script content");
        return;
      }
      setIsSubmitting(true);
      try {
        await assetsApi.createScript({
          title: assetName,
          content: scriptContent,
          tags: 'Custom'
        });
        setIsModalOpen(false);
        setIsSubmitting(false);
        alert(`Success: "${assetName}" has been added to your library! ✅`);
        refetch();
        setAssetName('');
        setScriptContent('');
        return;
      } catch (error: any) {
        setIsSubmitting(false);
        alert('Failed to create script: ' + error.message);
        return;
      }
    }

    // Script AI generation mode - use selected generated script
    if (creationMode === 'ai' && activeTab === AssetType.SCRIPT) {
      if (selectedScriptIndex === null || !generatedScripts[selectedScriptIndex]) {
        alert(t.zh ? "请先生成并选择一个脚本" : "Please generate and select a script first");
        return;
      }
      setIsSubmitting(true);
      try {
        await assetsApi.createScript({
          title: assetName,
          content: generatedScripts[selectedScriptIndex].content,
          tags: 'AI Generated'
        });
        setIsModalOpen(false);
        setIsSubmitting(false);
        alert(`Success: "${assetName}" has been added to your library! ✅`);
        refetch();
        setAssetName('');
        setPrompt('');
        setGeneratedScripts([]);
        setSelectedScriptIndex(null);
        return;
      } catch (error: any) {
        setIsSubmitting(false);
        alert('Failed to create script: ' + error.message);
        return;
      }
    }

    if (creationMode === 'ai' && !prompt) {
      alert(t.zh ? "请输入生成提示词。" : "Please enter a generation prompt.");
      return;
    }
    if (creationMode === 'upload' && !selectedFile) {
      alert(t.zh ? "请选择要上传的文件。" : "Please select a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      if (creationMode === 'ai') {
        // AI Generate avatar
        setUploadProgress(20);
        await assetsApi.generateAvatar({
          title: assetName,
          prompt: prompt,
          reference_images: refImages.length > 0 ? refImages : undefined,
        });
        setUploadProgress(100);
      } else if (creationMode === 'upload') {
        // Upload mode
        setUploadProgress(20);

        if (activeTab === AssetType.AVATAR) {
          // Direct file upload to backend
          setUploadProgress(50);
          const formData = new FormData();
          formData.append('file', selectedFile!);
          formData.append('title', assetName);

          await assetsApi.uploadAvatar(formData);
          setUploadProgress(100);
        } else if (activeTab === AssetType.VOICE) {
          // Upload voice audio file
          setUploadProgress(50);
          const formData = new FormData();
          formData.append('file', selectedFile!);
          formData.append('title', assetName);

          await assetsApi.uploadVoice(formData);
          setUploadProgress(100);
        } else if (activeTab === AssetType.SCRIPT) {
          // For scripts, read content from file
          setUploadProgress(50);
          const content = await selectedFile!.text();
          await assetsApi.createScript({
            title: assetName,
            content,
            tags: 'Custom'
          });
          setUploadProgress(100);
        }
      }

      setIsModalOpen(false);
      setIsSubmitting(false);
      alert(`Success: "${assetName}" has been added to your library! ✅`);
      refetch(); // Refresh the assets list

      // Reset form
      setAssetName('');
      setPrompt('');
      setScriptContent('');
      setRefImages([]);
      setRefImageUrls([]);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error: any) {
      setIsSubmitting(false);
      alert('Failed to create asset: ' + error.message);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm(t.zh ? "确定要删除这个资产吗？" : "Are you sure you want to delete this asset?")) {
      return;
    }

    try {
      await assetsApi.deleteAsset(assetId);
      refetch();
      alert(t.zh ? "资产已删除 ✅" : "Asset deleted successfully ✅");
    } catch (error: any) {
      alert('Failed to delete asset: ' + error.message);
    }
  };

  // Get available creation options based on asset type
  const getCreationOptions = () => {
    const options = [];

    if (activeTab === AssetType.AVATAR) {
      options.push({ mode: 'ai' as CreationMode, icon: Wand2, label: t.assets.aiGen, color: 'cyan' });
      options.push({ mode: 'upload' as CreationMode, icon: Upload, label: t.assets.localUpload, color: 'purple' });
    } else if (activeTab === AssetType.VOICE) {
      options.push({ mode: 'upload' as CreationMode, icon: Upload, label: t.assets.localUpload, color: 'purple' });
    } else if (activeTab === AssetType.SCRIPT) {
      options.push({ mode: 'ai' as CreationMode, icon: Wand2, label: t.assets.aiGen, color: 'cyan' });
      options.push({ mode: 'type' as CreationMode, icon: Keyboard, label: t.zh ? '直接输入' : 'Type Directly', color: 'purple' });
      options.push({ mode: 'upload' as CreationMode, icon: Upload, label: t.assets.localUpload, color: 'purple' });
    }

    return options;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-widest">
                {t.assets.title}
            </h1>
            <p className="text-gray-500 font-medium">Create and organize your digital identity components.</p>
        </div>
        <button
          onClick={handleOpenModal}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 hover:shadow-cyan-500/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
          <span>{t.assets.newBtn.replace('{type}', typeName)}</span>
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit">
        {[AssetType.AVATAR, AssetType.VOICE, AssetType.SCRIPT].map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-3 text-sm ${activeTab === type ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {type === AssetType.AVATAR && <ImageIcon className="w-4 h-4"/>}
            {type === AssetType.VOICE && <Mic className="w-4 h-4"/>}
            {type === AssetType.SCRIPT && <FileText className="w-4 h-4"/>}
            {type === AssetType.AVATAR ? t.assets.tabs.avatar : type === AssetType.VOICE ? t.assets.tabs.voice : t.assets.tabs.script}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Creation Card */}
        <div
          onClick={handleOpenModal}
          className="h-72 rounded-3xl border-2 border-dashed border-white/10 hover:border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer transition-all group bg-white/[0.02]"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500/10 transition-all">
            <Sparkles className="w-8 h-8 text-gray-500 group-hover:text-cyan-400" />
          </div>
          <p className="text-gray-500 group-hover:text-white font-black text-xs uppercase tracking-widest">{t.assets.upload}</p>
        </div>

        {filteredAssets.map((asset) => (
          <GlassCard key={asset.id} className="h-72 flex flex-col group overflow-hidden" hoverEffect>
            <div className="relative h-2/3 overflow-hidden bg-slate-900">
              {asset.type === 'avatar' ? (
                <img
                  src={asset.file_url}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-zoom-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (asset.file_url) {
                      setPreviewImageUrl(asset.file_url);
                    }
                  }}
                />
              ) : asset.type === 'voice' ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                   <Mic className="w-16 h-16 text-pink-500 opacity-20" />
                </div>
              ) : (
                // Script - show content preview
                <div className="w-full h-full p-4 flex flex-col justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                   <FileText className="w-8 h-8 text-purple-500 opacity-40 mb-2" />
                   <p className="text-xs text-gray-300 line-clamp-4 leading-relaxed">
                     {asset.content || 'No content'}
                   </p>
                </div>
              )}
              {asset.is_system && (
                <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/30">
                  {t.assets.system}
                </span>
              )}
              {!asset.is_system && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}
                  className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500 rounded-lg transition-all text-red-400 hover:text-white"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 p-5 bg-glass-200 flex flex-col justify-between">
              <h3 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors tracking-tight">{asset.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{asset.type === 'script' ? `${asset.metadata?.estimatedSeconds}s` : asset.metadata?.tags?.[0]}</span>
                {asset.type === AssetType.VOICE && asset.file_url && (
                   <button
                     onClick={() => handlePlayAudio(asset.id, asset.file_url!)}
                     className={`p-2 rounded-lg transition-all ${playingAudioId === asset.id ? 'bg-cyan-500 text-white' : 'bg-white/5 hover:bg-cyan-500 text-gray-400 hover:text-white'}`}
                   >
                     {playingAudioId === asset.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                   </button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <GlassCard className="max-w-2xl w-full p-8 space-y-8 relative shadow-2xl border-white/10 bg-slate-900/90 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                  <X className="w-6 h-6" />
                </button>

                {creationMode === 'options' ? (
                  <>
                    <div className="space-y-2 text-center">
                      <h2 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest">{t.assets.newBtn.replace('{type}', typeName)}</h2>
                      <p className="text-gray-500 text-sm font-medium">Select your preferred creation method.</p>
                    </div>

                    <div className={`grid grid-cols-1 ${getCreationOptions().length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                      {getCreationOptions().map((option) => {
                        const Icon = option.icon;
                        return (
                          <button key={option.mode} onClick={() => setCreationMode(option.mode)} className={`flex flex-col items-center gap-4 p-8 rounded-[32px] bg-${option.color}-500/5 border border-${option.color}-500/20 hover:bg-${option.color}-500/10 hover:border-${option.color}-500/50 transition-all group`}>
                            <div className={`w-20 h-20 rounded-[24px] bg-${option.color}-500 flex items-center justify-center shadow-2xl shadow-${option.color}-500/40 group-hover:scale-110 ${option.mode === 'ai' ? 'group-hover:rotate-3' : option.mode === 'type' ? 'group-hover:-translate-y-1' : 'group-hover:-rotate-3'} transition-all duration-500`}>
                              <Icon className="w-10 h-10 text-white" />
                            </div>
                            <span className={`font-black text-[10px] uppercase tracking-[0.25em] text-${option.color}-400`}>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <div className={`p-3 rounded-2xl ${creationMode === 'ai' ? 'bg-cyan-500/20 text-cyan-400' : creationMode === 'type' ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {creationMode === 'ai' ? <Wand2 className="w-6 h-6" /> : creationMode === 'type' ? <Keyboard className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">
                          {creationMode === 'ai' ? t.assets.aiGen : creationMode === 'type' ? (t.zh ? '直接输入' : 'Type Directly') : t.assets.localUpload} - {typeName}
                        </h2>
                        <button onClick={() => setCreationMode('options')} className="text-[10px] text-gray-500 hover:text-cyan-400 uppercase font-black transition-colors">&larr; Change Method</button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <Type className="w-3 h-3" /> {t.assets.modal.name}
                        </label>
                        <input
                          type="text"
                          value={assetName}
                          onChange={(e) => setAssetName(e.target.value)}
                          placeholder={t.assets.modal.namePlaceholder}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        />
                      </div>

                      {/* AI Mode for Avatar */}
                      {creationMode === 'ai' && activeTab === AssetType.AVATAR && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                               <Sparkles className="w-3 h-3" /> {t.assets.modal.prompt}
                            </label>
                            <textarea
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder={t.assets.modal.promptPlaceholder}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all h-24 resize-none"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <FileImage className="w-3 h-3" /> {t.assets.modal.images}
                               </div>
                               <span className="text-[10px] text-gray-600 font-bold">{refImageUrls.length}/4</span>
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                              {refImageUrls.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                  <img src={img} className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              ))}
                              {refImageUrls.length < 4 && (
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="aspect-square rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                                >
                                  <Plus className="w-5 h-5 text-gray-500" />
                                </button>
                              )}
                            </div>
                            <input type="file" hidden multiple ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                          </div>
                        </>
                      )}

                      {/* AI Mode for Script */}
                      {creationMode === 'ai' && activeTab === AssetType.SCRIPT && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                               <Sparkles className="w-3 h-3" /> {t.zh ? '产品描述' : 'Product Description'}
                            </label>
                            <textarea
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder={t.zh ? "描述你想推广的产品..." : "Describe the product you want to promote..."}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all h-24 resize-none"
                            />
                          </div>

                          <button
                            onClick={handleGenerateScripts}
                            disabled={isSubmitting || !prompt}
                            className="w-full py-3 rounded-xl text-cyan-400 font-black text-xs uppercase tracking-widest border-2 border-cyan-500/30 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            {isSubmitting ? (t.zh ? '生成中...' : 'Generating...') : (t.zh ? '生成脚本选项' : 'Generate Script Options')}
                          </button>

                          {generatedScripts.length > 0 && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {t.zh ? '选择一个脚本' : 'Select a Script'}
                              </label>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {generatedScripts.map((script, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setSelectedScriptIndex(idx)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedScriptIndex === idx ? 'bg-cyan-500/10 border-cyan-500' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-black text-cyan-400">Script {idx + 1}</span>
                                      <span className="text-[10px] text-gray-500">{script.word_count} words • ~{script.estimated_seconds}s</span>
                                    </div>
                                    <p className="text-xs text-gray-300 line-clamp-3">{script.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Type Mode for Script */}
                      {creationMode === 'type' && activeTab === AssetType.SCRIPT && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <Type className="w-3 h-3" /> {t.zh ? '脚本内容' : 'Script Content'}
                          </label>
                          <textarea
                            value={scriptContent}
                            onChange={(e) => setScriptContent(e.target.value)}
                            placeholder={t.zh ? "输入你的脚本内容..." : "Enter your script content..."}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all h-48 resize-none"
                          />
                          <div className="text-[10px] text-gray-500 text-right">
                            {scriptContent.length} {t.zh ? '字' : 'characters'}
                          </div>
                        </div>
                      )}

                      {/* Upload Mode */}
                      {creationMode === 'upload' && (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <FileArchive className="w-3 h-3" /> {t.assets.modal.fileSelect}
                          </label>
                          <div
                            onClick={() => localFileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/5 hover:border-purple-500/40 transition-all cursor-pointer group"
                          >
                             {selectedFile ? (
                               <div className="flex flex-col items-center gap-3">
                                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                                  <span className="text-sm font-bold text-white text-center">{selectedFile.name}</span>
                                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                               </div>
                             ) : (
                               <div className="flex flex-col items-center gap-4">
                                  <Upload className="w-10 h-10 text-gray-600 group-hover:text-purple-400 transition-all" />
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-all">{t.assets.modal.uploadHint}</span>
                               </div>
                             )}
                          </div>
                          <input type="file" hidden ref={localFileInputRef} onChange={handleLocalFileSelect} accept={activeTab === AssetType.AVATAR ? "image/*" : activeTab === AssetType.VOICE ? "audio/*" : ".txt,.doc,.docx"} />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleStartGeneration}
                      disabled={isSubmitting}
                      className={`w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-3 ${creationMode === 'ai' ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 shadow-cyan-500/20' : creationMode === 'type' ? 'bg-gradient-to-r from-pink-600 to-pink-500 shadow-pink-500/20' : 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-purple-500/20'} hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      {isSubmitting ? `Creating... ${uploadProgress}%` : t.assets.modal.submit}
                    </button>
                  </div>
                )}
            </GlassCard>
        </div>
      )}

      {/* Avatar Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt="Avatar Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
