import React, { useState } from 'react';
import { X, Github, User, Lock, Mail, Loader2 } from 'lucide-react';
import { useTranslation } from '../App';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGithubLogin: () => void;
  onPasswordLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onGithubLogin,
  onPasswordLogin,
  onRegister
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        setError('密码至少需要6个字符');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await onPasswordLogin(username, password);
      } else {
        await onRegister(username, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    onGithubLogin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? '欢迎回来' : '创建账户'}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === 'login' ? '登录以继续使用' : '注册新账户开始使用'}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 space-y-4">
          {/* GitHub Login Button */}
          <button
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span>使用 GitHub 登录</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-sm">或</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                required
                minLength={3}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                mode === 'login' ? '登录' : '注册'
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-gray-400 text-sm">
            {mode === 'login' ? (
              <>
                还没有账户？{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账户？{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  立即登录
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
