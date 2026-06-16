import React, { useMemo, useRef, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Asset } from '../types';
import { assetsApi } from '../services/api';
import { useAssets, useProjects } from '../services/hooks';
import { useTranslation } from '../App';
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Images,
  Loader2,
  Sparkles,
  Upload,
  X
} from 'lucide-react';

const MAX_REFERENCE_IMAGES = 8;

export const SimpleCreate: React.FC = () => {
  const { locale } = useTranslation();
  const isZh = locale === 'zh';
  const { assets: avatarAssets, loading: avatarLoading, refetch: refetchAvatars } = useAssets('avatar');
  const { assets: voices } = useAssets('voice');
  const { createProject } = useProjects();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [referenceImages, setReferenceImages] = useState<Asset[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableAvatars = useMemo(
    () => avatarAssets.filter(asset => asset.file_url && !referenceImages.some(item => item.id === asset.id)),
    [avatarAssets, referenceImages]
  );

  const placeholderAvatar = useMemo(
    () => referenceImages[0] || avatarAssets.find(asset => asset.file_url) || null,
    [avatarAssets, referenceImages]
  );

  const canGenerate = prompt.trim().length > 0 && !isUploading && !isSubmitting;

  const insertImageToken = (index: number) => {
    const token = isZh ? `图片${index}` : `image ${index}`;
    setPrompt(prev => {
      const next = prev.trim();
      return next ? `${next} ${token}` : token;
    });
  };

  const addAsset = (asset: Asset) => {
    if (referenceImages.some(item => item.id === asset.id)) return;
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      alert(isZh ? `最多添加 ${MAX_REFERENCE_IMAGES} 张参考图` : `Add up to ${MAX_REFERENCE_IMAGES} reference images`);
      return;
    }
    setReferenceImages(prev => [...prev, asset]);
  };

  const removeAsset = (assetId: string) => {
    setReferenceImages(prev => prev.filter(item => item.id !== assetId));
  };

  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const remainingSlots = MAX_REFERENCE_IMAGES - referenceImages.length;
    const uploadFiles = files.slice(0, remainingSlots);
    if (!uploadFiles.length) {
      alert(isZh ? `最多添加 ${MAX_REFERENCE_IMAGES} 张参考图` : `Add up to ${MAX_REFERENCE_IMAGES} reference images`);
      return;
    }

    setIsUploading(true);
    try {
      const uploaded: Asset[] = [];
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^.]+$/, '') || (isZh ? '简单创作参考图' : 'Simple reference image'));
        uploaded.push(await assetsApi.uploadAvatar(formData));
      }
      setReferenceImages(prev => [...prev, ...uploaded].slice(0, MAX_REFERENCE_IMAGES));
      await refetchAvatars();
    } catch (error: any) {
      alert((isZh ? '图片上传失败：' : 'Image upload failed: ') + (error.message || String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert(isZh ? '请输入视频提示词' : 'Enter a video prompt');
      return;
    }
    if (!voices.length) {
      alert(isZh ? '音画同步模式仍需要一个默认音色占位，请先在资产中心添加音色' : 'Audio-sync mode needs one default voice placeholder. Add a voice asset first.');
      return;
    }
    if (!placeholderAvatar) {
      alert(isZh ? '当前项目表仍需要一个形象资产占位，请先在资产中心上传任意一张图片。这个占位图不会作为参考图传给视频模型。' : 'The project record still needs one image asset placeholder. Upload any image in Assets first; it will not be sent as a video reference.');
      return;
    }

    const promptOnlyVideo = referenceImages.length === 0;

    setIsSubmitting(true);
    try {
      await createProject({
        title: `${isZh ? '简单创作' : 'Simple Create'} - ${new Date().toLocaleDateString()}`,
        avatar_id: placeholderAvatar.id,
        voice_id: voices[0].id,
        script_content: prompt.trim(),
        performance_prompt: '',
        video_generation_mode: 'audio_sync',
        storyboard_asset_ids: [],
        reference_image_asset_ids: referenceImages.map(asset => asset.id),
        storyboard_mode: referenceImages.length > 1 ? 'keyframes' : 'none',
        prompt_mode: 'direct',
        prompt_only_video: promptOnlyVideo,
        language: locale,
      });
      alert(isZh ? '视频任务已创建' : 'Video task created');
      window.location.hash = '#dashboard';
    } catch (error: any) {
      alert((isZh ? '创建视频失败：' : 'Failed to create video: ') + (error.message || String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles className="h-4 w-4" />
              Audio Sync
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              {isZh ? '简单创作' : 'Simple Create'}
            </h1>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 px-8 text-base font-black tracking-[0.18em] text-white shadow-2xl shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            {isZh ? '生成视频' : 'Generate'}
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <GlassCard className="min-h-[620px] border-white/10 bg-slate-950/60">
            <div className="flex h-full flex-col">
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
                      <Images className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">{isZh ? '参考图片' : 'Reference Images'}</h2>
                      <p className="text-sm font-medium text-slate-400">
                        {isZh ? `可选 ${referenceImages.length}/${MAX_REFERENCE_IMAGES}` : `Optional ${referenceImages.length}/${MAX_REFERENCE_IMAGES}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || referenceImages.length >= MAX_REFERENCE_IMAGES}
                    className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-all hover:bg-white/10 disabled:opacity-40"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isZh ? '上传' : 'Upload'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUploadFiles} />
                </div>

                {referenceImages.length > 0 ? (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {referenceImages.map((asset, index) => (
                      <div key={asset.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <button
                          onClick={() => insertImageToken(index + 1)}
                          className="block h-40 w-full overflow-hidden bg-black/30 text-left"
                        >
                          <img
                            src={asset.file_url || asset.thumbnail_url || asset.preview_url}
                            alt={asset.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </button>
                        <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-sm font-black text-white ring-1 ring-white/20">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => removeAsset(asset.id)}
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                          <p className="truncate text-sm font-bold text-white">{isZh ? `图片${index + 1}` : `Image ${index + 1}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-5 flex min-h-56 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-slate-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/5"
                  >
                    <ImagePlus className="h-10 w-10 text-cyan-300" />
                    <span className="text-base font-black">{isZh ? '可选：添加参考图' : 'Optional: Add Reference Images'}</span>
                    <span className="max-w-md px-4 text-center text-sm font-medium leading-6 text-slate-500">
                      {isZh ? '不添加图片也可以直接用提示词生成视频。' : 'You can generate directly from the prompt without images.'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-white">{isZh ? '视频提示词' : 'Video Prompt'}</h2>
                  <div className="flex flex-wrap gap-2">
                    {referenceImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => insertImageToken(index + 1)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-cyan-100 transition-colors hover:bg-cyan-400/15"
                      >
                        {isZh ? `图片${index + 1}` : `Image ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  placeholder={
                    isZh
                      ? '例如：黄昏的拉萨街头，远处雪山和经幡，镜头缓慢推进，一位旅行者用中文旁白说：“这一刻，我终于明白什么叫抵达。” 如果添加了参考图，也可以写：参考图片1中的人物站位，场景在图片2。'
                      : 'Example: A sunset street in Lhasa, prayer flags and distant snowy mountains, slow camera push-in, with a Chinese voiceover saying: “这一刻，我终于明白什么叫抵达。” If images are added, reference them as image 1, image 2.'
                  }
                  className="min-h-[320px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/40 p-5 text-lg leading-8 text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </div>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="border-emerald-400/20 bg-emerald-400/[0.06] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <h3 className="font-black text-emerald-100">{isZh ? '音画同步模型' : 'Audio-sync only'}</h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                    {isZh ? '有图时传图片和文字；无图时只把提示词传给视频模型。' : 'With images, it sends images plus text; without images, it sends only the prompt.'}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="border-white/10 bg-slate-950/60 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-black text-white">{isZh ? '形象库图片' : 'Asset Images'}</h3>
                {avatarLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              </div>
              <div className="grid max-h-[480px] grid-cols-2 gap-3 overflow-y-auto pr-1 custom-scrollbar">
                {availableAvatars.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => addAsset(asset)}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  >
                    <div className="h-28 overflow-hidden bg-black/30">
                      <img
                        src={asset.file_url || asset.thumbnail_url || asset.preview_url}
                        alt={asset.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold text-white">{asset.title}</p>
                    </div>
                  </button>
                ))}
                {!availableAvatars.length && (
                  <div className="col-span-2 flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm font-bold text-slate-500">
                    {isZh ? '暂无可添加图片' : 'No images available'}
                  </div>
                )}
              </div>
            </GlassCard>

            {!voices.length && (
              <GlassCard className="border-amber-400/25 bg-amber-400/[0.06] p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <p className="text-sm font-bold leading-6 text-amber-100/80">
                    {isZh ? '请先添加一个音色资产作为项目占位。' : 'Add one voice asset as the project placeholder first.'}
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
