# 清理重复按钮的脚本
$file = "c:/D/compet/tengxun/miniprogram-agent/pages/agents/agents.wxml.broken"
$output = "c:/D/compet/tengxun/miniprogram-agent/pages/agents/agents.wxml"

$content = Get-Content $file -Raw -Encoding UTF8

# 删除所有重复的FAB按钮（包括注释和按钮代码）
$pattern = '(?s)<!-- 推送到公众号按钮 -->\s*<view class="publish-fab"[^>]*>.*?</view>\s*'
$cleanContent = [regex]::Replace($content, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Multiline)

# 输出清理后的内容
Set-Content $output -Value $cleanContent -Encoding UTF8 -NoNewline

Write-Host "清理完成，结果已保存到: $output"
