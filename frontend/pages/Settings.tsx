/**
 * Settings Page - API Configuration Management
 */
import React, { useState, useEffect } from 'react';
import {
  Image,
  Cloud,
  Video,
  Mic,
  Brain,
  Plus,
  Trash2,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../App';
import { apiConfigApi } from '../services/api';
import type {
  ApiCategory,
  ApiConfig,
  CategoryConfig,
  CategoryProviders,
  Provider,
  ProviderField,
} from '../types';

export const Settings: React.FC = () => {
  const { t, locale } = useTranslation();
  const ts = t.settings;

  const [activeCategory, setActiveCategory] = useState<ApiCategory>('ai_image');
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([]);
  const [providers, setProviders] = useState<CategoryProviders[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formDisplayName, setFormDisplayName] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [siliconflowModelOptions, setSiliconflowModelOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [siliconflowModelLoading, setSiliconflowModelLoading] = useState(false);
  const [siliconflowModelError, setSiliconflowModelError] = useState<string | null>(null);

  // Edit state
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);

  // Category configuration with icons
  const CATEGORIES: Array<{
    id: ApiCategory;
    labelKey: keyof typeof ts.categories;
    icon: React.ReactNode;
  }> = [
    { id: 'ai_image', labelKey: 'aiImage', icon: <Image className="w-5 h-5" /> },
    { id: 'cloud_storage', labelKey: 'cloudStorage', icon: <Cloud className="w-5 h-5" /> },
    { id: 'digital_human', labelKey: 'digitalHuman', icon: <Video className="w-5 h-5" /> },
    { id: 'tts', labelKey: 'tts', icon: <Mic className="w-5 h-5" /> },
    { id: 'llm', labelKey: 'llm', icon: <Brain className="w-5 h-5" /> },
  ];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configsRes, providersRes] = await Promise.all([
        apiConfigApi.getConfigsByCategory(),
        apiConfigApi.getProviders(),
      ]);
      setCategoryConfigs(configsRes);
      setProviders(providersRes.categories);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(locale === 'zh' ? '加载设置失败' : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Get current category data
  const currentCategoryData = CATEGORIES.find((c) => c.id === activeCategory);
  const currentCategoryConfig = categoryConfigs.find((c) => c.category === activeCategory);
  const currentProviders = providers.find((p) => p.category === activeCategory)?.providers || [];
  const currentFormProvider = editingConfig?.provider || selectedProvider?.provider || null;

  // Get provider definition
  const getProviderDef = (providerName: string): Provider | undefined => {
    return currentProviders.find((p) => p.provider === providerName);
  };

  // Handle form field change
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Reset form
  const resetForm = () => {
    setSelectedProvider(null);
    setFormData({});
    setFormDisplayName('');
    setSetAsDefault(false);
    setShowAddForm(false);
    setEditingConfig(null);
    setSiliconflowModelOptions([]);
    setSiliconflowModelLoading(false);
    setSiliconflowModelError(null);
  };

  // Start adding new config
  const startAddConfig = (provider?: Provider) => {
    if (provider) {
      setSelectedProvider(provider);
      const defaults: Record<string, string> = {};
      provider.fields.forEach((field) => {
        if (field.default !== undefined && field.default !== null) {
          defaults[field.name] = String(field.default);
        }
      });
      setFormData(defaults);
      setFormDisplayName(provider.display_name);
    }
    setShowAddForm(true);
    setEditingConfig(null);
    setSiliconflowModelError(null);
  };

  // Start editing config
  const startEditConfig = async (config: ApiConfig) => {
    try {
      const fullConfig = await apiConfigApi.getConfig(config.id, true);
      setEditingConfig(fullConfig);
      setFormData(fullConfig.config_data as Record<string, string>);
      setFormDisplayName(fullConfig.display_name || '');
      setShowAddForm(true);
      setSelectedProvider(getProviderDef(fullConfig.provider));
      setSiliconflowModelError(null);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const loadSiliconFlowModels = async (silent = false) => {
    if (currentFormProvider !== 'siliconflow_tts') return;

    const apiKeyRaw = String(formData.api_key || '').trim();
    const apiKey = apiKeyRaw && !apiKeyRaw.includes('*') ? apiKeyRaw : undefined;
    const baseUrl = String(formData.base_url || '').trim() || undefined;

    if (!silent && !apiKey && !editingConfig) {
      setSiliconflowModelError(locale === 'zh' ? '请先填写 SiliconFlow API Key' : 'Please provide SiliconFlow API key first');
      return;
    }

    setSiliconflowModelLoading(true);
    if (!silent) setSiliconflowModelError(null);
    try {
      const res = await apiConfigApi.getSiliconFlowModels({
        api_key: apiKey,
        base_url: baseUrl,
      });
      const options = (res.models || []).map((m) => ({
        value: m.id,
        label: m.id,
      }));
      setSiliconflowModelOptions(options);
      if (!formData.model && options.length > 0) {
        setFormData((prev) => ({ ...prev, model: options[0].value }));
      }
    } catch (err) {
      console.error('Failed to load SiliconFlow models:', err);
      if (!silent) {
        const msg = err instanceof Error ? err.message : (locale === 'zh' ? '获取模型列表失败' : 'Failed to fetch model list');
        setSiliconflowModelError(msg);
      }
    } finally {
      setSiliconflowModelLoading(false);
    }
  };

  useEffect(() => {
    if (!showAddForm || currentFormProvider !== 'siliconflow_tts') return;
    const timer = setTimeout(() => {
      loadSiliconFlowModels(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [showAddForm, currentFormProvider, formData.api_key, formData.base_url]);

  // Save config
  const saveConfig = async () => {
    if (!selectedProvider && !editingConfig) return;

    setSaving(true);
    setError(null);

    try {
      if (editingConfig) {
        await apiConfigApi.updateConfig(editingConfig.id, {
          display_name: formDisplayName || undefined,
          config_data: formData,
        });
      } else if (selectedProvider) {
        await apiConfigApi.createConfig({
          category: activeCategory,
          provider: selectedProvider.provider,
          display_name: formDisplayName || selectedProvider.display_name,
          config_data: formData,
          set_as_default: setAsDefault,
        });
      }

      await loadData();
      resetForm();
    } catch (err: unknown) {
      console.error('Failed to save config:', err);
      const errorMessage = err instanceof Error ? err.message : (locale === 'zh' ? '保存失败' : 'Failed to save');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Delete config
  const deleteConfig = async (configId: string) => {
    if (!confirm(ts.confirmDelete)) {
      return;
    }

    try {
      await apiConfigApi.deleteConfig(configId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete config:', err);
      setError(locale === 'zh' ? '删除失败' : 'Failed to delete');
    }
  };

  // Set as default
  const setDefault = async (configId: string) => {
    try {
      await apiConfigApi.setDefault(configId);
      await loadData();
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  // Render config card
  const renderConfigCard = (config: ApiConfigBrief) => {
    const providerDef = getProviderDef(config.provider);
    const isEditing = editingConfig?.id === config.id;

    return (
      <div
        key={config.id}
        className={`
          p-4 rounded-xl border transition-all duration-200
          ${config.is_default
            ? 'border-cyan-500/50 bg-cyan-500/5'
            : config.is_system
            ? 'border-gray-700 bg-gray-800/50'
            : 'border-white/10 bg-white/5'}
          ${isEditing ? 'ring-2 ring-cyan-500' : ''}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">
                {config.display_name || providerDef?.display_name || config.provider}
              </h4>
              {config.is_default && (
                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                  {ts.default}
                </span>
              )}
              {config.is_system && (
                <span className="px-2 py-0.5 text-xs bg-gray-600/50 text-gray-400 rounded-full">
                  {ts.system}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {providerDef?.description || config.provider}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {config.is_validated ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  {ts.validated}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <AlertCircle className="w-3 h-3" />
                  {ts.notValidated}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!config.is_default && (
              <button
                onClick={() => setDefault(config.id)}
                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                title={ts.default}
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            {!config.is_system && (
              <>
                <button
                  onClick={() => startEditConfig(config as ApiConfig)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={ts.edit}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteConfig(config.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title={ts.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render form field
  const renderFormField = (field: ProviderField) => {
    const isPassword = field.type === 'password';
    const showPassword = showPasswords[field.name];

    // For model field in LLM/SiliconFlow category, use editable combo box
    const isModelField = field.name === 'model' && (activeCategory === 'llm' || currentFormProvider === 'siliconflow_tts');
    const fieldOptions =
      currentFormProvider === 'siliconflow_tts' && field.name === 'model' && siliconflowModelOptions.length > 0
        ? siliconflowModelOptions
        : field.options;

    return (
      <div key={field.name} className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {isModelField && fieldOptions ? (
          // Editable combo box - can type or select from dropdown
          <div className="relative">
            <input
              type="text"
              list={`datalist-${field.name}`}
              value={formData[field.name] || field.default || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder || (locale === 'zh' ? '选择或输入模型名称' : 'Select or type model name')}
              className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            />
            <datalist id={`datalist-${field.name}`}>
              {fieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value} label={opt.label} />
              ))}
            </datalist>
          </div>
        ) : field.type === 'select' && fieldOptions ? (
          <select
            value={formData[field.name] || field.default || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            {fieldOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="relative">
            <input
              type={isPassword && !showPassword ? 'password' : 'text'}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none pr-10"
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, [field.name]: !prev[field.name] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}

        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}

        {currentFormProvider === 'siliconflow_tts' && field.name === 'model' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadSiliconFlowModels(false)}
              disabled={siliconflowModelLoading}
              className="text-xs px-2 py-1 rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              {siliconflowModelLoading
                ? (locale === 'zh' ? '更新中...' : 'Refreshing...')
                : (locale === 'zh' ? '拉取最新模型' : 'Refresh Models')}
            </button>
            {siliconflowModelOptions.length > 0 && (
              <span className="text-xs text-gray-500">
                {locale === 'zh' ? `已加载 ${siliconflowModelOptions.length} 个模型` : `${siliconflowModelOptions.length} models loaded`}
              </span>
            )}
          </div>
        )}

        {currentFormProvider === 'siliconflow_tts' && field.name === 'model' && siliconflowModelError && (
          <p className="text-xs text-amber-400">{siliconflowModelError}</p>
        )}
      </div>
    );
  };

  // Render add/edit form
  const renderForm = () => {
    const fields = selectedProvider?.fields || [];

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingConfig ? ts.editConfig : ts.addConfig}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Provider selector */}
          {!editingConfig && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {ts.selectProvider}
              </label>
              {!selectedProvider ? (
                <div className="grid grid-cols-2 gap-2">
                  {currentProviders.map((provider) => (
                    <button
                      key={provider.provider}
                      onClick={() => startAddConfig(provider)}
                      className="p-3 text-left border border-white/10 rounded-lg hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                    >
                      <div className="font-medium text-white">{provider.display_name}</div>
                      <div className="text-xs text-gray-400 truncate">{provider.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                  <span className="font-medium text-white">{selectedProvider.display_name}</span>
                  <button
                    onClick={() => {
                      setSelectedProvider(null);
                      setFormData({});
                    }}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Config form */}
          {(selectedProvider || editingConfig) && (
            <div className="space-y-4">
              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {ts.displayName}
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder={locale === 'zh' ? '自定义名称（可选）' : 'Custom name (optional)'}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Dynamic fields */}
              {fields.map(renderFormField)}

              {/* Set as default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 bg-gray-800"
                />
                <span className="text-sm text-gray-300">{ts.setAsDefault}</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                >
                  {ts.cancel}
                </button>
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? ts.saving : ts.save}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{ts.title}</h1>
        <p className="text-gray-400">{ts.subtitle}</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-2">
            {CATEGORIES.map((category) => {
              const config = categoryConfigs.find((c) => c.category === category.id);
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 last:mb-0
                    ${isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {category.icon}
                  <div className="flex-1 text-left">
                    <div className="font-medium">
                      {ts.categories[category.labelKey]}
                    </div>
                    {config?.has_default && (
                      <div className="text-xs text-gray-500">
                        {config.default_provider}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1">
          <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-6">
            {/* Category header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {currentCategoryData?.icon}
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {ts.categories[currentCategoryData?.labelKey || 'aiImage']}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => startAddConfig()}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {ts.addConfig}
              </button>
            </div>

            {/* Existing configs */}
            <div className="space-y-3 mb-6">
              {currentCategoryConfig?.configs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {ts.noConfig}
                </div>
              )}
              {currentCategoryConfig?.configs.map(renderConfigCard)}
            </div>

            {/* Available providers */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                {ts.availableProviders}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentProviders.map((provider) => {
                  const hasConfig = currentCategoryConfig?.configs.some(
                    (c) => c.provider === provider.provider
                  );

                  return (
                    <div
                      key={provider.provider}
                      className={`
                        p-3 border border-white/5 rounded-lg
                        ${hasConfig ? 'opacity-50' : 'hover:border-cyan-500/30 cursor-pointer'}
                        transition-all
                      `}
                      onClick={() => !hasConfig && startAddConfig(provider)}
                    >
                      <div className="font-medium text-white text-sm">{provider.display_name}</div>
                      <div className="text-xs text-gray-500 truncate">{provider.description}</div>
                      {provider.website_url && (
                        <a
                          href={provider.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Website
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && renderForm()}
    </div>
  );
};

export default Settings;
