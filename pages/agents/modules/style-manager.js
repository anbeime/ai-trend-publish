const STYLE_LIBRARY_KEY = "style_library";

class StyleManager {
  constructor(pageContext) {
    this.page = pageContext;
  }

  loadStyleLibrary() {
    const defaultStyles = {
      anime: { key: "anime", name: "日系动漫", icon: "🎌", basePrompt: "anime style, manga art" },
      guofeng: { key: "guofeng", name: "古装国风", icon: "🏯", basePrompt: "Chinese ancient style" },
      modern: { key: "modern", name: "现代写实", icon: "📷", basePrompt: "modern realistic style" },
      cyberpunk: { key: "cyberpunk", name: "赛博朋克", icon: "🌃", basePrompt: "cyberpunk style, neon" }
    };
    
    const saved = wx.getStorageSync(STYLE_LIBRARY_KEY);
    const styles = saved || defaultStyles;
    this.page.setData({ styleLibrary: styles });
    this.convertStyleLibraryToArray();
    return styles;
  }

  convertStyleLibraryToArray() {
    const styles = this.page.data.styleLibrary || {};
    const array = Object.values(styles);
    this.page.setData({ styleArray: array });
  }

  saveStyleLibrary(styles) {
    wx.setStorageSync(STYLE_LIBRARY_KEY, styles);
    this.page.setData({ styleLibrary: styles });
    this.convertStyleLibraryToArray();
  }

  selectStyle(e) {
    const styleKey = e.currentTarget.dataset.key;
    this.page.setData({ selectedStyle: styleKey });
    wx.showToast({ title: "风格已选择", icon: "success" });
  }

  getRecommendedStyle(userInput) {
    if (userInput.includes("动漫") || userInput.includes("二次元")) return "anime";
    if (userInput.includes("古风") || userInput.includes("古代")) return "guofeng";
    if (userInput.includes("科幻") || userInput.includes("未来")) return "cyberpunk";
    return "modern";
  }

  applyStyleToPrompt(basePrompt, styleKey) {
    const styles = this.page.data.styleLibrary || {};
    const style = styles[styleKey];
    if (style && style.basePrompt) {
      return basePrompt + ", " + style.basePrompt;
    }
    return basePrompt;
  }

  toggleStylePanel() {
    const show = !this.page.data.showStylePanel;
    this.page.setData({ showStylePanel: show });
  }
}

module.exports = StyleManager;
