// pages/agents/modules/index.js
// 模块统一导出

/**
 * 核心服务模块
 */
const APIService = require("./api-service");
const ConfigManager = require("./config");
const StorageManager = require("./storage-manager");

/**
 * 功能模块
 */
const CharacterConsistency = require("./character-consistency");
const MediaGenerator = require("./media-generator");
const StyleManager = require("./style-manager");
const UIHelper = require("./ui-helper");
const AgentRegistry = require("./agent-registry");
const WorkflowManager = require("./workflow-manager");
const FeedbackManager = require("./feedback-manager");
const HistoryManager = require("./history-manager");
const TrendManager = require("./trend-manager");
const UserPreference = require("./user-preference");
const KnowledgeManager = require("./knowledge-manager");
const ContentPublisher = require("./content-publisher");

/**
 * 生成器模块
 */
const ImageGenerator = require("./image-generator");
const ImageGeneratorCloud = require("./image-generator-cloud");
const TextGeneratorCloud = require("./text-generator-cloud");
const VideoGenerator = require("./video-generator");

/**
 * 工具模块
 */
const LinkParser = require("./link-parser");
const PromptTemplates = require("./prompt-templates");
const QualityDetector = require("./quality-detector");

/**
 * 统一导出
 */
module.exports = {
  // 核心服务
  APIService,
  ConfigManager,
  StorageManager,

  // 功能模块
  CharacterConsistency,
  MediaGenerator,
  StyleManager,
  UIHelper,
  AgentRegistry,
  WorkflowManager,
  FeedbackManager,
  HistoryManager,
  TrendManager,
  UserPreference,
  KnowledgeManager,
  ContentPublisher,

  // 生成器
  ImageGenerator,
  ImageGeneratorCloud,
  TextGeneratorCloud,
  VideoGenerator,

  // 工具
  LinkParser,
  PromptTemplates,
  QualityDetector,
};
