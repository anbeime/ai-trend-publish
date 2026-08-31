/**
 * ContentOptimizer 单元测试
 * 测试内容优化功能
 */

const ContentOptimizer = require('../../../utils/content-optimizer.js');

describe('ContentOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new ContentOptimizer();
  });

  describe('optimizeTitle()', () => {
    test('应该生成数字类型标题', () => {
      const titles = optimizer.optimizeTitle('AI工具推荐', 'number');
      expect(titles).toBeDefined();
      expect(titles.length).toBeGreaterThan(0);
      expect(titles[0]).toContain('AI');
    });

    test('应该生成疑问类型标题', () => {
      const titles = optimizer.optimizeTitle('职场技能', 'question');
      expect(titles).toBeDefined();
      expect(titles.length).toBeGreaterThan(0);
    });

    test('应该生成对比类型标题', () => {
      const titles = optimizer.optimizeTitle('学习方法', 'contrast');
      expect(titles).toBeDefined();
      expect(titles.length).toBeGreaterThan(0);
    });

    test('应该生成热点类型标题', () => {
      const titles = optimizer.optimizeTitle('AI革命', 'hot', {
        hotTopic: 'AI革命'
      });
      expect(titles).toBeDefined();
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  describe('extractKeywords()', () => {
    test('应该从标题中提取关键词', () => {
      const keywords = optimizer.extractKeywords('AI工具助力职场效率提升');
      expect(keywords).toBeDefined();
      expect(keywords.topic).toBeDefined();
    });

    test('空标题应该返回默认值', () => {
      const keywords = optimizer.extractKeywords('');
      expect(keywords).toBeDefined();
    });
  });

  describe('improveContent()', () => {
    test('应该改进内容可读性', () => {
      const content = '这是一段测试内容。';
      const improved = optimizer.improveContent(content);
      expect(improved).toBeDefined();
    });
  });

  describe('suggestSEO()', () => {
    test('应该为AI主题提供SEO建议', () => {
      const suggestions = optimizer.suggestSEO('AI', '人工智能发展趋势');
      expect(suggestions).toBeDefined();
      expect(suggestions.keywords).toBeDefined();
    });
  });

  describe('情感词库', () => {
    test('应该包含正面情感词', () => {
      expect(optimizer.emotionWords.positive).toBeDefined();
      expect(optimizer.emotionWords.positive.length).toBeGreaterThan(0);
    });

    test('应该包含紧迫感词汇', () => {
      expect(optimizer.emotionWords.urgency).toBeDefined();
      expect(optimizer.emotionWords.urgency.length).toBeGreaterThan(0);
    });

    test('应该包含好奇心词汇', () => {
      expect(optimizer.emotionWords.curiosity).toBeDefined();
    });

    test('应该包含权威性词汇', () => {
      expect(optimizer.emotionWords.authority).toBeDefined();
    });
  });

  describe('标题模板', () => {
    test('应该包含数字模板', () => {
      expect(optimizer.titleTemplates.number).toBeDefined();
      expect(optimizer.titleTemplates.number.length).toBeGreaterThan(0);
    });

    test('应该包含疑问模板', () => {
      expect(optimizer.titleTemplates.question).toBeDefined();
    });

    test('应该包含对比模板', () => {
      expect(optimizer.titleTemplates.contrast).toBeDefined();
    });

    test('应该包含热点模板', () => {
      expect(optimizer.titleTemplates.hot).toBeDefined();
    });
  });

  describe('边界情况', () => {
    test('空标题应该返回空数组', () => {
      const titles = optimizer.optimizeTitle('', 'number');
      expect(titles).toBeDefined();
    });

    test('未知风格应该使用默认风格', () => {
      const titles = optimizer.optimizeTitle('测试', 'unknown_style');
      expect(titles).toBeDefined();
    });
  });
});
