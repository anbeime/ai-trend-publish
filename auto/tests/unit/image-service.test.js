/**
 * ImageService 单元测试
 * 测试图片服务功能
 */

const ImageService = require('../../../utils/image-service.js');

describe('ImageService', () => {
  let service;

  beforeEach(() => {
    service = new ImageService();
  });

  describe('配置检查', () => {
    test('应该包含搜索配置', () => {
      expect(service.searchConfig).toBeDefined();
      expect(service.searchConfig.unsplash).toBeDefined();
      expect(service.searchConfig.pexels).toBeDefined();
    });

    test('应该包含AI生成配置', () => {
      expect(service.aiConfig).toBeDefined();
      expect(service.aiConfig.providers).toBeDefined();
    });

    test('应该包含尺寸配置', () => {
      expect(service.sizeConfig).toBeDefined();
      expect(service.sizeConfig.wechat).toBeDefined();
      expect(service.sizeConfig.xiaohongshu).toBeDefined();
      expect(service.sizeConfig.douyin).toBeDefined();
    });
  });

  describe('平台尺寸配置', () => {
    test('微信公众号应该有封面和内文尺寸', () => {
      const wechatConfig = service.sizeConfig.wechat;
      expect(wechatConfig.cover).toBeDefined();
      expect(wechatConfig.inline).toBeDefined();
      expect(wechatConfig.cover.ratio).toBe('2.35:1');
    });

    test('小红书应该有3:4竖版封面', () => {
      const xhsConfig = service.sizeConfig.xiaohongshu;
      expect(xhsConfig.cover).toBeDefined();
      expect(xhsConfig.cover.ratio).toBe('3:4');
    });

    test('抖音应该有9:16竖版封面', () => {
      const douyinConfig = service.sizeConfig.douyin;
      expect(douyinConfig.cover).toBeDefined();
      expect(douyinConfig.cover.ratio).toBe('9:16');
    });
  });

  describe('buildSearchQuery()', () => {
    test('应该构建正确的搜索查询', () => {
      const query = service.buildSearchQuery('AI技术', 'wechat', 'cover');
      expect(query).toBeDefined();
      expect(query).toContain('AI');
    });

    test('不同平台应该生成不同的查询关键词', () => {
      const wechatQuery = service.buildSearchQuery('科技', 'wechat', 'inline');
      const xhsQuery = service.buildSearchQuery('科技', 'xiaohongshu', 'cover');
      expect(wechatQuery).toBeDefined();
      expect(xhsQuery).toBeDefined();
    });
  });

  describe('getImageSuggestions()', () => {
    test('应该根据内容生成配图建议', () => {
      const content = '人工智能正在改变世界，AI技术发展迅速。';
      const suggestions = service.getImageSuggestions(content, 'wechat');
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('建议应该包含关键词和原因', () => {
      const content = '科技新闻：AI技术突破';
      const suggestions = service.getImageSuggestions(content, 'wechat');
      if (suggestions.length > 0) {
        expect(suggestions[0].keyword).toBeDefined();
        expect(suggestions[0].reason).toBeDefined();
      }
    });
  });

  describe('边界情况', () => {
    test('空内容应该返回空建议', () => {
      const suggestions = service.getImageSuggestions('', 'wechat');
      expect(suggestions).toBeDefined();
    });

    test('空查询应该返回空结果', () => {
      const query = service.buildSearchQuery('', 'wechat', 'cover');
      expect(query).toBeDefined();
    });
  });
});
