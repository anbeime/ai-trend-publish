/**
 * 检查云函数超时配置
 * 运行方式：在项目根目录执行 node scripts/check-cloudfunction-config.js
 */

"use strict";

const fs = require('fs');
const path = require('path');

const __dirname = path.dirname(__filename);

// 云函数目录
const cloudFunctionsDir = path.join(__dirname, '..', 'cloudfunctions');

// 获取所有云函数目录
const functionDirs = fs.readdirSync(cloudFunctionsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log('\n========================================');
console.log('云函数超时配置检查');
console.log('========================================\n');

const results = {
  correct: [],
  needFix: [],
  noConfig: []
};

functionDirs.forEach(dirName => {
  const packageJsonPath = path.join(cloudFunctionsDir, dirName, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`❌ ${dirName}: 缺少 package.json`);
    results.noConfig.push(dirName);
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const config = packageJson['cloudfunction-config'];
    
    if (!config) {
      console.log(`⚠️  ${dirName}: 缺少 cloudfunction-config`);
      results.noConfig.push(dirName);
      return;
    }
    
    const timeout = config.timeout || 0;
    const memory = config.memorySize || 0;
    
    if (timeout >= 60) {
      console.log(`✅ ${dirName}: ${memory}MB / ${timeout}s`);
      results.correct.push({ name: dirName, memory, timeout });
    } else {
      console.log(`❌ ${dirName}: ${memory}MB / ${timeout}s (需要 60s)`);
      results.needFix.push({ name: dirName, memory, timeout });
    }
  } catch (error) {
    console.log(`❌ ${dirName}: 解析失败 - ${error.message}`);
    results.noConfig.push(dirName);
  }
});

console.log('\n========================================');
console.log('统计结果');
console.log('========================================');
console.log(`✅ 配置正确: ${results.correct.length} 个`);
console.log(`❌ 需要修复: ${results.needFix.length} 个`);
console.log(`⚠️  缺少配置: ${results.noConfig.length} 个`);

if (results.needFix.length > 0) {
  console.log('\n需要修复的云函数:');
  results.needFix.forEach(item => {
    console.log(`  - ${item.name}: ${item.memory}MB / ${item.timeout}s`);
  });
}

if (results.noConfig.length > 0) {
  console.log('\n缺少配置的云函数:');
  results.noConfig.forEach(name => {
    console.log(`  - ${name}`);
  });
}

console.log('\n========================================');
console.log('下一步操作');
console.log('========================================');
console.log('1. 在微信开发者工具中，右键点击云函数目录');
console.log('2. 选择「上传并部署：云端安装依赖」');
console.log('3. 等待部署完成');
console.log('4. 在云开发控制台验证超时配置是否生效');
console.log('');
