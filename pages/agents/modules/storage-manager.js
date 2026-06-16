// storage-manager.js
const LEARNING_DATA_KEY = "ai_learning_data";
const TEMPLATE_LIBRARY_KEY = "template_library";
const CREATION_HISTORY_KEY = "creation_history";
const AGENTS_PANEL_KEY = "agents_panel_collapsed";

class StorageManager {
  constructor(pageContext) {
    this.page = pageContext;
  }

  loadLearningData() {
    const learningData = wx.getStorageSync(LEARNING_DATA_KEY) || {
      userPreferences: [],
      successPatterns: [],
      stylePreferences: []
    };
    return learningData;
  }

  saveLearningData(data) {
    wx.setStorageSync(LEARNING_DATA_KEY, data);
  }

  loadTemplateLibrary() {
    const templates = wx.getStorageSync(TEMPLATE_LIBRARY_KEY) || [];
    this.page.setData({ templateLibrary: templates });
    return templates;
  }

  saveTemplateLibrary(templates) {
    wx.setStorageSync(TEMPLATE_LIBRARY_KEY, templates);
    this.page.setData({ templateLibrary: templates });
  }

  loadCreationHistory() {
    return wx.getStorageSync(CREATION_HISTORY_KEY) || [];
  }

  saveCreationHistory(history) {
    wx.setStorageSync(CREATION_HISTORY_KEY, history);
  }

  loadAgentsPanelPreference() {
    const collapsed = wx.getStorageSync(AGENTS_PANEL_KEY) || false;
    this.page.setData({ agentsPanelCollapsed: collapsed });
    return collapsed;
  }

  saveAgentsPanelPreference(collapsed) {
    wx.setStorageSync(AGENTS_PANEL_KEY, collapsed);
  }
}

module.exports = StorageManager;
