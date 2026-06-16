# 配置说明

## 环境变量配置

### 1. 微信公众号配置
在 `cloudfunctions/wechat-publish-sdk/config.json` 中配置：
```json
{
  "envId": "your-cloud-env-id",
  "functionRoot": "./cloudfunctions",
  "functions": [
    {
      "name": "wechat-publish-sdk",
      "timeout": 30,
      "envVariables": {
        "WECHAT_APPID": "your-wechat-appid",
        "WECHAT_SECRET": "your-wechat-secret"
      }
    }
  ]
}
```

### 2. 云开发配置
在 `cloudbaserc.json` 中配置：
```json
{
  "envId": "your-cloud-env-id"
}
```

### 3. API密钥配置
在各云函数的 `config.json` 中配置相应的API密钥。

## 注意事项
- 所有包含敏感信息的配置文件都已添加到 `.gitignore`
- 请勿将真实的API密钥提交到代码仓库
- 建议使用环境变量或云函数环境变量管理敏感信息
