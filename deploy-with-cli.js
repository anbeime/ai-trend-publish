/**
 * 使用 miniprogram-ci 部署云函数
 * 需要先安装: npm install -g miniprogram-ci
 *
 * 使用方法:
 * 1. 设置环境变量:
 *    set WECHAT_APPID=你的小程序APPID
 *    set WECHAT_PRIVATE_KEY_PATH=小程序代码上传密钥路径
 *
 * 2. 运行脚本:
 *    node deploy-with-cli.js
 */

const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

// 小程序配置
const appid = process.env.WECHAT_APPID || '你的小程序APPID';
const privateKeyPath = process.env.WECHAT_PRIVATE_KEY_PATH || '代码上传密钥路径';
const projectPath = path.resolve(__dirname);

// 云函数列表（按依赖关系排序）
const cloudFunctions = [
  // 基础云函数
  'init-collections',
  'api-config',

  // 管理类云函数
  'member-manager',
  'wechat-account-manager',
  'project-manager',
  'template-manager',
  'character-manager',

  // 工具类云函数
  'link-parser',
  'mediacrawler-hotspot',
  'social-media-proxy',

  // AI 相关云函数
  'glm-api',
  'agentAI',
  'chatDream',
  'generateDreamPrompt',
  'generateImage',
  'content-optimizer',

  // 数据库相关
  'creationHistory',
  'creationHistory-initDatabase',
  'credit-manager',

  // 热点相关
  'hotspot-analyzer',
  'hotspot-collector',
  'hotspot-miyucaicai',
  'hotspot-scorer',

  // 支付和发布
  'pay',
  'topic-scorer',
  'url-to-markdown',
  'video-composer',
  'viral-video-parser',
  'wechat-publish-api',
  'wechat-publish-sdk',
  'xiaohongshu-publisher'
];

async function deployCloudFunction(functionName) {
  const functionPath = path.join(projectPath, 'cloudfunctions', functionName);

  // 检查云函数目录是否存在
  if (!fs.existsSync(functionPath)) {
    console.log(`⚠️  跳过: ${functionName} (目录不存在)`);
    return { success: false, skipped: true };
  }

  // 检查 package.json 是否存在
  const packageJsonPath = path.join(functionPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  跳过: ${functionName} (缺少 package.json)`);
    return { success: false, skipped: true };
  }

  try {
    console.log(`\n📦 正在部署: ${functionName}`);

    // 读取 package.json 获取配置
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const config = packageJson['cloudfunction-config'] || {};

    console.log(`   内存: ${config.memorySize || 256}MB`);
    console.log(`   超时: ${config.timeout || 3}秒`);

    // 使用 ci.cloud.uploadFunction 部署云函数
    // 注意：这需要有效的登录态和权限
    await ci.cloud.uploadFunction({
      projectPath: projectPath,
      env: '你的云环境ID', // 需要替换为实际的云环境ID
      name: functionName,
      path: functionPath,
      // 安装依赖
      installDependencies: true
    });

    console.log(`✅ 成功: ${functionName}`);
    return { success: true };

  } catch (error) {
    console.log(`❌ 失败: ${functionName}`);
    console.log(`   错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('==========================================');
  console.log('  微信小程序云函数批量部署');
  console.log('==========================================\n');

  // 检查配置
  if (appid === '你的小程序APPID') {
    console.log('❌ 错误: 请设置 WECHAT_APPID 环境变量');
    console.log('   示例: set WECHAT_APPID=wx1234567890abcdef\n');
    process.exit(1);
  }

  if (privateKeyPath === '代码上传密钥路径' || !fs.existsSync(privateKeyPath)) {
    console.log('❌ 错误: 请设置有效的 WECHAT_PRIVATE_KEY_PATH 环境变量');
    console.log('   示例: set WECHAT_PRIVATE_KEY_PATH=C:\\keys\\private.key\n');
    process.exit(1);
  }

  console.log(`小程序 AppID: ${appid}`);
  console.log(`项目路径: ${projectPath}`);
  console.log(`云函数数量: ${cloudFunctions.length}\n`);

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  // 逐个部署云函数
  for (let i = 0; i < cloudFunctions.length; i++) {
    const functionName = cloudFunctions[i];
    console.log(`\n[${i + 1}/${cloudFunctions.length}]`);

    const result = await deployCloudFunction(functionName);

    if (result.success) {
      results.success.push(functionName);
    } else if (result.skipped) {
      results.skipped.push(functionName);
    } else {
      results.failed.push({ name: functionName, error: result.error });
    }

    // 添加延迟，避免请求过快
    if (i < cloudFunctions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 输出总结
  console.log('\n\n==========================================');
  console.log('  部署完成总结');
  console.log('==========================================');
  console.log(`✅ 成功: ${results.success.length} 个`);
  console.log(`❌ 失败: ${results.failed.length} 个`);
  console.log(`⚠️  跳过: ${results.skipped.length} 个`);

  if (results.success.length > 0) {
    console.log('\n成功部署的云函数:');
    results.success.forEach(name => console.log(`  ✓ ${name}`));
  }

  if (results.failed.length > 0) {
    console.log('\n部署失败的云函数:');
    results.failed.forEach(item => {
      console.log(`  ✗ ${item.name}`);
      console.log(`    错误: ${item.error}`);
    });
  }

  if (results.skipped.length > 0) {
    console.log('\n跳过的云函数:');
    results.skipped.forEach(name => console.log(`  - ${name}`));
  }

  console.log('\n==========================================\n');
}

// 运行主函数
main().catch(error => {
  console.error('部署过程出错:', error);
  process.exit(1);
});
