import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { GlassCard } from '../components/GlassCard';
import { ProjectStatus } from '../types';
import { Plus, Clock, CheckCircle, AlertTriangle, Play, Download, X, Trash2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../App';
import { useProjects, useProjectStatus } from '../services/hooks';
import { projectsApi } from '../services/api';
import { useNavigate } from '../react-router-dom';

// ============================================
// Global Notification System
// ============================================
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-xl border backdrop-blur-md shadow-lg animate-in slide-in-from-right-4 duration-300 ${
              notification.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : notification.type === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : notification.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{notification.title}</p>
                <p className="text-xs opacity-80 mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress?: number;
  video_url?: string;
  thumbnail_url?: string;
  created_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

// Video Preview Modal Component
const VideoPreviewModal: React.FC<{
  videoUrl: string;
  title: string;
  onClose: () => void;
}> = ({ videoUrl, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 bg-slate-900/95 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-white truncate pr-4">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-all text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              下载视频
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full"
            style={{ maxHeight: '70vh' }}
          />
        </div>
      </div>
    </div>
  );
};

// Project Card Component with video thumbnail extraction
const ProjectCard: React.FC<{
  project: Project;
  onPlay: (project: Project) => void;
  onDelete: (project: Project) => void;
}> = ({ project, onPlay, onDelete }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  // Extract first frame from video as thumbnail
  useEffect(() => {
    if (project.status === ProjectStatus.COMPLETED && project.video_url && !project.thumbnail_url) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = project.video_url;
      video.currentTime = 0.1; // Seek to first frame

      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 225;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
        }
      };

      video.onerror = () => {
        // Silently fail, will use placeholder
      };
    }
  }, [project.status, project.video_url, project.thumbnail_url]);

  // Format time with seconds precision
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: ProjectStatus, progress?: number) => {
    switch (status) {
      case ProjectStatus.COMPLETED:
        return <span className="flex items-center gap-1 text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded"><CheckCircle className="w-3 h-3"/> {t.dashboard.status.done}</span>;
      case ProjectStatus.FAILED:
        return <span className="flex items-center gap-1 text-red-400 text-xs bg-red-400/10 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3"/> {t.dashboard.status.failed}</span>;
      case ProjectStatus.GENERATING_VIDEO:
        return <span className="flex items-center gap-1 text-purple-400 text-xs bg-purple-400/10 px-2 py-1 rounded"><Clock className="w-3 h-3 animate-spin"/> {t.dashboard.status.processing} ({progress || 0}%)</span>;
      case ProjectStatus.GENERATING_AUDIO:
        return <span className="flex items-center gap-1 text-cyan-400 text-xs bg-cyan-400/10 px-2 py-1 rounded"><Clock className="w-3 h-3 animate-spin"/> {t.dashboard.status.processing} ({progress || 0}%)</span>;
      default:
        return <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-400/10 px-2 py-1 rounded"><Clock className="w-3 h-3 animate-spin"/> {t.dashboard.status.processing}</span>;
    }
  };

  const thumbnailSrc = project.thumbnail_url || thumbnail || `https://picsum.photos/seed/${project.id}/400/225`;

  return (
    <GlassCard className="h-80 flex flex-col group" hoverEffect>
      <div
        className="relative h-44 bg-black/40 overflow-hidden"
        onMouseEnter={() => setShowPlayOverlay(true)}
        onMouseLeave={() => setShowPlayOverlay(false)}
      >
        <img
          src={thumbnailSrc}
          alt={project.title}
          className={`w-full h-full object-cover transition-transform duration-700 ${project.status === ProjectStatus.COMPLETED ? 'group-hover:scale-110' : 'opacity-50 grayscale'}`}
        />
        {project.status === ProjectStatus.COMPLETED && showPlayOverlay && (
          <div
            className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 backdrop-blur-sm cursor-pointer"
            onClick={() => onPlay(project)}
          >
            <button className="p-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white transition-all transform hover:scale-110 shadow-lg shadow-cyan-500/30">
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {getStatusBadge(project.status, project.progress)}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
            className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {/* Duration badge */}
        {project.status === ProjectStatus.COMPLETED && project.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(project.duration_seconds)}
          </div>
        )}
      </div>
      <div className="flex-1 p-4 bg-glass-200 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-white truncate mb-1">{project.title}</h3>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-400">
              创建: {formatDateTime(project.created_at)}
            </p>
            {project.completed_at && (
              <p className="text-xs text-gray-500">
                完成: {formatDateTime(project.completed_at)}
              </p>
            )}
          </div>
        </div>
        {project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.FAILED && (
          <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse" style={{ width: `${project.progress || 0}%` }} />
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { projects, loading, error, refetch, createProject } = useProjects();
  const { addNotification } = useNotification();

  // Track previous status to avoid infinite loops
  const prevStatusRef = useRef<string | null>(null);

  // Video preview modal state
  const [previewProject, setPreviewProject] = useState<Project | null>(null);

  // Delete confirmation state
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Poll for in-progress projects
  const inProgressProject = projects.find(p =>
    p.status === ProjectStatus.PENDING ||
    p.status === ProjectStatus.GENERATING_AUDIO ||
    p.status === ProjectStatus.GENERATING_VIDEO
  );

  // Only poll if there's an in-progress project
  const projectStatus = useProjectStatus(inProgressProject?.id || null, !!inProgressProject);

  // Update project status only when status actually changes
  useEffect(() => {
    if (projectStatus && inProgressProject) {
      const currentStatus = projectStatus.status;
      // Only refetch if status actually changed
      if (prevStatusRef.current !== currentStatus) {
        prevStatusRef.current = currentStatus;
        // Refetch projects when status changes to a final state
        if (currentStatus === 'completed' || currentStatus === 'failed') {
          refetch();
          // Send notification when project completes
          if (currentStatus === 'completed') {
            addNotification({
              type: 'success',
              title: '视频生成完成',
              message: `"${inProgressProject.title}" 已成功生成！`,
              duration: 8000,
            });
          } else if (currentStatus === 'failed') {
            addNotification({
              type: 'error',
              title: '视频生成失败',
              message: `"${inProgressProject.title}" 生成失败，请重试。`,
              duration: 10000,
            });
          }
        }
      }
    }
  }, [projectStatus?.status, inProgressProject, refetch, addNotification]);

  const navigate = (hash: string) => {
    window.location.hash = hash;
  };

  const handlePlay = (project: Project) => {
    setPreviewProject(project);
  };

  const handleClosePreview = () => {
    setPreviewProject(null);
  };

  const handleDeleteRequest = (project: Project) => {
    setDeleteConfirmProject(project);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProject) return;

    setIsDeleting(true);
    try {
      await projectsApi.deleteProject(deleteConfirmProject.id);
      addNotification({
        type: 'success',
        title: '删除成功',
        message: `"${deleteConfirmProject.title}" 已删除`,
      });
      setDeleteConfirmProject(null);
      refetch();
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '删除失败',
        message: err.message || '删除项目时出错',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmProject(null);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">{t.dashboard.title}</h1>
                <p className="text-gray-400">{t.dashboard.subtitle}</p>
            </div>
            <button
                onClick={() => navigate('#create')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-3 rounded-xl transition-all font-medium"
            >
                <Plus className="w-5 h-5" /> {t.dashboard.newProject}
            </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400">Failed to load projects: {error}</p>
            <button onClick={refetch} className="mt-4 text-cyan-400 hover:underline">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div
                onClick={() => navigate('#create')}
                className="h-80 rounded-xl border-2 border-dashed border-glass-border hover:border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer transition-all group bg-transparent"
            >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-cyan-400" />
                </div>
                <span className="font-semibold text-gray-300 group-hover:text-white">{t.dashboard.createFirst}</span>
            </div>

            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project as Project}
                onPlay={handlePlay}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}

        {/* Video Preview Modal */}
        {previewProject && previewProject.video_url && (
          <VideoPreviewModal
            videoUrl={previewProject.video_url}
            title={previewProject.title}
            onClose={handleClosePreview}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">确认删除</h3>
              </div>
              <p className="text-gray-400 mb-6">
                确定要删除项目 "<span className="text-white font-medium">{deleteConfirmProject.title}</span>" 吗？此操作无法撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      删除中...
                    </>
                  ) : (
                    '确认删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
