# TrendFinder 环境变量配置说明

本文档详细说明了TrendFinder系统所需的环境变量配置。请根据实际需求配置相应的环境变量。

## 配置文件结构

配置文件(.env)分为三个主要部分：

1. 基础服务配置 - 包含各种LLM服务和其他基础API的配置
2. 模块功能配置 - 定义各个功能模块使用的具体服务
3. 其他通用配置 - 包含数据库、通知等通用服务配置

## 详细配置说明

### 基础服务配置

#### LLM服务配置

系统支持两种类型的LLM服务提供商：

##### 1. OpenAI兼容协议API

以下服务均使用OpenAI兼容的API格式，可以互相替换使用：

###### OpenAI API

```
# OpenAI API配置
OPENAI_BASE_URL="https://api.openai.com"  # OpenAI API基础URL
OPENAI_API_KEY="your_api_key"            # OpenAI API密钥
OPENAI_MODEL="gpt-3.5-turbo"             # 默认使用的模型
```

###### DeepseekAI API

```
# DeepseekAI API配置 https://api-docs.deepseek.com/
DEEPSEEK_BASE_URL="https://api.deepseek.com"  # Deepseek API基础URL
DEEPSEEK_API_KEY="your_api_key"               # Deepseek API密钥
DEEPSEEK_MODEL="deepseek-chat"                # 默认使用的模型
```

###### 自定义LLM API（OpenAI兼容格式）

```
# 自定义LLM API配置（需要兼容OpenAI API格式）
CUSTOM_LLM_BASE_URL="your_api_base_url"  # 自定义LLM API基础URL
CUSTOM_LLM_API_KEY="your_api_key"        # 自定义LLM API密钥
CUSTOM_LLM_MODEL="your_model_name"       # 默认使用的模型
```

##### 2. 讯飞星火API

讯飞星火API使用独立的API格式，与OpenAI兼容API不同：

```
# 讯飞API配置 https://www.xfyun.cn/
XUNFEI_API_KEY="your_api_key"  # 讯飞API密钥
```

#### 默认LLM提供者

```
# 默认使用的LLM提供者，可选值: OPENAI | DEEPSEEK | XUNFEI | CUSTOM
DEFAULT_LLM_PROVIDER="DEEPSEEK"
```

### 模块功能配置

为不同的功能模块指定使用的LLM提供者：

```
# 内容排名模块使用的LLM提供者，可选值: OPENAI | DEEPSEEK | XUNFEI | CUSTOM
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK"

# 内容摘要模块使用的LLM提供者，可选值: OPENAI | DEEPSEEK | XUNFEI | CUSTOM
AI_SUMMARIZER_LLM_PROVIDER="DEEPSEEK"
```

### 数据存储配置

```
# 是否启用数据库
ENABLE_DB=true

# 数据库连接配置
DB_HOST=localhost     # 数据库主机地址
DB_PORT=3306          # 数据库端口
DB_USER=root          # 数据库用户名
DB_PASSWORD=password  # 数据库密码
DB_DATABASE=trendfinder  # 数据库名称
```

### 微信公众号配置

```
# 微信公众号API配置
WEIXIN_APP_ID="your_app_id"          # 微信公众号AppID
WEIXIN_APP_SECRET="your_app_secret"  # 微信公众号AppSecret

# 微信文章配置
NEED_OPEN_COMMENT=false       # 是否开启评论
ONLY_FANS_CAN_COMMENT=false   # 是否仅粉丝可评论
AUTHOR="your_name"            # 作者名称
```

### 数据抓取配置

```
# FireCrawl配置 https://www.firecrawl.dev/
FIRE_CRAWL_API_KEY="your_api_key"  # FireCrawl API密钥

# Twitter API配置 https://twitterapi.io/
X_API_BEARER_TOKEN="your_api_key"  # Twitter API Bearer Token
```

### 通知服务配置

```
# Bark通知服务配置
ENABLE_BARK=false           # 是否启用Bark通知
BARK_URL="your_bark_url"    # Bark服务URL
```

## 配置示例

完整的配置示例可参考项目中的`.env.example`文件。请复制该文件并重命名为`.env`，然后根据实际需求修改相应的配置项。

## 注意事项

1. 所有API密钥请妥善保管，不要泄露给他人
2. 生产环境中，建议使用环境变量或安全的密钥管理服务来存储敏感信息
3. 不同的LLM提供者可能有不同的计费方式和使用限制，请注意控制使用量
4. 配置文件中的注释行以`#`开头，不会被系统读取
