#!/usr/bin/env python3
"""
AI 模型切换使用示例
支持本地 cursorweb2api 的 24 个模型
"""

import requests
import json

class MultiModelAI:
    def __init__(self, base_url="http://localhost:8000/v1", api_key="aaa"):
        self.base_url = base_url
        self.api_key = api_key

    def chat(self, model, message, **kwargs):
        """
        调用指定模型进行对话

        Args:
            model: 模型ID（如 "claude-4.5-sonnet", "gpt-4o" 等）
            message: 用户消息
            **kwargs: 其他参数（temperature, max_tokens 等）
        """
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        data = {
            "model": model,
            "messages": [{"role": "user", "content": message}],
            **kwargs
        }

        response = requests.post(url, headers=headers, json=data)
        result = response.json()

        return result["choices"][0]["message"]["content"]

    def list_models(self):
        """列出所有可用模型"""
        url = f"{self.base_url}/models"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        response = requests.get(url, headers=headers)
        models = response.json()

        return [model["id"] for model in models["data"]]


# 使用示例
if __name__ == "__main__":
    ai = MultiModelAI()

    # 1. 查看所有可用模型
    print("📋 可用模型:")
    models = ai.list_models()
    for i, model in enumerate(models, 1):
        print(f"  {i}. {model}")

    print("\n" + "="*50 + "\n")

    # 2. 使用 Claude 4.5 Sonnet
    print("🤖 Claude 4.5 Sonnet:")
    response = ai.chat("claude-4.5-sonnet", "用一句话介绍你自己")
    print(f"   {response}\n")

    # 3. 使用 GPT-4o
    print("🤖 GPT-4o:")
    response = ai.chat("gpt-4o", "用一句话介绍你自己")
    print(f"   {response}\n")

    # 4. 使用 Gemini 2.5 Flash（快速）
    print("🤖 Gemini 2.5 Flash:")
    response = ai.chat("gemini-2.5-flash", "用一句话介绍你自己")
    print(f"   {response}\n")

    # 5. 使用 DeepSeek R1（推理）
    print("🤖 DeepSeek R1 (推理):")
    response = ai.chat("deepseek-r1", "1+1=?", temperature=0.1)
    print(f"   {response}\n")

    # 6. 使用 Code Supernova（编程）
    print("🤖 Code Supernova (编程):")
    response = ai.chat("code-supernova-1-million", "写一个Python快速排序函数", max_tokens=500)
    print(f"   {response}\n")

    # 7. 对比不同模型的回答
    print("\n" + "="*50)
    print("📊 对比测试：同一个问题用不同模型")
    print("="*50 + "\n")

    question = "什么是量子纠缠？用一句话解释。"
    test_models = ["claude-4.5-sonnet", "gpt-4o", "gemini-2.5-flash", "deepseek-v3.1"]

    for model in test_models:
        print(f"🤖 {model}:")
        response = ai.chat(model, question, max_tokens=100)
        print(f"   {response}\n")
