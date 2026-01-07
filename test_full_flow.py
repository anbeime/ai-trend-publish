#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
完整自动采集流程测试脚本
模拟N8N工作流的完整执行
"""

import requests
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

# 配置
COZE_TOKEN = os.getenv('COZE_AUTH_TOKEN')
COZE_WORKFLOW_ID = '7573873083216707599'
DRAFT_API_URL = 'http://127.0.0.1:8001/publish-draft'

# 偏好标签
TAGS = [
    '新能源', '数据标注', '金融', '充电桩', '储能', '光伏',
    'AI', '人工智能', '量化', '赚钱', '投资', 'agent',
    'YouTube', '鸿蒙', '智能', '具身智能', '新能源汽车',
    '芯片', '半导体', '科技', '创业'
]

# 热榜源
SOURCES = ['bilibili', 'weibo', '36kr', 'ithome']


def step1_collect_hotlist():
    """步骤1: 采集热榜数据"""
    print("\n" + "=" * 60)
    print("步骤1: 采集热榜数据")
    print("=" * 60)

    all_items = []
    for source in SOURCES:
        try:
            url = f'https://top.miyucaicai.cn/api/s?id={source}'
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get('items', [])
                print(f"  {source}: {len(items)}条")
                for item in items:
                    item['_source'] = source
                all_items.extend(items)
        except Exception as e:
            print(f"  {source}: 错误 - {str(e)[:30]}")

    print(f"\n  总计: {len(all_items)}条热点")
    return all_items


def step2_filter_by_tags(items):
    """步骤2: 标签过滤"""
    print("\n" + "=" * 60)
    print("步骤2: 标签过滤")
    print("=" * 60)

    filtered = []
    for item in items:
        title = item.get('title', '').lower()
        for tag in TAGS:
            if tag.lower() in title or tag in item.get('title', ''):
                filtered.append({
                    'title': item.get('title'),
                    'url': item.get('url') or item.get('link') or item.get('mobileUrl'),
                    'source': item.get('_source'),
                    'matched_tag': tag
                })
                break

    # 限制10条
    filtered = filtered[:10]

    print(f"  匹配偏好标签: {len(filtered)}条")
    for i, item in enumerate(filtered[:5]):
        print(f"    {i+1}. [{item['matched_tag']}] {item['title'][:35]}...")

    return filtered


def step3_fetch_content(url):
    """步骤3: 抓取网页内容"""
    print(f"\n  抓取: {url[:50]}...")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            html = resp.text

            # 简单清理HTML
            text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()

            # 限制长度
            if len(text) > 8000:
                text = text[:8000]

            print(f"    提取内容: {len(text)}字符")
            return text
        else:
            print(f"    HTTP错误: {resp.status_code}")
            return None
    except Exception as e:
        print(f"    错误: {str(e)[:50]}")
        return None


def step4_coze_rewrite(content, title):
    """步骤4: COZE改写"""
    print(f"\n  COZE改写中...")

    if not COZE_TOKEN:
        print("    错误: COZE_TOKEN未配置")
        return None

    headers = {
        'Authorization': f'Bearer {COZE_TOKEN}',
        'Content-Type': 'application/json'
    }

    payload = {
        'workflow_id': COZE_WORKFLOW_ID,
        'parameters': {
            'input': content[:5000]  # COZE有输入限制
        }
    }

    try:
        resp = requests.post(
            'https://api.coze.cn/v1/workflow/stream_run',
            headers=headers,
            json=payload,
            timeout=120
        )

        if resp.status_code == 200:
            # 解析SSE响应
            result_data = None
            for line in resp.text.split('\n'):
                if line.startswith('data:'):
                    try:
                        data = json.loads(line[5:].strip())
                        if data.get('event') == 'Message':
                            content_str = data.get('content', '{}')
                            result_data = json.loads(content_str)
                    except:
                        pass

            if result_data:
                print(f"    改写成功!")
                print(f"    标题: {result_data.get('title', '')[:30]}...")
                return result_data
            else:
                print(f"    解析响应失败")
                print(f"    响应: {resp.text[:200]}")
                return None
        else:
            print(f"    COZE错误: {resp.status_code}")
            print(f"    响应: {resp.text[:200]}")
            return None
    except Exception as e:
        print(f"    错误: {str(e)[:50]}")
        return None


def step5_publish_draft(data):
    """步骤5: 发布草稿"""
    print(f"\n  发布草稿...")

    try:
        resp = requests.post(DRAFT_API_URL, json=data, timeout=60)
        result = resp.json()

        if result.get('success'):
            print(f"    成功! media_id: {result.get('media_id', '')[:30]}...")
            return True
        else:
            print(f"    失败: {result.get('error')}")
            return False
    except Exception as e:
        print(f"    错误: {str(e)[:50]}")
        return False


def main():
    print("\n" + "=" * 60)
    print("完整自动采集流程测试")
    print("=" * 60)

    # 步骤1: 采集热榜
    items = step1_collect_hotlist()
    if not items:
        print("\n[失败] 没有采集到热点数据")
        return

    # 步骤2: 标签过滤
    filtered = step2_filter_by_tags(items)
    if not filtered:
        print("\n[失败] 没有匹配偏好标签的热点")
        return

    # 只测试第一条
    test_item = filtered[0]
    print(f"\n测试热点: {test_item['title']}")
    print(f"URL: {test_item['url']}")

    # 步骤3: 抓取内容
    print("\n" + "=" * 60)
    print("步骤3: 抓取网页内容")
    print("=" * 60)
    content = step3_fetch_content(test_item['url'])
    if not content:
        print("\n[失败] 无法抓取网页内容")
        return

    # 步骤4: COZE改写
    print("\n" + "=" * 60)
    print("步骤4: COZE AI改写")
    print("=" * 60)
    rewritten = step4_coze_rewrite(content, test_item['title'])
    if not rewritten:
        print("\n[失败] COZE改写失败")
        return

    # 步骤5: 发布草稿
    print("\n" + "=" * 60)
    print("步骤5: 发布微信草稿")
    print("=" * 60)

    draft_data = {
        'title': rewritten.get('title', test_item['title']),
        'content': rewritten.get('output', ''),
        'cover_url': rewritten.get('cover', '')
    }

    success = step5_publish_draft(draft_data)

    print("\n" + "=" * 60)
    if success:
        print("[成功] 完整流程测试通过!")
    else:
        print("[失败] 发布草稿失败")
    print("=" * 60)


if __name__ == '__main__':
    main()
