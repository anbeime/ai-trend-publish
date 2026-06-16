#!/bin/bash

echo "========================================"
echo "   微信文章发布工具 - 启动脚本"
echo "========================================"
echo

# 检查 Node.js 环境
echo "正在检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "[✓] Node.js 环境正常"
node --version

echo
echo "正在检查依赖包..."
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖包安装失败"
        exit 1
    fi
fi
echo "[✓] 依赖包检查完成"

echo
echo "正在启动服务..."
echo "服务启动后，请在浏览器中访问: http://localhost:3000/wechat-publisher.html"
echo

# 尝试不同的启动方式
if [ -f "package.json" ]; then
    if grep -q "scripts" package.json; then
        if grep -q '"dev"' package.json; then
            echo "使用 npm run dev 启动..."
            npm run dev
        elif grep -q '"start"' package.json; then
            echo "使用 npm start 启动..."
            npm start
        else
            echo "使用默认方式启动..."
            node src/server.ts
        fi
    else
        echo "使用默认方式启动..."
        node src/server.ts
    fi
else
    echo "使用简单HTTP服务器启动..."
    echo "正在寻找 index.html 或 wechat-publisher.html..."
    if [ -f "wechat-publisher.html" ]; then
        echo "启动简单HTTP服务器..."
        npx http-server -p 3000 -o wechat-publisher.html
    elif [ -f "index.html" ]; then
        echo "启动简单HTTP服务器..."
        npx http-server -p 3000 -o index.html
    else
        echo "[错误] 未找到启动文件"
        exit 1
    fi
fi

echo
echo "服务已停止"