#!/bin/bash
# API 服务健康检查工具

API_URL="http://localhost:8000/v1/models"

echo "🔍 检查 AI API 服务状态..."
echo ""

# 检查服务是否运行
if curl -s --max-time 2 "$API_URL" -H "Authorization: Bearer aaa" > /dev/null 2>&1; then
    echo "✅ 服务状态: 运行中"

    # 获取模型列表
    echo ""
    echo "📋 可用模型:"
    models=$(curl -s "$API_URL" -H "Authorization: Bearer aaa" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    count=0
    for model in $models; do
        count=$((count + 1))
        echo "  $count. $model"
    done

    echo ""
    echo "🎉 总计 $count 个模型可用"

    # 测试一个快速请求
    echo ""
    echo "🧪 测试 Gemini 2.5 Flash..."
    response=$(curl -s http://localhost:8000/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer aaa" \
      -d '{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}')

    if echo "$response" | grep -q "choices"; then
        echo "✅ 模型响应正常"
    else
        echo "⚠️  模型响应异常"
    fi

else
    echo "❌ 服务状态: 未运行"
    echo ""
    echo "💡 启动服务:"
    echo "   Windows: .claude\\start-ai-api.bat"
    echo "   Linux:   bash .claude/start-ai-api.sh"
    exit 1
fi
