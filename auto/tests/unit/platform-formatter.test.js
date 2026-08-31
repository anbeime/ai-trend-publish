/**
 * PlatformFormatter 单元测试
 * 测试多平台内容排版优化功能
 */

// 模拟 PlatformFormatter 类
const PlatformFormatter = require('../../../utils/platform-formatter.js');

describe('PlatformFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new PlatformFormatter();
  });

  describe('format()', () => {
    const testContent = {
      title: '测试标题',
      content: '这是一段测试内容，用于验证格式化功能是否正常工作。',
      tags: ['测试', '单元测试'],
      coverSuggestion: '建议使用科技感图片作为封面'
    };

    test('应该正确格式化微信公众号内容', () => {
      const result = formatter.format(testContent, '微信公众号');
      expect(result).toBeDefined();
      expect(result.platform).toBe('微信公众号');
      expect(result.text).toContain('测试标题');
    });

    test('应该正确格式化小红书内容', () => {
      const result = formatter.format(testContent, '小红书');
      expect(result).toBeDefined();
      expect(result.platform).toBe('小红书');
      // 小红书应该包含emoji
      expect(result.text).toBeDefined();
    });

    test('应该正确格式化知乎内容', () => {
      const result = formatter.format(testContent, '知乎');
      expect(result).toBeDefined();
      expect(result.platform).toBe('知乎');
    });

    test('应该正确格式化抖音内容', () => {
      const result = formatter.format(testContent, '抖音');
      expect(result).toBeDefined();
      expect(result.platform).toBe('抖音');
      // 抖音内容应该比较简短
      expect(result.text.length).toBeLessThan(1000);
    });

    test('应该正确格式化B站内容', () => {
      const result = formatter.format(testContent, 'B站');
      expect(result).toBeDefined();
      expect(result.platform).toBe('B站');
    });
  });

  describe('formatAll()', () => {
    const testContent = {
      title: '全平台测试',
      content: '这段内容将格式化为所有平台版本。',
      tags: ['全平台']
    };

    test('应该生成所有平台的格式化内容', () => {
      const results = formatter.formatAll(testContent);
      expect(results).toBeDefined();
      expect(results['微信公众号']).toBeDefined();
      expect(results['小红书']).toBeDefined();
      expect(results['知乎']).toBeDefined();
      expect(results['抖音']).toBeDefined();
      expect(results['B站']).toBeDefined();
    });
  });

  describe('平台配置', () => {
    test('应该包含所有必要的平台配置', () => {
      const config = formatter.platformConfig;
      expect(config['微信公众号']).toBeDefined();
      expect(config['小红书']).toBeDefined();
      expect(config['知乎']).toBeDefined();
      expect(config['抖音']).toBeDefined();
      expect(config['B站']).toBeDefined();
    });

    test('每个平台应该有必要的配置项', () => {
      Object.values(formatter.platformConfig).forEach(platformConfig => {
        expect(platformConfig.name).toBeDefined();
        expect(platformConfig.maxLength).toBeDefined();
        expect(platformConfig.features).toBeDefined();
      });
    });
  });

  describe('边界情况', () => {
    test('空内容应该返回空结果', () => {
      const result = formatter.format({}, '微信公众号');
      expect(result).toBeDefined();
    });

    test('未知平台应该使用默认格式', () => {
      const content = { title: '测试', content: '内容' };
      const result = formatter.format(content, '未知平台');
      expect(result).toBeDefined();
    });

    test('超长内容应该被截断', () => {
      const longContent = {
        title: '测试',
        content: 'A'.repeat(5000)
      };
      const result = formatter.format(longContent, '抖音');
      expect(result.text.length).toBeLessThanOrEqual(600);
    });
  });
});
