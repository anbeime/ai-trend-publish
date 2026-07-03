import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, index, foreignKey, text, json, timestamp, bigint, tinyint, boolean, uuid, datetime, char } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

// ============================================================
// 用户相关表
// ============================================================

/**
 * 用户表 - 存储用户基本信息
 */
export const users = mysqlTable("users", {
	id: uuid("id").default(sql`UUID()`).notNull(),
	username: varchar({ length: 50 }).notNull().unique(),
	email: varchar({ length: 255 }),
	passwordHash: varchar("password_hash", { length: 255 }),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	tier: varchar({ length: 20 }).default("free"), // free, pro, enterprise
	isActive: boolean("is_active").default(true),
	lastLoginAt: datetime("last_login_at", { fsp: 3 }),
	createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
	updatedAt: datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
},
(table) => [
	index("idx_users_username").on(table.username),
	index("idx_users_email").on(table.email),
	primaryKey({ columns: [table.id], name: "users_id"}),
]);

/**
 * 用户API配置表 - 存储用户自定义的第三方服务配置
 */
export const userApiConfigs = mysqlTable("user_api_configs", {
	id: uuid("id").default(sql`UUID()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
	category: varchar({ length: 30 }).notNull(), // tts, ai_image, digital_human, cloud_storage, llm
	provider: varchar({ length: 50 }).notNull(), // siliconflow_tts, agnes_image, wavespeed, etc.
	displayName: varchar("display_name", { length: 100 }),
	configData: json("config_data").notNull(), // 存储加密后的配置数据
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	isSystem: boolean("is_system").default(false), // 系统级配置标记
	isValidated: boolean("is_validated").default(false),
	lastValidatedAt: datetime("last_validated_at", { fsp: 3 }),
	validationError: text("validation_error"),
	createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
	updatedAt: datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
},
(table) => [
	index("idx_user_api_configs_user_id").on(table.userId),
	index("idx_user_api_configs_category").on(table.category),
	index("idx_user_api_configs_provider").on(table.provider),
	primaryKey({ columns: [table.id], name: "user_api_configs_id"}),
]);

// ============================================================
// 资产相关表
// ============================================================

/**
 * 资产表 - 存储头像、声音、脚本、故事板等资产
 */
export const assets = mysqlTable("assets", {
	id: uuid("id").default(sql`UUID()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
	type: varchar({ length: 20 }).notNull(), // avatar, voice, script, storyboard
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	content: text(), // 脚本内容等
	fileUrl: varchar("file_url", { length: 500 }),
	previewUrl: varchar("preview_url", { length: 500 }),
	thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
	metadata: json(), // 存储额外信息如 gender, duration_seconds, word_count 等
	isSystem: boolean("is_system").default(false), // 系统预设资产
	status: varchar({ length: 20 }).default("active"), // active, processing, failed
	tags: json(), // 标签数组
	createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
	updatedAt: datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
},
(table) => [
	index("idx_assets_user_id").on(table.userId),
	index("idx_assets_type").on(table.type),
	index("idx_assets_status").on(table.status),
	primaryKey({ columns: [table.id], name: "assets_id"}),
]);

// ============================================================
// 项目相关表
// ============================================================

/**
 * 项目表 - 存储数字人视频生成项目
 */
export const projects = mysqlTable("projects", {
	id: uuid("id").default(sql`UUID()`).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	title: varchar({ length: 200 }),
	avatarId: uuid("avatar_id").references(() => assets.id),
	voiceId: uuid("voice_id").references(() => assets.id),
	scriptId: uuid("script_id").references(() => assets.id),
	scriptContent: text("script_content"),
	// 情感配置
	emotion: varchar({ length: 50 }),
	emotionMode: varchar("emotion_mode", { length: 20 }), // preset, vector, audio_ref, text_ref
	emotionVector: json("emotion_vector"), // 情感向量
	emotionText: text("emotion_text"),
	emotionAlpha: int("emotion_alpha"), // 0-100
	emotionAudioAssetId: uuid("emotion_audio_asset_id").references(() => assets.id),
	// 表演配置
	performancePrompt: text("performance_prompt"),
	resolution: varchar({ length: 20 }).default("480p"),
	// 视频生成配置
	useVoiceAudioDirectly: boolean("use_voice_audio_directly").default(false),
	videoGenerationMode: varchar("video_generation_mode", { length: 20 }).default("tts_required"), // tts_required, audio_sync
	// 故事板配置
	storyboardAssetIds: json("storyboard_asset_ids"),
	referenceImageAssetIds: json("reference_image_asset_ids"),
	storyboardMode: varchar("storyboard_mode", { length: 20 }).default("none"), // none, first_frame, multi_image, keyframes
	promptMode: varchar("prompt_mode", { length: 20 }).default("script"), // script, direct
	promptOnlyVideo: boolean("prompt_only_video").default(false),
	language: varchar({ length: 10 }).default("zh"),
	// 输出结果
	thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
	videoUrl: varchar("video_url", { length: 500 }),
	status: varchar({ length: 30 }).default("pending"), // pending, generating_audio, generating_video, completed, failed
	progress: int().default(0), // 0-100
	currentStep: varchar("current_step", { length: 100 }),
	error: text(),
	createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
	updatedAt: datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
},
(table) => [
	index("idx_projects_user_id").on(table.userId),
	index("idx_projects_status").on(table.status),
	primaryKey({ columns: [table.id], name: "projects_id"}),
]);

/**
 * 项目步骤表 - 存储项目生成的详细步骤
 */
export const projectSteps = mysqlTable("project_steps", {
	id: uuid("id").default(sql`UUID()`).notNull(),
	projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
	stepName: varchar("step_name", { length: 50 }).notNull(),
	status: varchar({ length: 20 }).default("pending"), // pending, running, completed, failed
	progress: int().default(0),
	error: text(),
	createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
	updatedAt: datetime("updated_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
},
(table) => [
	index("idx_project_steps_project_id").on(table.projectId),
	primaryKey({ columns: [table.id], name: "project_steps_id"}),
]);

// ============================================================
// 系统配置相关表（原有）
// ============================================================

export const config = mysqlTable("config", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 255 }),
	value: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "config_id"}),
]);

export const dataSources = mysqlTable("data_sources", {
	id: int().autoincrement().notNull(),
	platform: varchar({ length: 255 }),
	identifier: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "data_sources_id"}),
]);

export const templateCategories = mysqlTable("template_categories", {
	id: int().autoincrement().notNull(),
	templateId: int("template_id").notNull().references(() => templates.id, { onDelete: "cascade" } ),
	category: varchar({ length: 50 }).notNull(),
},
(table) => [
	index("idx_template_id").on(table.templateId),
	primaryKey({ columns: [table.id], name: "template_categories_id"}),
]);

export const templateVersions = mysqlTable("template_versions", {
	id: int().autoincrement().notNull(),
	templateId: int("template_id").notNull().references(() => templates.id, { onDelete: "cascade" } ),
	version: varchar({ length: 20 }).notNull(),
	content: text().notNull(),
	schema: json(),
	changes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: int("created_by"),
},
(table) => [
	index("idx_template_id").on(table.templateId),
	primaryKey({ columns: [table.id], name: "template_versions_id"}),
]);

export const templates = mysqlTable("templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	platform: varchar({ length: 50 }).notNull(),
	style: varchar({ length: 50 }).notNull(),
	content: text().notNull(),
	schema: json(),
	exampleData: json("example_data"),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdBy: int("created_by"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "templates_id"}),
]);

export const vectorItems = mysqlTable("vector_items", {
	id: bigint({ mode: "number" }).notNull(),
	content: text(),
	vector: json(),
	vectorDim: int("vector_dim"),
	vectorType: varchar("vector_type", { length: 20 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "vector_items_id"}),
]);
