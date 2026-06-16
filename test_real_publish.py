#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""测试真实COZE SSE数据发布"""

import requests
import json

# 用户提供的真实COZE SSE输出
coze_sse = '''id: 5
event: Message
data: {"content":"{\\"cover\\":\\"https://s.coze.cn/t/FIfF80sXCkE/\\",\\"output\\":\\"<!DOCTYPE html>\\\\n<html lang=\\\\\\"zh-CN\\\\\\">\\\\n<head>\\\\n    <meta charset=\\\\\\"UTF-8\\\\\\">\\\\n    <title>1209倍超额认购！MiniMax四年上市神话</title>\\\\n</head>\\\\n<body>\\\\n    <h2 style=\\\\\\"background: linear-gradient(to right, #ff6b6b, #556270); padding: 20px; text-align: center; color: white;\\\\\\">1209倍超额认购！MiniMax四年上市神话</h2>\\\\n    <p>2026年刚开年，金融圈就被一则消息炸翻了天。</p>\\\\n    <img src=\\\\\\"https://p3-search.byteimg.com/img/labis/214a9541d884b09b51a13d11448c3188~480x480.GIF\\\\\\" style=\\\\\\"width: 100%; margin: 20px 0;\\\\\\">\\\\n    <p>MiniMax的招股书里清楚地写着，2025年前九个月营收5344万美元。</p>\\\\n    <p>#MiniMax #AI投资 #财富密码</p>\\\\n</body>\\\\n</html>\\",\\"title\\":\\"1209倍！4年上市神话\\"}","content_type":"text"}

id: 6
event: Done
data: {}'''

# 模拟N8N发送的格式
test_data = [{"data": coze_sse}]

print("=" * 60)
print("测试真实COZE SSE数据发布")
print("=" * 60)

print("\n发送数据到draft-api...")
print(f"数据格式: list, 长度: {len(test_data)}")

try:
    resp = requests.post("http://127.0.0.1:8001/publish-draft", json=test_data, timeout=120)
    print(f"\n响应状态码: {resp.status_code}")

    result = resp.json()
    print(f"响应内容: {json.dumps(result, ensure_ascii=False, indent=2)}")

    if result.get("success"):
        print("\n" + "=" * 60)
        print("[成功] 草稿已发布到微信公众号!")
        print(f"media_id: {result.get('media_id')}")
        print("请检查公众号草稿箱")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print(f"[失败] {result.get('error')}")
        print("=" * 60)

except Exception as e:
    print(f"\n[异常] {e}")
