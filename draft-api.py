from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import tempfile
import hashlib
from dotenv import load_dotenv
import markdown
import re
import json
import random
import time
import hmac
import hashlib as hashlib_module
from datetime import datetime
import base64
import sqlite3
import uuid

load_dotenv()
from wechat_sdk import WeChatAPI

app = Flask(__name__)
CORS(app)

wechat = WeChatAPI(
    app_id=os.getenv('WEIXIN_APP_ID'),
    app_secret=os.getenv('WEIXIN_APP_SECRET')
)

# 混元模型配置
HUNYUAN_SECRET_ID = os.getenv('HUNYUAN_SECRET_ID', '')
HUNYUAN_SECRET_KEY = os.getenv('HUNYUAN_SECRET_KEY', '')

# 智谱AI配置
ZHIPU_API_KEY = os.getenv('ZHIPU_API_KEY', 'd68afc047d2b47179fccca96e52ca57c.XDODZVHpC70KMfos')

# ========== 混元模型图片生成功能 ==========

def get_hunyuan_authorization(method, host, path, query, body, secret_id, secret_key):
    """腾讯云API签名v3"""
    timestamp = int(time.time())
    date = datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d')

    # 构建规范请求串
    http_request_method = method
    canonical_uri = path
    canonical_querystring = query
    canonical_headers = f'host:{host}\n'
    signed_headers = 'host'
    hashed_request_payload = hashlib_module.sha256(body.encode('utf-8')).hexdigest()
    canonical_request = f'{http_request_method}\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{hashed_request_payload}'

    # 构建待签名字符串
    credential_scope = f'{date}/tc3_request'
    hashed_canonical_request = hashlib_module.sha256(canonical_request.encode('utf-8')).hexdigest()
    string_to_sign = f'TC3-HMAC-SHA256\n{timestamp}\n{credential_scope}\n{hashed_canonical_request}'

    # 计算签名
    secret_date = hmac.new(f'TC3{secret_key}'.encode('utf-8'), date.encode('utf-8'), hashlib_module.sha256).digest()
    secret_service = hmac.new(secret_date, 'tc3_request'.encode('utf-8'), hashlib_module.sha256).digest()
    signature = hmac.new(secret_service, string_to_sign.encode('utf-8'), hashlib_module.sha256).hexdigest()

    authorization = f'TC3-HMAC-SHA256 Credential={secret_id}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}'
    return authorization

def generate_image_with_hunyuan(prompt, size='1024:1024'):
    """
    使用混元模型生成图片
    返回图片URL
    """
    if not HUNYUAN_SECRET_ID or not HUNYUAN_SECRET_KEY:
        print("   [混元] 密钥未配置，将使用占位图")
        return None

    try:
        print(f"   [混元] 正在生成图片: {prompt[:50]}...")

        host = 'hunyuan.tencentcloudapi.com'
        path = '/'
        query = ''
        body = json.dumps({
            'Action': 'TextToImageAsync',
            'Version': '2024-09-17',
            'Region': 'ap-guangzhou',
            'Prompt': prompt,
            'PromptNegative': '',
            'Style': '101',
            'Resolution': size,
            'LogoAdd': 0,
            'RspImgType': 'url'
        }, ensure_ascii=False)

        authorization = get_hunyuan_authorization(
            'POST', host, path, query, body,
            HUNYUAN_SECRET_ID, HUNYUAN_SECRET_KEY
        )

        headers = {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Host': host,
            'X-TC-Action': 'TextToImageAsync',
            'X-TC-Timestamp': str(int(time.time())),
            'X-TC-Version': '2024-09-17',
            'X-TC-Region': 'ap-guangzhou'
        }

        response = requests.post(
            f'https://{host}{path}',
            headers=headers,
            data=body.encode('utf-8'),
            timeout=30
        )

        result = response.json()
        if 'Response' in result and 'TaskId' in result['Response']:
            task_id = result['Response']['TaskId']
            print(f"   [混元] 异步任务ID: {task_id}")
            # 混元API返回异步任务，这里简化处理，返回None使用占位图
            # 实际生产环境需要轮询查询任务状态
            print(f"   [混元] 异步任务暂不支持，使用占位图")
            return None
        elif 'Response' in result and 'ImageUrl' in result['Response']:
            image_url = result['Response']['ImageUrl']
            print(f"   [混元] 生成成功: {image_url[:60]}...")
            return image_url
        else:
            print(f"   [混元] API返回格式异常: {result}")
            return None

    except Exception as e:
        print(f"   [混元] 生成失败: {str(e)}")
        return None

def generate_image_with_zhipu(prompt, size='1024x1024'):
    """
    使用智谱AI生成图片
    返回图片URL
    """
    try:
        print(f"   [智谱AI] 正在生成图片: {prompt[:50]}...")

        url = 'https://open.bigmodel.cn/api/paas/v4/images/generations'
        headers = {
            'Authorization': f'Bearer {ZHIPU_API_KEY}',
            'Content-Type': 'application/json'
        }
        data = {
            'model': 'cogview-3-flash',
            'prompt': prompt,
            'size': size,
            'n': 1
        }

        response = requests.post(url, headers=headers, json=data, timeout=30)
        result = response.json()

        if 'data' in result and len(result['data']) > 0:
            image_url = result['data'][0]['url']
            print(f"   [智谱AI] 生成成功: {image_url[:60]}...")
            return image_url
        else:
            print(f"   [智谱AI] API返回格式异常: {result}")
            return None

    except Exception as e:
        print(f"   [智谱AI] 生成失败: {str(e)}")
        return None

def generate_cover_image(title, category):
    """
    为文章生成封面图
    优先使用混元模型，失败则使用智谱AI
    """
    prompt = f"微信公众号文章封面图，{category}主题，{title}，高清，专业，现代风格，中文文字，简洁大气，1024x1024"

    # 先尝试混元
    image_url = generate_image_with_hunyuan(prompt)
    if image_url:
        return image_url

    # 混元失败，尝试智谱AI
    image_url = generate_image_with_zhipu(prompt)
    if image_url:
        return image_url

    # 都失败，返回占位图
    return f"https://via.placeholder.com/900x500/4a6cf7/ffffff?text={title[:10]}"

def generate_content_images(article_title, count=5):
    """
    为文章生成内容图片
    """
    image_urls = []
    themes = [
        f"{article_title}背景图",
        f"{article_title}数据图表",
        f"{article_title}示意图",
        f"{article_title}应用场景",
        f"{article_title}未来展望"
    ]

    for i, theme in enumerate(themes[:count]):
        print(f"\n   生成第{i+1}张内容图片...")
        prompt = f"{theme}，微信公众号配图，高清，专业，简洁，800x600"

        # 先尝试混元
        image_url = generate_image_with_hunyuan(prompt)
        if not image_url:
            # 混元失败，尝试智谱AI
            image_url = generate_image_with_zhipu(prompt)
        if not image_url:
            # 都失败，使用占位图
            image_url = f"https://via.placeholder.com/800x600/5b7be8/ffffff?text=Image+{i+1}"

        image_urls.append(image_url)
        time.sleep(0.5)  # 避免API限流

    return image_urls

# ========== 热点采集功能（完整移植自云函数 hotspot-miyucaicai） ==========

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

# 热点数据缓存（内存缓存）
_hotspot_cache = {'data': None, 'timestamp': 0, 'enriched': None}
HOTSPOT_CACHE_TTL = 300  # 缓存有效期 5 分钟

# ----- 数据源配置（移植自云函数 SOURCE_CONFIG） -----
SOURCE_CONFIG = {
    'general': {
        'name': '综合热点',
        'sources': [
            {'id': 'weibo', 'name': '微博'},
            {'id': 'zhihu', 'name': '知乎'},
            {'id': 'baidu', 'name': '百度热搜'},
            {'id': 'toutiao', 'name': '今日头条'},
            {'id': 'tencent-hot', 'name': '腾讯新闻'},
        ],
    },
    'entertainment': {
        'name': '影视娱乐',
        'sources': [
            {'id': 'douyin', 'name': '抖音'},
            {'id': 'bilibili-hot-search', 'name': 'B站热搜'},
            {'id': 'tieba', 'name': '百度贴吧'},
        ],
    },
    'tech': {
        'name': '科技数码',
        'sources': [
            {'id': 'coolapk', 'name': '酷安'},
            {'id': 'ithome', 'name': 'IT之家'},
            {'id': 'v2ex-share', 'name': 'V2EX'},
            {'id': 'github-trending-today', 'name': 'GitHub'},
        ],
    },
    'finance': {
        'name': '财经金融',
        'sources': [
            {'id': 'wallstreetcn-hot', 'name': '华尔街见闻'},
            {'id': 'cls-hot', 'name': '财联社'},
            {'id': 'xueqiu-hotstock', 'name': '雪球'},
        ],
    },
    'sports': {
        'name': '体育社区',
        'sources': [{'id': 'hupu', 'name': '虎扑'}],
    },
}

SOURCE_ID_TO_NAME = {}
for cat in SOURCE_CONFIG.values():
    for s in cat['sources']:
        SOURCE_ID_TO_NAME[s['id']] = s['name']

DEFAULT_SOURCES = [
    'weibo', 'zhihu', 'baidu', 'toutiao', 'tencent-hot',
    'wallstreetcn-hot', 'cls-hot', 'xueqiu-hotstock',
    'coolapk', 'ithome', 'v2ex-share',
    'douyin', 'bilibili-hot-search', 'tieba',
    'hupu',
]

MAX_ITEMS_PER_SOURCE = 10
BATCH_SIZE = 5
REQUEST_TIMEOUT = 8  # 秒


def smart_category_mapping(title, source_name):
    """智能分类映射（移植自云函数 smartCategoryMapping）"""
    t = title.lower()
    categories = {
        'tech': ['ai', '人工智能', '芯片', '科技', '技术', '智能', '5g', '6g',
                  'deepseek', 'chatgpt', 'model', '算法', '编程', '代码', '开发',
                  '软件', '硬件', '电脑', '手机', '数码', '显卡', 'cpu', 'gpu',
                  '苹果', '华为', '小米', '特斯拉', '新能源', '电动车'],
        'food': ['美食', '吃', '餐厅', '咖啡', '奶茶', '火锅', '烧烤', '甜品',
                 '蛋糕', '菜', '厨', '食', '味', '饮', '瑞幸', '库迪', '蜜雪'],
        'travel': ['旅行', '旅游', '景点', '户外', '露营', '登山', '徒步',
                   '海边', '度假', '酒店', '民宿', '机票'],
        'entertainment': ['电影', '电视剧', '明星', '综艺', '娱乐', '演员', '导演',
                          '音乐', '歌手', '演唱会', '粉丝', '爱豆', '偶像', '网红',
                          '直播', '短剧'],
        'finance': ['股票', '基金', '理财', '投资', '经济', '金融', '银行', '利率',
                    '降息', '通胀', '美联储', 'a股', '港股', '美股', '比特币',
                    '加密货币', '黄金', '原油', '石油'],
        'gaming': ['游戏', '手游', '端游', 'steam', '原神', '王者', 'lol',
                   '英雄联盟', '绝地求生', '我的世界', '塞尔达', '黑神话', '米哈游', '暴雪'],
        'sports': ['nba', '足球', '篮球', '中超', '世界杯', '欧冠', 'cba',
                   '网球', '乒乓球', '羽毛球', '游泳', '田径'],
    }

    for cat, keywords in categories.items():
        for kw in keywords:
            if kw in t:
                return cat

    source_map = {
        '微博': 'general', '知乎': 'general', '百度热搜': 'general',
        '今日头条': 'general', '腾讯新闻': 'general',
        '抖音': 'entertainment', 'B站热搜': 'entertainment', '百度贴吧': 'entertainment',
        '酷安': 'tech', 'IT之家': 'tech', 'V2EX': 'tech', 'GitHub': 'tech',
        '华尔街见闻': 'finance', '财联社': 'finance', '雪球': 'finance',
        '虎扑': 'sports',
    }
    return source_map.get(source_name, 'general')


def extract_keywords(title, description=''):
    """提取关键词（移植自云函数 extractKeywords）"""
    text = f'{title} {description}'
    common_keywords = [
        'AI', '人工智能', 'DeepSeek', 'ChatGPT', '芯片', '5G', '智能', '科技', '技术',
        '美食', '咖啡', '奶茶', '火锅', '烧烤', '瑞幸', '库迪', '蜜雪冰城',
        '电影', '电视剧', '明星', '综艺', '短剧', '网红', '直播',
        '股票', '基金', '美联储', '降息', '黄金',
        'NBA', '足球', '篮球',
        '游戏', '原神', 'Steam',
        '生活', '健康', '运动', '教育', '工作', '职场', '就业',
        '旅行', '旅游', '景点', '露营', '户外',
    ]
    result = []
    for kw in common_keywords:
        if kw.lower() in text.lower() and kw not in result:
            result.append(kw)
    if not result:
        import re as _re
        words = _re.sub(r'[，。！？、；：""\'\'（）《》【】]', ' ', title).split()
        result = [w for w in words if 2 <= len(w) <= 6][:3]
    return result[:5]


def parse_heat(info):
    """解析热度值（移植自云函数 parseHeat）"""
    if not info or not isinstance(info, str):
        return 0
    import re as _re
    m = _re.search(r'(\d+(?:\.\d+)?)\s*万', info)
    if m:
        return int(float(m.group(1)) * 10000)
    m = _re.search(r'(\d+)', info)
    if m:
        return int(m.group(1))
    return 0


def parse_publish_time(item):
    """解析发布时间（移植自云函数 parsePublishTime）"""
    for field in ['publishTime', 'publish_time', 'createTime', 'create_time', 'time', 'date', 'pubDate']:
        val = item.get(field)
        if val:
            try:
                from dateutil import parser as dt_parser
                dt = dt_parser.parse(str(val))
                return dt.isoformat()
            except Exception:
                try:
                    dt = datetime.fromisoformat(str(val))
                    return dt.isoformat()
                except Exception:
                    pass
    extra = item.get('extra', {})
    if isinstance(extra, dict) and extra.get('publishTime'):
        try:
            from dateutil import parser as dt_parser
            return dt_parser.parse(str(extra['publishTime'])).isoformat()
        except Exception:
            pass
    return None


def generate_suggested_angles(category, keywords):
    """生成建议创作角度（移植自云函数 generateSuggestedAngles）"""
    angle_map = {
        'tech': ['技术解读', '应用场景分析', '未来趋势预测', '对比评测', '使用教程'],
        'entertainment': ['热点解读', '幕后故事', '观点评论', '搞笑改编', '粉丝视角'],
        'general': ['热点解读', '深度分析', '多方观点', '趋势预测'],
        'life': ['实用技巧', '经验分享', '避坑指南', '产品推荐', 'Vlog记录'],
        'food': ['制作教程', '探店体验', '食材介绍', '创意改良', '美食测评'],
        'travel': ['攻略分享', '景点介绍', 'Vlog记录', '省钱技巧', '文化解读'],
        'finance': ['行情分析', '投资建议', '政策解读', '趋势预测', '实操指南'],
        'gaming': ['游戏攻略', '版本分析', '赛事解读', '玩家体验', '新手教程'],
        'sports': ['赛事分析', '球员点评', '战术解读', '历史回顾', '粉丝视角'],
    }
    base = angle_map.get(category, ['热点解读', '创意改编', '话题讨论'])
    random.shuffle(base)
    return base[:3]


def enrich_hotspot_data(item, source_id, index):
    """增强热点数据（移植自云函数 enrichHotspotData）"""
    source_name = SOURCE_ID_TO_NAME.get(source_id, source_id)
    title = item.get('title') or item.get('id') or '未知热点'
    extra = item.get('extra', {}) if isinstance(item.get('extra'), dict) else {}
    description = extra.get('hover', title) if extra else title

    keywords = extract_keywords(title, description)
    category = smart_category_mapping(title, source_name)
    publish_time = parse_publish_time(item)
    now = datetime.now()
    fetch_time = now.isoformat()

    hours_old = 0
    freshness_score = 100
    if publish_time:
        try:
            from dateutil import parser as dt_parser
            pt = dt_parser.parse(publish_time)
            hours_old = (now - pt.replace(tzinfo=None)).total_seconds() / 3600
            if hours_old <= 12:
                freshness_score = 100
            elif hours_old <= 24:
                freshness_score = 70
            elif hours_old <= 48:
                freshness_score = 40
            else:
                freshness_score = 20
        except Exception:
            pass

    heat_val = parse_heat(extra.get('info', '')) if extra else 0

    return {
        'id': f'{source_id}-{index}-{int(now.timestamp())}',
        'name': title,
        'title': title,
        'reason': f'{source_name}热点',
        'heat': heat_val,
        'hotness': extra.get('info', '0') if extra else '0',
        'url': item.get('url') or item.get('mobileUrl', ''),
        'source': source_name,
        'platform': source_id,
        'sourceId': source_id,
        'index': index + 1,
        'description': description,
        'keywords': keywords,
        'tags': [source_name] + keywords[:2],
        'category': category,
        'trend': 'up',
        'trendDirection': 'up',
        'suggestedAngles': generate_suggested_angles(category, keywords),
        'fetchTime': fetch_time,
        'publishTime': publish_time or fetch_time,
        'hoursOld': round(hours_old),
        'freshnessScore': freshness_score,
    }


def fetch_source_hotspots(source_id, timeout=REQUEST_TIMEOUT, max_retries=1):
    """获取单个数据源的热点（移植自云函数 fetchSourceHotspots）"""
    source_name = SOURCE_ID_TO_NAME.get(source_id, source_id)
    for attempt in range(max_retries + 1):
        try:
            resp = requests.get(
                f'https://top.miyucaicai.cn/api/s?id={source_id}',
                timeout=timeout,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            )
            data = resp.json()
            if data.get('status') in ('success', 'cache') and data.get('items'):
                items = data['items'][:MAX_ITEMS_PER_SOURCE]
                print(f'   [OK] {source_name:12s} {len(items)} 条')
                return {
                    'success': True,
                    'sourceId': source_id,
                    'sourceName': source_name,
                    'count': len(items),
                    'data': [enrich_hotspot_data(item, source_id, i) for i, item in enumerate(items)],
                }
            print(f'   [EMPTY] {source_name:12s} 返回空数据')
            return {'success': False, 'sourceId': source_id, 'sourceName': source_name, 'count': 0, 'data': [], 'reason': 'empty'}
        except Exception as e:
            if attempt >= max_retries:
                print(f'   [FAIL] {source_name:12s} {str(e)}')
                return {'success': False, 'sourceId': source_id, 'sourceName': source_name, 'count': 0, 'data': [], 'reason': str(e)}
            print(f'   [RETRY] {source_name:12s} 第{attempt+1}次失败, 重试中...')


def fetch_multiple_sources(source_ids, timeout=REQUEST_TIMEOUT):
    """并发获取多个数据源（移植自云函数 fetchMultipleSources）"""
    all_hotspots = []
    source_status = {}
    with ThreadPoolExecutor(max_workers=len(source_ids)) as executor:
        futures = {executor.submit(fetch_source_hotspots, sid, timeout): sid for sid in source_ids}
        for future in as_completed(futures):
            try:
                result = future.result()
                if result and result.get('data'):
                    all_hotspots.extend(result['data'])
                    source_status[result.get('sourceName', result.get('sourceId'))] = {
                        'success': result.get('success', False),
                        'count': result.get('count', 0),
                        'reason': result.get('reason', 'ok'),
                    }
            except Exception as e:
                sid = futures[future]
                source_status[sid] = {'success': False, 'count': 0, 'reason': str(e)}
    return {'hotspots': all_hotspots, 'sourceStatus': source_status}


def fetch_all_hotspots_full(limit=100):
    """
    完整多源采集流程（移植自云函数 main 逻辑）
    分批并发 -> 去重 -> 时效性过滤 -> 排序
    """
    print(f'   [多源采集] 开始采集 {len(DEFAULT_SOURCES)} 个数据源')
    all_hotspots = []
    all_source_status = {}

    for i in range(0, len(DEFAULT_SOURCES), BATCH_SIZE):
        batch = DEFAULT_SOURCES[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(DEFAULT_SOURCES) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f'   [多源采集] 第 {batch_num}/{total_batches} 批: {batch}')
        result = fetch_multiple_sources(batch)
        all_hotspots.extend(result['hotspots'])
        all_source_status.update(result['sourceStatus'])

    print(f'   [多源采集] 原始获取 {len(all_hotspots)} 个热点')

    # 按时效性+热度综合排序
    all_hotspots.sort(key=lambda h: (
        -h.get('freshnessScore', 100),
        -h.get('heat', 0),
    ))
    # 微调：时效性接近时按热度
    # (已在 key 中处理)

    # 去重：按标题
    seen_titles = set()
    unique = []
    for h in all_hotspots:
        t = h.get('title') or h.get('name', '')
        if t not in seen_titles:
            seen_titles.add(t)
            unique.append(h)
    print(f'   [多源采集] 去重后 {len(unique)} 个热点')

    # 过滤过时数据（超过72小时）
    MAX_HOURS = 72
    filtered = [h for h in unique if not h.get('hoursOld') or h['hoursOld'] < MAX_HOURS]
    if len(filtered) < limit // 2:
        print('   [多源采集] 时效性过滤后不足，保留更多')
        filtered = unique
    filtered = filtered[:limit]

    # 统计
    source_stats = {}
    for h in filtered:
        src = h.get('source', 'unknown')
        source_stats[src] = source_stats.get(src, 0) + 1

    freshness_stats = {
        'fresh': sum(1 for h in filtered if h.get('freshnessScore', 100) >= 70),
        'normal': sum(1 for h in filtered if 40 <= h.get('freshnessScore', 100) < 70),
        'old': sum(1 for h in filtered if h.get('freshnessScore', 100) < 40),
    }
    print(f'   [多源采集] 时效性分布: {freshness_stats}')
    print(f'   [多源采集] 各源数量: {source_stats}')

    return {
        'success': True,
        'data': filtered,
        'count': len(filtered),
        'timestamp': datetime.now().isoformat(),
        'fromCache': False,
        'sourceStats': source_stats,
        'sourceFetchStatus': all_source_status,
        'freshnessStats': freshness_stats,
    }


def get_cached_hotspots():
    """获取热点数据（带缓存）"""
    now = time.time()
    if _hotspot_cache['data'] is not None and now - _hotspot_cache['timestamp'] < HOTSPOT_CACHE_TTL:
        print('   [热点代理] 使用缓存数据')
        return _hotspot_cache['data']
    data = fetch_all_hotspots_full()
    if data and data.get('data') is not None:
        _hotspot_cache['data'] = data
        _hotspot_cache['timestamp'] = now
        return data
    if _hotspot_cache['data'] is not None:
        print('   [热点代理] 远程失败，使用过期缓存')
        return _hotspot_cache['data']
    return None


@app.route('/api/hot/all', methods=['GET'])
def proxy_hot_all():
    """
    热点采集代理接口（完整增强版）
    - 多源并发采集（15个平台）
    - 智能分类 + 关键词提取
    - 时效性评分 + 去重 + 排序
    - 5分钟内存缓存
    """
    print('\n--- 收到热点采集请求 ---')
    enable_scoring = request.args.get('scoring', '0') == '1'
    limit = int(request.args.get('limit', '100'))

    data = get_cached_hotspots()
    if data is not None:
        result_data = data.get('data', [])
        if enable_scoring:
            result_data = [score_topic_10pt(h) for h in result_data]
            result_data.sort(key=lambda x: x.get('totalScore', 0), reverse=True)
        print(f'   [热点代理] 返回 {len(result_data)} 条数据')
        return jsonify({
            'success': True,
            'data': result_data,
            'count': len(result_data),
            'timestamp': data.get('timestamp'),
            'fromCache': data.get('fromCache', False),
            'sourceStats': data.get('sourceStats', {}),
            'sourceFetchStatus': data.get('sourceFetchStatus', {}),
            'freshnessStats': data.get('freshnessStats', {}),
        })

    print('   [热点代理] 远程 API 不可用')
    return jsonify({
        'code': 503,
        'success': False,
        'error': '热点数据源不可用，请稍后重试',
        'data': [],
    }), 503


@app.route('/api/hot/sources', methods=['GET'])
def api_hot_sources():
    """多源采集接口（指定数据源或分类）"""
    sources = request.args.get('sources', '')
    categories = request.args.get('categories', '')
    limit = int(request.args.get('limit', '100'))

    target_ids = []
    if sources:
        target_ids = [s.strip() for s in sources.split(',') if s.strip()]
    elif categories:
        for cat in categories.split(','):
            cat = cat.strip()
            if cat in SOURCE_CONFIG:
                target_ids.extend([s['id'] for s in SOURCE_CONFIG[cat]['sources']])
    else:
        target_ids = DEFAULT_SOURCES

    target_ids = list(dict.fromkeys(target_ids))  # 去重
    print(f'   [多源采集] 指定源: {target_ids}')

    all_hotspots = []
    all_status = {}
    for i in range(0, len(target_ids), BATCH_SIZE):
        batch = target_ids[i:i + BATCH_SIZE]
        result = fetch_multiple_sources(batch)
        all_hotspots.extend(result['hotspots'])
        all_status.update(result['sourceStatus'])

    # 去重+排序
    seen = set()
    unique = []
    for h in all_hotspots:
        t = h.get('title', '')
        if t not in seen:
            seen.add(t)
            unique.append(h)
    unique.sort(key=lambda h: (-h.get('freshnessScore', 100), -h.get('heat', 0)))
    unique = unique[:limit]

    return jsonify({
        'success': True,
        'data': unique,
        'count': len(unique),
        'timestamp': datetime.now().isoformat(),
        'sourceStats': {h.get('source', ''): sum(1 for x in unique if x.get('source') == h.get('source')) for h in unique},
        'sourceFetchStatus': all_status,
    })


@app.route('/api/hot/refresh', methods=['POST'])
def refresh_hotspot_cache():
    """手动刷新热点缓存"""
    global _hotspot_cache
    _hotspot_cache = {'data': None, 'timestamp': 0, 'enriched': None}
    data = fetch_all_hotspots_full()
    if data and data.get('data') is not None:
        _hotspot_cache['data'] = data
        _hotspot_cache['timestamp'] = time.time()
        return jsonify({'success': True, 'message': '缓存刷新成功', 'count': data.get('count', 0)})
    return jsonify({'success': False, 'error': '远程 API 不可用'}), 503


# ========== 10分制热点评分（移植自云函数 topic-scorer） ==========

# 高争议性关键词
_HIGH_CONTROVERSY_KW = [
    '争议', '炮轰', '抨击', '反击', '对峙', '翻车', '塌房', '封杀', '禁令', '下架',
    '起诉', '诉讼', '索赔', '天价', '暴雷', '造假', '抄袭', '盗版', '侵权', '违约',
]
_MEDIUM_CONTROVERSY_KW = [
    '批评', '质疑', '反驳', '反对', '冲突', '辩论', '问题', '负面', '不利', '对立',
    '回应', '澄清', '道歉', '争论', '分歧', '整改', '约谈', '处罚', '调查', '曝光',
]
_DISCUSSION_KW = [
    '你怎么看', '大家觉得', '是否应该', '该不该', '为什么', '怎么看', '如何评价', '如何看待',
]
_HIGH_VALUE_KW = [
    '教程', '指南', '方法', '技巧', '原理', '分析', '解读', '详解', '深入', '学习',
    '实践', '经验', '总结', '方案', '优化', '如何', '怎么', '最佳', '提升', '攻略',
    '揭秘', '盘点', '推荐', '必看', '干货', '白皮书', '报告', '研究', '数据', '统计',
]
_MEDIUM_VALUE_KW = [
    '分享', '介绍', '了解', '知道', '认识', '看法', '观点', '思考', '感悟', '体验',
    '测评', '对比', '评测', '使用', '效果',
]
_EASY_CREATE_KW = [
    '教程', '指南', '方法', '技巧', '步骤', '清单', '模板', '工具', '资源', '推荐',
    '盘点', '排行', '榜单', '合集', '总结',
]
_HARD_CREATE_KW = ['涉密', '机密', '内部', '未公开', '违法', '违规', '封禁', '屏蔽']


def score_timeliness(item):
    """时效性评分（2分制）"""
    now = datetime.now()
    for field in ['publishTime', 'publish_time', 'createdAt', 'created_at', 'timestamp', 'fetchTime', 'time']:
        val = item.get(field)
        if val:
            try:
                from dateutil import parser as dt_parser
                pt = dt_parser.parse(str(val)).replace(tzinfo=None)
                hours = (now - pt).total_seconds() / 3600
                if hours <= 1: return 2.0
                if hours <= 6: return 1.5
                if hours <= 12: return 1.2
                if hours <= 24: return 1.0
                if hours <= 48: return 0.5
                return 0
            except Exception:
                pass
    rank = item.get('rank', 999)
    if rank <= 10: return 1.8
    if rank <= 30: return 1.5
    if rank <= 50: return 1.0
    return 0.5


def score_heat(item):
    """热度评分（3分制）"""
    source = item.get('source', '')
    rank = item.get('rank', 999)
    heat = item.get('heat', 0)
    hot_val = item.get('hotValue') or item.get('hotness', 0)

    if '知乎' in source or 'zhihu' in source.lower():
        if rank <= 10: return 3.0
        if rank <= 30: return 2.0
        if rank <= 50: return 1.2
        if rank <= 100: return 0.8
        return 0.5
    elif '微博' in source or 'weibo' in source.lower():
        if rank <= 10: return 3.0
        if rank <= 20: return 2.5
        if rank <= 50: return 2.0
        if rank <= 80: return 1.2
        return 0.5
    elif '小红书' in source or 'xiaohongshu' in source.lower() or 'xhs' in source.lower():
        if rank <= 10: return 3.0
        if rank <= 25: return 2.2
        if rank <= 50: return 1.5
        return 0.8
    elif '抖音' in source or 'douyin' in source.lower() or 'B站' in source or 'bilibili' in source.lower():
        if rank <= 10: return 3.0
        if rank <= 30: return 2.3
        if rank <= 60: return 1.5
        return 0.8
    elif '百度' in source or 'baidu' in source.lower():
        if rank <= 10: return 2.8
        if rank <= 30: return 2.0
        if rank <= 50: return 1.2
        return 0.5
    else:
        heat_num = parse_heat_value(heat or hot_val)
        if heat_num >= 500000: return 3.0
        if heat_num >= 100000: return 2.5
        if heat_num >= 50000: return 2.0
        if heat_num >= 10000: return 1.2
        if heat_num >= 1000: return 0.8
        return 0.5


def parse_heat_value(heat):
    """解析热度值（支持数字和字符串格式）"""
    if isinstance(heat, (int, float)):
        return heat
    if isinstance(heat, str):
        import re as _re
        num_str = _re.sub(r'[^\d.]', '', heat)
        num = float(num_str) if num_str else 0
        if '万' in heat: return num * 10000
        if '亿' in heat: return num * 100000000
        return num
    return 0


def score_controversy(item):
    """争议性评分（2分制）"""
    title = (item.get('title') or '').lower()
    summary = (item.get('summary') or item.get('description') or item.get('content') or '').lower()
    text = f'{title} {summary}'
    score = 0
    for kw in _HIGH_CONTROVERSY_KW:
        if kw in text: score += 0.5
    for kw in _MEDIUM_CONTROVERSY_KW:
        if kw in text: score += 0.25
    for kw in _DISCUSSION_KW:
        if kw in text: score += 0.3
    if title.endswith('?') or title.endswith('？'):
        score += 0.3
    return min(score, 2.0)


def score_value(item):
    """内容价值评分（2分制）"""
    title = (item.get('title') or '').lower()
    summary = (item.get('summary') or item.get('description') or item.get('content') or '').lower()
    text = f'{title} {summary}'
    score = 0
    for kw in _HIGH_VALUE_KW:
        if kw in text: score += 0.2
    for kw in _MEDIUM_VALUE_KW:
        if kw in text: score += 0.1
    title_len = len(title)
    if 20 <= title_len <= 35:
        score += 0.3
    elif title_len > 15:
        score += 0.15
    if re.search(r'\d+', title):
        score += 0.2
    return min(score, 2.0)


def score_actionability(item):
    """可操作性评分（1分制）"""
    title = (item.get('title') or '').lower()
    summary = (item.get('summary') or item.get('description') or item.get('content') or '').lower()
    text = f'{title} {summary}'
    score = 0.5
    for kw in _EASY_CREATE_KW:
        if kw in text: score += 0.15
    if re.search(r'\d+\s*[条点个项]|\d+个', text):
        score += 0.2
    for kw in _HARD_CREATE_KW:
        if kw in text: score -= 0.3
    if len(title) > 40:
        score -= 0.1
    return max(0, min(score, 1.0))


def analyze_trend(item):
    """分析热度趋势"""
    trend = (item.get('trend') or '').lower()
    hot_change = item.get('hotValueChange') or item.get('heatChange') or 0
    rank = item.get('rank', 999)
    comments = item.get('comments') or item.get('commentCount') or 0

    if trend in ('up', 'rising', '上升'):
        return {'direction': 'rising', 'confidence': 0.85, 'reason': '平台标记为上升趋势'}
    if trend in ('down', 'falling', '下降'):
        return {'direction': 'falling', 'confidence': 0.85, 'reason': '平台标记为下降趋势'}
    if trend in ('stable', 'flat', '平稳'):
        return {'direction': 'stable', 'confidence': 0.8, 'reason': '平台标记为平稳'}

    if isinstance(hot_change, (int, float)):
        if hot_change > 20:
            return {'direction': 'rising', 'confidence': 0.75, 'reason': f'热度增长{hot_change}%'}
        if hot_change < -20:
            return {'direction': 'falling', 'confidence': 0.75, 'reason': f'热度下降{abs(hot_change)}%'}

    if rank <= 20 and comments > 1000:
        return {'direction': 'rising', 'confidence': 0.6, 'reason': '高排名高互动，可能仍在上升期'}
    if rank <= 50:
        return {'direction': 'stable', 'confidence': 0.55, 'reason': '中等排名，热度相对稳定'}
    if rank > 100:
        return {'direction': 'falling', 'confidence': 0.5, 'reason': '排名较低，可能在降温'}

    return {'direction': 'unknown', 'confidence': 0.3, 'reason': '无法确定趋势'}


def adjust_for_platform(scores, item, platform='general'):
    """根据目标平台调整评分"""
    title = (item.get('title') or '').lower()
    text = f'{title} {(item.get("summary") or item.get("description") or "").lower()}'
    bonus = 0
    if platform == 'douyin':
        if scores.get('争议性', 0) >= 1.5: bonus += 0.3
        if '搞笑' in text or '反转' in text or 'shock' in text: bonus += 0.2
    elif platform == 'xiaohongshu':
        if scores.get('价值', 0) >= 1.5: bonus += 0.3
        if '攻略' in text or '测评' in text or '好物' in text: bonus += 0.2
    elif platform == 'wechat':
        if scores.get('价值', 0) >= 1.5: bonus += 0.3
        if len(title) > 15: bonus += 0.1
    elif platform == 'bilibili':
        if scores.get('价值', 0) >= 1.2: bonus += 0.2
        if '科技' in text or '学习' in text or '教程' in text: bonus += 0.2
    return max(0, min(bonus, 0.5))


def get_recommend_level(score):
    """获取推荐等级"""
    if score >= 9: return 'excellent'
    if score >= 7.5: return 'high'
    if score >= 6: return 'medium'
    if score >= 4: return 'low'
    return 'poor'


def generate_recommendation_reason(scored_item):
    """生成推荐理由"""
    scores = scored_item.get('scores', {})
    total = scored_item.get('totalScore', 0)
    reasons = []
    suggestions = []

    if scores.get('时效性', 0) >= 1.8:
        reasons.append('刚出炉的新鲜热点，抢占第一时间')
    elif scores.get('时效性', 0) >= 1.2:
        reasons.append('较新的热点话题')
    elif scores.get('时效性', 0) < 0.5:
        suggestions.append('话题较旧，需找新角度切入')

    if scores.get('热度', 0) >= 2.5:
        reasons.append('爆款级热度，流量巨大')
    elif scores.get('热度', 0) >= 2.0:
        reasons.append('热门话题，关注度高')
    elif scores.get('热度', 0) >= 1.2:
        reasons.append('有一定热度基础')

    if scores.get('争议性', 0) >= 1.5:
        reasons.append('高争议性，容易引发讨论和传播')
        suggestions.append('可从多角度分析，引发用户讨论')
    elif scores.get('争议性', 0) >= 1.0:
        reasons.append('有一定讨论空间')

    if scores.get('价值', 0) >= 1.5:
        reasons.append('高价值内容，实用性强')
        suggestions.append('适合做深度内容或教程类视频')
    elif scores.get('价值', 0) >= 1.0:
        reasons.append('有一定内容价值')

    if scores.get('可操作性', 0) >= 0.8:
        reasons.append('易于创作，素材丰富')
    elif scores.get('可操作性', 0) < 0.4:
        suggestions.append('创作难度较高，需要充分准备')

    trend = scored_item.get('trendAnalysis', {})
    if trend and trend.get('direction') == 'rising':
        reasons.append('热度呈上升趋势，正当时')
    elif trend and trend.get('direction') == 'falling':
        suggestions.append('热度可能在下降，需要独特角度')

    rating = '一般'
    if total >= 9: rating = '强烈推荐'
    elif total >= 7.5: rating = '推荐'
    elif total >= 6: rating = '可以考虑'

    summary = reasons[0] if reasons else (suggestions[0] if suggestions else '可作为备选题材')
    if total >= 8 and len(reasons) > 1:
        summary = f'{reasons[0]}，{reasons[1]}'

    return {
        'overallRating': rating,
        'strengths': reasons,
        'suggestions': suggestions,
        'summary': summary,
    }


def score_topic_10pt(item, target_platform='general'):
    """
    对单个热点进行完整10分制评分
    评分维度：时效性(2) + 热度(3) + 争议性(2) + 价值(2) + 可操作性(1)
    移植自云函数 topic-scorer 的 TopicFilter.scoreItem
    """
    timeliness_s = score_timeliness(item)
    heat_s = score_heat(item)
    controversy_s = score_controversy(item)
    value_s = score_value(item)
    actionability_s = score_actionability(item)

    base_scores = {
        '时效性': round(timeliness_s, 1),
        '热度': round(heat_s, 1),
        '争议性': round(controversy_s, 1),
        '价值': round(value_s, 1),
        '可操作性': round(actionability_s, 1),
    }

    total = timeliness_s + heat_s + controversy_s + value_s + actionability_s
    platform_bonus = adjust_for_platform(base_scores, item, target_platform)
    total += platform_bonus

    trend_analysis = analyze_trend(item)
    trend_bonus = 0
    if trend_analysis['direction'] == 'rising':
        trend_bonus = 0.3 * trend_analysis['confidence']
    elif trend_analysis['direction'] == 'falling':
        trend_bonus = -0.2 * trend_analysis['confidence']
    total += trend_bonus

    scored = dict(item)
    scored['scores'] = base_scores
    scored['platformBonus'] = round(platform_bonus, 2)
    scored['trendBonus'] = round(trend_bonus, 2)
    scored['totalScore'] = round(total, 1)
    scored['trendAnalysis'] = trend_analysis
    scored['recommend'] = total >= 7
    scored['recommendLevel'] = get_recommend_level(total)
    scored['recommendation'] = generate_recommendation_reason(scored)
    return scored


@app.route('/api/hot/score', methods=['POST'])
def api_hot_score():
    """
    10分制热点评分接口
    移植自云函数 topic-scorer
    请求体: { items: [...], minScore: 7, sortBy: 'score', targetPlatform: 'general', maxResults: 0 }
    """
    data = request.json or {}
    items = data.get('items', [])
    min_score = data.get('minScore', 7)
    sort_by = data.get('sortBy', 'score')
    target_platform = data.get('targetPlatform', 'general')
    max_results = data.get('maxResults', 0)
    show_all = data.get('showAll', False)
    category_filter = data.get('categoryFilter', None)

    if not items:
        return jsonify({'success': False, 'error': '参数错误: items必须是非空数组'}), 400

    scored_items = [score_topic_10pt(item, target_platform) for item in items]

    if category_filter and category_filter != '全部':
        scored_items = [s for s in scored_items if category_filter in (s.get('category') or '')]

    sort_map = {
        'timeliness': lambda s: s.get('scores', {}).get('时效性', 0),
        'heat': lambda s: s.get('scores', {}).get('热度', 0),
        'controversy': lambda s: s.get('scores', {}).get('争议性', 0),
        'value': lambda s: s.get('scores', {}).get('价值', 0),
        'score': lambda s: s.get('totalScore', 0),
    }
    scored_items.sort(key=sort_map.get(sort_by, sort_map['score']), reverse=True)

    if max_results > 0:
        scored_items = scored_items[:max_results]

    recommended = [s for s in scored_items if s.get('totalScore', 0) >= min_score]
    total = len(scored_items)
    avg = round(sum(s.get('totalScore', 0) for s in scored_items) / total, 1) if total > 0 else 0

    statistics = {
        'total': total,
        'recommended': len(recommended),
        'rejected': total - len(recommended),
        'avgScore': avg,
        'maxScore': max((s.get('totalScore', 0) for s in scored_items), default=0),
        'minScore': min((s.get('totalScore', 0) for s in scored_items), default=0),
        'scoreDistribution': {
            'excellent': sum(1 for s in scored_items if s.get('totalScore', 0) >= 9),
            'high': sum(1 for s in scored_items if 7.5 <= s.get('totalScore', 0) < 9),
            'medium': sum(1 for s in scored_items if 6 <= s.get('totalScore', 0) < 7.5),
            'low': sum(1 for s in scored_items if 4 <= s.get('totalScore', 0) < 6),
            'poor': sum(1 for s in scored_items if s.get('totalScore', 0) < 4),
        },
        'trendDistribution': {
            'rising': sum(1 for s in scored_items if s.get('trendAnalysis', {}).get('direction') == 'rising'),
            'stable': sum(1 for s in scored_items if s.get('trendAnalysis', {}).get('direction') == 'stable'),
            'falling': sum(1 for s in scored_items if s.get('trendAnalysis', {}).get('direction') == 'falling'),
            'unknown': sum(1 for s in scored_items if s.get('trendAnalysis', {}).get('direction') == 'unknown'),
        },
    }

    return jsonify({
        'success': True,
        'version': '2.0',
        'filterTime': datetime.now().isoformat(),
        'minScore': min_score,
        'sortBy': sort_by,
        'targetPlatform': target_platform,
        'statistics': statistics,
        'recommended': recommended,
        'allItems': scored_items if show_all else [],
        'scoringGuide': {
            'dimensions': ['时效性(2分)', '热度(3分)', '争议性(2分)', '价值(2分)', '可操作性(1分)'],
            'maxScore': 10,
            'recommendThreshold': min_score,
            'levels': {
                'excellent': '>=9分 强烈推荐',
                'high': '>=7.5分 推荐',
                'medium': '>=6分 可以考虑',
                'low': '>=4分 一般',
                'poor': '<4分 不推荐',
            },
        },
    })


# ========== 热点深度分析（移植自云函数 hotspot-analyzer） ==========

@app.route('/api/hot/analyze', methods=['POST'])
def api_hot_analyze():
    """
    热点深度分析接口
    移植自云函数 hotspot-analyzer 的现象层分析
    请求体: { hotspots: [...], category: '全部' }
    """
    data = request.json or {}
    hotspots = data.get('hotspots', [])
    category = data.get('category', '全部')

    if not hotspots:
        return jsonify({'success': False, 'error': '没有热点数据'}), 400

    filtered = hotspots
    if category != '全部':
        filtered = [h for h in hotspots if h.get('category') == category]

    if not filtered:
        return jsonify({'success': False, 'error': '没有符合条件的热点数据'}), 400

    # 现象层分析
    total_count = len(filtered)
    avg_heat = round(sum(h.get('heat', 0) for h in filtered) / total_count) if total_count > 0 else 0

    # 分类统计
    cat_count = {}
    for h in filtered:
        c = h.get('category', '其他')
        cat_count[c] = cat_count.get(c, 0) + 1
    top_categories = sorted(cat_count.items(), key=lambda x: x[1], reverse=True)[:5]

    # 来源统计
    src_count = {}
    for h in filtered:
        s = h.get('source', '未知')
        src_count[s] = src_count.get(s, 0) + 1
    top_sources = sorted(src_count.items(), key=lambda x: x[1], reverse=True)[:5]

    # 趋势分布
    trend_dist = {'up': 0, 'down': 0, 'stable': 0}
    for h in filtered:
        t = h.get('trend', 'stable')
        if t in trend_dist:
            trend_dist[t] += 1
        else:
            trend_dist['stable'] += 1

    # 关键词提取
    keyword_count = {}
    for h in filtered:
        title = h.get('title', '')
        desc = h.get('description', '')
        for kw in (h.get('keywords') or []):
            keyword_count[kw] = keyword_count.get(kw, 0) + 1
        # 从标题分词
        import re as _re
        words = _re.sub(r'[，。！？、；：""\'\'（）《》【】]', ' ', f'{title} {desc}').split()
        stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
        for w in words:
            if len(w) >= 2 and w not in stop_words:
                keyword_count[w] = keyword_count.get(w, 0) + 1

    top_keywords = sorted(keyword_count.items(), key=lambda x: x[1], reverse=True)[:20]

    report = {
        'category': category,
        'summary': {
            'totalHotspots': total_count,
            'avgHeat': avg_heat,
            'topKeywords': [kw for kw, _ in top_keywords[:10]],
            'topCategories': [{'category': c, 'count': n} for c, n in top_categories],
            'topSources': [{'source': s, 'count': n} for s, n in top_sources],
        },
        'phenomenon': {
            'stats': {
                'totalCount': total_count,
                'avgHeat': avg_heat,
                'topCategories': [{'category': c, 'count': n} for c, n in top_categories],
                'topSources': [{'source': s, 'count': n} for s, n in top_sources],
                'trendDistribution': trend_dist,
            },
            'keywords': [{'keyword': kw, 'count': n} for kw, n in top_keywords],
            'trends': {
                'risingCount': trend_dist.get('up', 0),
                'fallingCount': trend_dist.get('down', 0),
                'stableCount': trend_dist.get('stable', 0),
            },
        },
        'recommendations': {
            'forCreators': [
                f'关注热门关键词: {", ".join(kw for kw, _ in top_keywords[:5])}',
                '选择上升趋势的热点进行创作',
                '结合用户痛点提供有价值的内容',
                '提前布局中长期趋势话题',
            ],
            'forOperators': [
                '优化热点推荐算法，提高匹配度',
                '增加热点分析功能，帮助用户决策',
                '建立用户画像，实现个性化推荐',
                '提供创作工具，降低创作门槛',
            ],
        },
        'generatedAt': datetime.now().isoformat(),
    }

    return jsonify({'success': True, 'report': report, 'timestamp': datetime.now().isoformat()})


# ========== 热点采集辅助函数（保留给 auto-publish 流程使用） ==========

def get_best_hot_topic():
    """获取最佳爆款话题（用于 auto-publish 流程）"""
    data = fetch_all_hotspots_full(limit=50)
    if not data or not data.get('data'):
        return None
    scored = [score_topic_10pt(h) for h in data['data']]
    scored.sort(key=lambda x: x.get('totalScore', 0), reverse=True)
    return scored[0] if scored else None


# ========== 文章生成功能 ==========

def generate_article_html(hot_topic):
    """
    基于热点话题生成图文并茂的公众号爆款文章（HTML格式）
    包含：
    - 封面图（使用混元/智谱AI生成）
    - 4-5个搜索图片（使用混元/智谱AI生成）
    - 热点标签
    - 关键字段高亮
    - 内联CSS样式
    """
    title = hot_topic.get('title', '热点话题')
    category = hot_topic.get('category', '热点')
    heat = hot_topic.get('heat', 0)

    print(f"\n   生成文章图片...")

    # 生成封面图
    print("   1. 生成封面图...")
    cover_image = generate_cover_image(title, category)
    print(f"   ✓ 封面图: {cover_image[:60]}...")

    # 生成内容图片（4-5张）
    print("   2. 生成内容图片...")
    content_images = generate_content_images(title, count=5)
    print(f"   ✓ 生成了 {len(content_images)} 张内容图片")

    # 生成文章HTML（内联CSS样式）
    html_content = f'''
<section style="max-width: 677px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height: 1.8; color: #333;">

<!-- 封面图 -->
<div style="width: 100%; margin-bottom: 24px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
    <img src="{cover_image}" style="width: 100%; height: auto; display: block;" alt="封面图">
</div>

<!-- 标题区域 -->
<h1 style="font-size: 32px; font-weight: 700; color: #1a202c; margin: 32px 0 24px; line-height: 1.4; text-align: center;">
    {title}
</h1>

<!-- 热点标签 -->
<div style="display: flex; justify-content: center; gap: 12px; margin: 20px 0 32px; flex-wrap: wrap;">
    <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">{category}</span>
    <span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">热搜话题</span>
    <span style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">今日热点</span>
</div>

<!-- 导语 -->
<p style="font-size: 18px; color: #4a5568; margin-bottom: 32px; padding: 20px; background: #f7fafc; border-left: 4px solid #4a6cf7; border-radius: 0 8px 8px 0;">
    📢 <strong style="color: #4a6cf7;">重磅推荐</strong>：本文为您深度解析<strong style="color: #e53e3e; font-weight: 700;">{title}</strong>的最新动态，带您了解行业前沿趋势，把握市场机遇！
</p>

<!-- 正文第一段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #4a6cf7;">
    🌟 背景介绍
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
    近期，<strong style="color: #4a6cf7; font-weight: 600;">{title}</strong>成为全网热议焦点，搜索热度达到<strong style="color: #e53e3e; font-weight: 700;">{heat:,}</strong>次。这一现象不仅反映了当前<strong style="color: #5b7be8; font-weight: 600;">{category}</strong>领域的发展趋势，更预示着未来的市场走向。
</p>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
    作为<strong style="color: #4a6cf7; font-weight: 600;">今日最热话题</strong>，它引发了各界的广泛关注和深入讨论。从普通用户到行业专家，都在探讨其背后的深层次原因和潜在影响。
</p>

<!-- 图片1 -->
<div style="width: 100%; margin: 32px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <img src="{content_images[0]}" style="width: 100%; height: auto; display: block;" alt="配图1">
</div>

<!-- 正文第二段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #f5576c;">
    💡 核心要点
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
    通过深入分析，我们发现了以下<strong style="color: #f5576c; font-weight: 600;">核心亮点</strong>：
</p>

<ul style="list-style: none; padding: 0; margin: 24px 0;">
    <li style="background: #fff5f5; padding: 16px 20px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #f5576c; font-size: 16px;">
        ✅ <strong style="color: #f5576c;">趋势明显</strong>：数据持续攀升，市场反应热烈
    </li>
    <li style="background: #fef3f7; padding: 16px 20px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #ed64a6; font-size: 16px;">
        ✅ <strong style="color: #ed64a6;">影响深远</strong>：涉及多个行业，波及范围广
    </li>
    <li style="background: #faf5ff; padding: 16px 20px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid #b83280; font-size: 16px;">
        ✅ <strong style="color: #b83280;">机会巨大</strong>：市场空间广阔，发展潜力大
    </li>
</ul>

<!-- 图片2 -->
<div style="width: 100%; margin: 32px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <img src="{content_images[1]}" style="width: 100%; height: auto; display: block;" alt="配图2">
</div>

<!-- 正文第三段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #4facfe;">
    🎯 深度分析
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
    从<strong style="color: #4facfe; font-weight: 600;">数据分析</strong>角度来看，这一热点的出现并非偶然。它背后有着复杂的<strong style="color: #4a6cf7; font-weight: 600;">市场逻辑</strong>和<strong style="color: #f5576c; font-weight: 600;">社会因素</strong>。
</p>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
    专家指出，这种现象与当前<strong style="color: #5b7be8; font-weight: 600;">{category}</strong>行业的快速发展密切相关。随着<strong style="color: #4a6cf7; font-weight: 600;">技术进步</strong>和<strong style="color: #f5576c; font-weight: 600;">消费升级</strong>，市场需求发生了显著变化。
</p>

<!-- 图片3 -->
<div style="width: 100%; margin: 32px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <img src="{content_images[2]}" style="width: 100%; height: auto; display: block;" alt="配图3">
</div>

<!-- 正文第四段 -->
<h2 style="font-size: 24px; font-weight: 700; color: #2d3748; margin: 36px 0 20px; padding-bottom: 12px; border-bottom: 3px solid #00f2fe;">
    🚀 未来展望
</h2>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
    展望未来，<strong style="color: #00f2fe; font-weight: 600;">{title}</strong>这一话题还将持续发酵。预计在<strong style="color: #4facfe; font-weight: 600;">未来6个月</strong>内，相关领域将迎来新的发展机遇。
</p>

<p style="font-size: 16px; line-height: 2; margin-bottom: 20px; text-align: justify;">
    行业专家预测，<strong style="color: #4a6cf7; font-weight: 600;">市场规模</strong>将继续扩大，<strong style="color: #f5576c; font-weight: 600;">技术创新</strong>将不断涌现，<strong style="color: #00f2fe; font-weight: 600;">用户体验</strong>将得到显著提升。
</p>

<!-- 图片4 -->
<div style="width: 100%; margin: 32px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <img src="{content_images[3]}" style="width: 100%; height: auto; display: block;" alt="配图4">
</div>

<!-- 图片5 -->
<div style="width: 100%; margin: 32px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <img src="{content_images[4]}" style="width: 100%; height: auto; display: block;" alt="配图5">
</div>

<!-- 总结部分 -->
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; border-radius: 16px; margin: 40px 0; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);">
    <h3 style="font-size: 22px; font-weight: 700; margin: 0 0 16px; text-align: center;">
        📝 总结
    </h3>
    <p style="font-size: 16px; line-height: 2; margin: 0; text-align: justify;">
        综上所述，<strong style="font-weight: 700;">{title}</strong>作为当前<strong style="font-weight: 700;">最热话题</strong>，其影响深远、意义重大。无论是行业从业者还是普通用户，都应该关注这一趋势，把握发展机遇。
    </p>
</div>

<!-- 结尾引导 -->
<p style="font-size: 16px; color: #718096; text-align: center; margin: 32px 0; font-style: italic;">
    ——— END ———<br>
    感谢您的阅读！如果您喜欢本文，请<strong style="color: #4a6cf7; font-weight: 600;">点赞</strong>和<strong style="color: #f5576c; font-weight: 600;">分享</strong>给更多人！
</p>

</section>
'''

    return {
        'title': title,
        'content': html_content,
        'cover_url': cover_image
    }

# ========== 推送功能 ==========

def push_to_publish_server(article_data):
    """
    推送文章到发布服务器
    直接调用本地 publish_draft 逻辑（8002端口同进程），无需走 HTTP
    超时120秒
    """
    try:
        # 直接调用本地函数，不走 HTTP
        result = publish_draft_internal(article_data)
        return result
    except Exception as e:
        # 降级：通过 HTTP 请求 8002 端口
        try:
            url = "http://127.0.0.1:8002/publish-draft"
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, json=article_data, timeout=120)
            response.raise_for_status()
            return {
                'success': True,
                'status_code': response.status_code,
                'response': response.json()
            }
        except Exception as e2:
            return {
                'success': False,
                'error': f'本地调用失败: {e}, HTTP降级也失败: {e2}'
            }

# ========== 完整流程接口 ==========

@app.route('/auto-publish', methods=['POST'])
def auto_publish():
    """完整流程：采集热点 -> 评分 -> 生成文章 -> 推送"""
    try:
        print("\n========== 自动发布流程开始 ==========")

        # 步骤1：采集热点
        print("1. 正在采集今日热点...")
        hot_topic = get_best_hot_topic()
        if not hot_topic:
            return jsonify({'success': False, 'error': '未能获取热点话题'}), 400

        print(f"   ✓ 获取到热点: {hot_topic['title']}")
        print(f"   ✓ 热度: {hot_topic['heat']:,}")
        print(f"   ✓ 评分: {hot_topic['score']}/10")

        # 步骤2：生成文章
        print("2. 正在生成爆款文章...")
        article = generate_article_html(hot_topic)
        print(f"   ✓ 文章标题: {article['title']}")
        print(f"   ✓ HTML长度: {len(article['content'])} 字符")

        # 步骤3：推送到服务器
        print("3. 正在推送到发布服务器...")
        push_result = push_to_publish_server(article)

        if push_result['success']:
            print(f"   ✓ 推送成功: HTTP {push_result['status_code']}")
            result = {
                'success': True,
                'hot_topic': hot_topic,
                'article': {
                    'title': article['title'],
                    'content_length': len(article['content']),
                    'cover_url': article['cover_url']
                },
                'push_result': push_result
            }
        else:
            print(f"   ✗ 推送失败: {push_result['error']}")
            result = {
                'success': False,
                'error': push_result['error'],
                'article': article
            }

        print("========== 流程完成 ==========\n")
        return jsonify(result)

    except Exception as e:
        print(f"   ✗ 异常: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def download_image(url):
    """下载图片到临时文件"""
    try:
        resp = requests.get(url, timeout=30)
        if resp.status_code == 200:
            url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
            ext = url.split('.')[-1].split('?')[0]
            if ext not in ['jpg', 'jpeg', 'png', 'gif']:
                ext = 'jpg'
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f'.{ext}')
            temp_file.write(resp.content)
            temp_file.close()
            return temp_file.name
        return None
    except Exception as e:
        print(f"下载图片失败: {url[:60]}, 错误: {e}")
        return None

def extract_image_urls_from_markdown(md_content):
    """从markdown中提取所有图片URL"""
    # 匹配 ![alt](url) 格式
    pattern = r'!\[([^\]]*)\]\(([^\)]+)\)'
    matches = re.findall(pattern, md_content)
    # 返回 [(alt_text, url), ...]
    return matches

def upload_image_to_wechat(image_url):
    """下载图片并上传到微信，返回微信图片URL"""
    try:
        # 1. 下载图片
        local_path = download_image(image_url)
        if not local_path:
            return None

        # 2. 上传到微信作为永久素材
        result = wechat.upload_media(local_path, 'image')

        # 3. 删除临时文件
        try:
            os.remove(local_path)
        except:
            pass

        # 4. 返回微信图片URL
        if result.get('success'):
            # 微信返回的url字段
            return result.get('url', '')
        return None

    except Exception as e:
        print(f"    上传图片失败: {str(e)[:50]}")
        return None

def process_markdown_images(md_content):
    """处理markdown中的图片：下载并上传到微信，替换URL"""
    if not md_content or '![' not in md_content:
        return md_content

    # 提取所有图片
    image_matches = extract_image_urls_from_markdown(md_content)

    if not image_matches:
        return md_content

    print(f"  发现 {len(image_matches)} 张图片，正在上传到微信...")

    processed_content = md_content
    success_count = 0

    for alt_text, original_url in image_matches:
        # 上传到微信
        wechat_url = upload_image_to_wechat(original_url)

        if wechat_url:
            # 替换URL
            old_markdown = f'![{alt_text}]({original_url})'
            new_markdown = f'![{alt_text}]({wechat_url})'
            processed_content = processed_content.replace(old_markdown, new_markdown)
            success_count += 1
            print(f"    [OK] 图片 {success_count}/{len(image_matches)}")
        else:
            print(f"    [FAIL] 图片上传失败，保留原URL")

    print(f"  图片处理完成: {success_count}/{len(image_matches)} 成功")
    return processed_content

def convert_markdown_to_wechat_html(md_content):
    """将Markdown转换为微信公众号格式的HTML"""
    if not md_content:
        return md_content

    # 配置markdown转换器，启用常用扩展
    html = markdown.markdown(
        md_content,
        extensions=[
            'extra',           # 支持表格、代码块等
            'codehilite',      # 代码高亮
            'fenced_code',     # 围栏代码块
            'tables',          # 表格支持
        ]
    )

    # 为微信公众号添加样式
    html = f'''
<section style="margin: 0; padding: 16px; font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; line-height: 1.75; color: #333;">
{html}
</section>
'''

    # 优化图片样式
    html = re.sub(
        r'<img\s+([^>]*?)>',
        r'<img \1 style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 4px;">',
        html
    )

    # 优化段落样式
    html = re.sub(
        r'<p>',
        r'<p style="margin: 16px 0; text-align: justify; font-size: 15px; line-height: 1.8;">',
        html
    )

    # 优化标题样式 - 更醒目的样式
    html = re.sub(
        r'<h2>([^<]+)</h2>',
        r'<h2 style="font-size: 22px; font-weight: bold; margin: 28px 0 18px; padding: 14px 20px; background-color: #4a6cf7; color: #ffffff; text-align: center; letter-spacing: 1px;">\1</h2>',
        html
    )
    html = re.sub(
        r'<h3>([^<]+)</h3>',
        r'<h3 style="font-size: 19px; font-weight: bold; margin: 24px 0 14px; padding: 10px 0 10px 16px; color: #2d3748; border-left: 5px solid #4a6cf7; background-color: #f7fafc;">\1</h3>',
        html
    )

    # 优化代码块样式
    html = re.sub(
        r'<code>',
        r'<code style="padding: 2px 6px; background: #f5f5f5; border-radius: 3px; font-family: Consolas, Monaco, monospace; font-size: 14px;">',
        html
    )
    html = re.sub(
        r'<pre>',
        r'<pre style="background: #f8f8f8; padding: 16px; border-radius: 4px; overflow-x: auto; margin: 16px 0;">',
        html
    )

    # 优化引用样式
    html = re.sub(
        r'<blockquote>',
        r'<blockquote style="border-left: 4px solid #5b7be8; padding-left: 16px; margin: 16px 0; color: #666; background-color: #f7f9fa; padding: 12px 16px;">',
        html
    )

    # 优化列表样式
    html = re.sub(
        r'<ul>',
        r'<ul style="margin: 16px 0; padding-left: 24px;">',
        html
    )
    html = re.sub(
        r'<li>',
        r'<li style="margin: 8px 0; line-height: 1.8;">',
        html
    )

    # 优化强调文字（加粗）
    html = re.sub(
        r'<strong>',
        r'<strong style="color: #5b7be8; font-weight: bold;">',
        html
    )

    return html

def parse_coze_sse_output(data):
    """解析COZE的SSE流式输出"""
    # 如果data是字符串（SSE格式）
    if isinstance(data, str) and 'event' in data:
        # 查找Message事件 - 支持多种格式
        # 格式1: event: Message\ndata: {...}
        # 格式2: event:Message\ndata:{...}
        patterns = [
            r'event:\s*Message\s*\ndata:\s*(\{[^\n]+\})',
            r'event: Message\ndata: (\{.*?\})\n',
        ]

        for pattern in patterns:
            match = re.search(pattern, data, re.DOTALL)
            if match:
                try:
                    message_data = json.loads(match.group(1))
                    # content是双重JSON编码
                    content_str = message_data.get('content', '{}')
                    content_data = json.loads(content_str)
                    return {
                        'title': content_data.get('title', ''),
                        'content': content_data.get('output', ''),
                        'cover_url': content_data.get('cover', '')
                    }
                except json.JSONDecodeError:
                    continue
    return None

def publish_draft_internal(data):
    """
    发布草稿核心逻辑（可被 auto-publish 直接调用，无需 HTTP）
    接收已解析的 dict 数据，返回 dict 结果
    """
    print("\n========== 发布草稿 ==========", flush=True)
    try:
        # 第一步：处理数组
        if isinstance(data, list):
            print(f"1. 是数组，长度: {len(data)}", flush=True)
            if len(data) > 0:
                data = data[0]
            else:
                data = {}
        else:
            print(f"1. data类型: {type(data)}", flush=True)

        # 第二步：确保是字典
        if not isinstance(data, dict):
            print(f"2. 不是字典，转换中...", flush=True)
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except:
                    data = {'content': data}
            else:
                data = {}

        print(f"3. 最终data键: {list(data.keys()) if isinstance(data, dict) else 'N/A'}", flush=True)

        # 第三步：获取SSE文本
        sse_text = ''
        if isinstance(data, dict):
            sse_text = data.get('data', '') or data.get('body', '')
        print(f"4. SSE文本长度: {len(sse_text)}", flush=True)

        # 第四步：解析COZE输出
        coze_parsed = parse_coze_sse_output(sse_text)
        if coze_parsed:
            title = coze_parsed['title']
            content = coze_parsed['content']
            cover_url = coze_parsed['cover_url']
            thumb_media_id = ''
            print(f"5. COZE解析成功: {title[:20] if title else 'N/A'}...", flush=True)
        else:
            # 标准格式
            title = data.get('title', '') if isinstance(data, dict) else ''
            content = (data.get('content', '') or data.get('output', '')) if isinstance(data, dict) else ''
            cover_url = (data.get('cover_url', '') or data.get('cover', '')) if isinstance(data, dict) else ''
            thumb_media_id = data.get('thumb_media_id', '') if isinstance(data, dict) else ''
            print(f"5. 使用标准格式: {title[:20] if title else 'N/A'}...", flush=True)

        print(f"\n收到发布请求: {title}")
        print(f"  内容长度: {len(content)} 字符")

        # 判断内容格式
        is_markdown = content and ('![' in content or (content.count('#') > 2 and '<' not in content[:100]))
        is_html = content and ('<p>' in content or '<div>' in content or '<section>' in content)

        if is_markdown:
            print(f"  检测到Markdown格式")
            if '![' in content:
                content = process_markdown_images(content)
            print(f"  正在转换为微信HTML...")
            content = convert_markdown_to_wechat_html(content)
            print(f"  转换后长度: {len(content)} 字符")
        elif is_html:
            print(f"  检测到HTML格式，直接使用COZE样式")
        else:
            print(f"  纯文本内容")

        # 处理封面图：优先使用cover_url
        if cover_url and not thumb_media_id:
            print(f"  下载封面图: {cover_url[:60]}...")
            cover_path = download_image(cover_url)
            if cover_path:
                cover_result = wechat.upload_media(cover_path, 'thumb')
                if cover_result.get('success'):
                    thumb_media_id = cover_result['media_id']
                    print(f"  封面图上传成功")
                try:
                    os.remove(cover_path)
                except:
                    pass

        # 如果没有提供封面，使用默认cover.jpg
        if not thumb_media_id and os.path.exists('cover.jpg'):
            print(f"  使用默认封面图")
            cover_result = wechat.upload_media('cover.jpg', 'thumb')
            if cover_result.get('success'):
                thumb_media_id = cover_result['media_id']

        # 最终降级：生成一张简单封面图并上传
        if not thumb_media_id:
            print(f"  无可用封面图，生成默认封面...")
            try:
                from PIL import Image, ImageDraw, ImageFont
                import random
                # 生成 900x383 的纯色封面图
                colors = [(74, 108, 247), (245, 87, 108), (52, 199, 89), (255, 159, 10), (0, 0, 0)]
                color = random.choice(colors)
                img = Image.new('RGB', (900, 383), color)
                draw = ImageDraw.Draw(img)
                # 写标题文字
                title_display = title[:20] + '...' if len(title) > 20 else title
                try:
                    font = ImageFont.truetype('/usr/share/fonts/liberation/Liberation-Sans-Regular.ttf', 36)
                except:
                    font = ImageFont.load_default()
                # 居中文字
                bbox = draw.textbbox((0, 0), title_display, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                x = (900 - text_w) // 2
                y = (383 - text_h) // 2
                draw.text((x, y), title_display, fill='white', font=font)
                cover_path = '/tmp/default_cover.jpg'
                img.save(cover_path, 'JPEG', quality=85)
                print(f"  默认封面图已生成: {cover_path}")
                cover_result = wechat.upload_media(cover_path, 'thumb')
                if cover_result.get('success'):
                    thumb_media_id = cover_result['media_id']
                    print(f"  默认封面上传成功")
                else:
                    print(f"  默认封面上传失败: {cover_result.get('error')}")
            except Exception as e:
                print(f"  生成默认封面失败: {e}")

        articles = [{
            'title': title,
            'content': content,
            'digest': title[:50] if title else '',
            'thumb_media_id': thumb_media_id,
            'show_cover_pic': 1 if thumb_media_id else 0,
            'need_open_comment': 0,
            'only_fans_can_comment': 0
        }]

        print(f"  发布到微信...")
        result = wechat.create_draft(articles)

        if result.get('success'):
            print(f"  成功: {result.get('media_id', '')[:30]}...\n")
            return {
                'success': True,
                'media_id': result.get('media_id'),
                'message': 'Draft published successfully'
            }
        else:
            print(f"  失败: {result.get('error')}\n")
            return {
                'success': False,
                'error': result.get('error')
            }

    except Exception as e:
        print(f"  异常: {e}\n")
        return {'success': False, 'error': str(e)}


@app.route('/publish-draft', methods=['POST'])
def publish_draft():
    """发布草稿路由（HTTP接口）"""
    try:
        raw_data = request.json
        result = publish_draft_internal(raw_data)
        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== 用户数据 API（基于 SQLite，替代本地 Storage） ==========

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'miniprogram.db')

def get_db():
    """获取数据库连接，自动建表"""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute('''
        CREATE TABLE IF NOT EXISTS users (
            openid TEXT PRIMARY KEY,
            credits INTEGER DEFAULT 100,
            coins INTEGER DEFAULT 50,
            daily_quota INTEGER DEFAULT 3,
            daily_used INTEGER DEFAULT 0,
            total_creations INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            member_type TEXT DEFAULT 'free',
            last_reset_date TEXT,
            create_time TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS creation_history (
            id TEXT PRIMARY KEY,
            openid TEXT,
            title TEXT,
            content TEXT,
            type TEXT,
            cover_url TEXT,
            create_time TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            openid TEXT,
            name TEXT,
            data TEXT,
            create_time TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            openid TEXT,
            name TEXT,
            data TEXT,
            create_time TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            openid TEXT,
            name TEXT,
            data TEXT,
            create_time TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS api_configs (
            openid TEXT PRIMARY KEY,
            data TEXT
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS wechat_accounts (
            id TEXT PRIMARY KEY,
            openid TEXT,
            app_id TEXT,
            name TEXT,
            app_secret TEXT,
            avatar TEXT,
            is_selected INTEGER DEFAULT 0,
            create_time TEXT,
            update_time TEXT
        )
    ''')
    db.commit()
    return db

def get_today():
    return datetime.now().strftime('%Y-%m-%d')

def reset_daily_if_needed(user):
    """检查并重置每日额度"""
    today = get_today()
    if user['last_reset_date'] != today:
        db = get_db()
        db.execute(
            'UPDATE users SET daily_quota=3, daily_used=0, last_reset_date=? WHERE openid=?',
            (today, user['openid'])
        )
        db.commit()
        db.close()
        user = dict(user)
        user['daily_quota'] = 3
        user['daily_used'] = 0
        user['last_reset_date'] = today
    return dict(user)

@app.route('/api/user/credits', methods=['GET', 'POST'])
def api_user_credits():
    """用户积分管理"""
    openid = request.args.get('openid') or request.json.get('openid')
    if not openid:
        return jsonify({'success': False, 'error': '缺少 openid'}), 400
    
    action = request.args.get('action', 'get') if request.method == 'GET' else request.json.get('action', 'get')
    db = get_db()
    
    user = db.execute('SELECT * FROM users WHERE openid=?', (openid,)).fetchone()
    if not user:
        today = get_today()
        db.execute(
            'INSERT INTO users (openid, last_reset_date, create_time) VALUES (?, ?, ?)',
            (openid, today, datetime.now().isoformat())
        )
        db.commit()
        user = db.execute('SELECT * FROM users WHERE openid=?', (openid,)).fetchone()
    
    user = reset_daily_if_needed(user)
    
    if action == 'get' or action == 'init':
        db.close()
        return jsonify({'success': True, 'data': user})
    
    if action == 'consume':
        if user['daily_quota'] > 0:
            db.execute(
                'UPDATE users SET daily_quota=daily_quota-1, daily_used=daily_used+1, total_creations=total_creations+1 WHERE openid=?',
                (openid,)
            )
            db.commit()
            user = db.execute('SELECT * FROM users WHERE openid=?', (openid,)).fetchone()
            db.close()
            return jsonify({'success': True, 'data': dict(user)})
        db.close()
        return jsonify({'success': False, 'error': '额度不足'}), 400
    
    db.close()
    return jsonify({'success': True, 'data': user})

@app.route('/api/user/member', methods=['GET', 'POST'])
def api_user_member():
    """会员状态管理"""
    openid = request.args.get('openid') or request.json.get('openid')
    if not openid:
        return jsonify({'success': False, 'error': '缺少 openid'}), 400
    
    action = request.args.get('action', 'getStatus') if request.method == 'GET' else request.json.get('action', 'getStatus')
    db = get_db()
    
    user = db.execute('SELECT * FROM users WHERE openid=?', (openid,)).fetchone()
    if not user:
        today = get_today()
        db.execute(
            'INSERT INTO users (openid, last_reset_date, create_time) VALUES (?, ?, ?)',
            (openid, today, datetime.now().isoformat())
        )
        db.commit()
        user = db.execute('SELECT * FROM users WHERE openid=?', (openid,)).fetchone()
    
    user = reset_daily_if_needed(user)
    remaining = user['daily_quota'] - user['daily_used']
    
    if action == 'getStatus':
        db.close()
        return jsonify({'success': True, 'data': {
            'isMember': user['member_type'] != 'free',
            'memberType': user['member_type'],
            'dailyUsed': user['daily_used'],
            'dailyQuota': user['daily_quota'],
            'remainingToday': remaining,
            'credits': user['credits'],
            'benefits': {'name': '免费用户' if user['member_type'] == 'free' else '会员', 'dailyQuota': user['daily_quota']},
        }})
    
    if action == 'checkQuota':
        db.close()
        return jsonify({'success': True, 'canUse': remaining > 0, 'remaining': remaining})
    
    if action == 'consume':
        if remaining > 0:
            db.execute('UPDATE users SET daily_used=daily_used+1 WHERE openid=?', (openid,))
            db.commit()
            db.close()
            return jsonify({'success': True})
        db.close()
        return jsonify({'success': False, 'message': '额度不足'}), 400
    
    db.close()
    return jsonify({'success': True, 'data': dict(user)})

@app.route('/api/history', methods=['GET', 'POST'])
def api_creation_history():
    """创作历史管理"""
    if request.method == 'POST':
        data = request.json
        openid = data.get('openid')
        if not openid:
            return jsonify({'success': False, 'error': '缺少 openid'}), 400
        
        hid = 'hist_' + str(uuid.uuid4())[:12]
        db = get_db()
        db.execute(
            'INSERT INTO creation_history (id, openid, title, content, type, cover_url, create_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (hid, openid, data.get('title', ''), data.get('content', ''), data.get('type', ''), data.get('cover_url', ''), datetime.now().isoformat())
        )
        db.commit()
        db.close()
        return jsonify({'success': True, 'data': {'_id': hid}})
    
    openid = request.args.get('openid')
    if not openid:
        return jsonify({'success': False, 'error': '缺少 openid'}), 400
    
    db = get_db()
    rows = db.execute(
        'SELECT * FROM creation_history WHERE openid=? ORDER BY create_time DESC LIMIT 200',
        (openid,)
    ).fetchall()
    db.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@app.route('/api/projects', methods=['GET', 'POST'])
def api_projects():
    """项目管理"""
    if request.method == 'POST':
        data = request.json
        openid = data.get('openid')
        action = data.get('action', 'create')
        if not openid:
            return jsonify({'success': False, 'error': '缺少 openid'}), 400
        
        pid = 'proj_' + str(uuid.uuid4())[:12]
        db = get_db()
        db.execute(
            'INSERT INTO projects (id, openid, name, data, create_time) VALUES (?, ?, ?, ?, ?)',
            (pid, openid, data.get('name', ''), json.dumps(data.get('data', {}), ensure_ascii=False), datetime.now().isoformat())
        )
        db.commit()
        db.close()
        return jsonify({'success': True, 'data': {'id': pid, **data.get('data', {})}})
    
    openid = request.args.get('openid')
    if not openid:
        return jsonify({'success': False, 'error': '缺少 openid'}), 400
    
    db = get_db()
    rows = db.execute('SELECT * FROM projects WHERE openid=? ORDER BY create_time DESC', (openid,)).fetchall()
    db.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@app.route('/api/characters', methods=['GET', 'POST'])
def api_characters():
    """角色管理"""
    if request.method == 'POST':
        data = request.json
        openid = data.get('openid')
        if not openid:
            return jsonify({'success': False, 'error': '缺少 openid'}), 400
        
        cid = 'char_' + str(uuid.uuid4())[:12]
        db = get_db()
        db.execute(
            'INSERT INTO characters (id, openid, name, data, create_time) VALUES (?, ?, ?, ?, ?)',
            (cid, openid, data.get('name', ''), json.dumps(data.get('data', {}), ensure_ascii=False), datetime.now().isoformat())
        )
        db.commit()
        db.close()
        return jsonify({'success': True, 'data': {'id': cid, **data.get('data', {})}})
    
    openid = request.args.get('openid')
    if not openid:
        return jsonify({'success': False, 'error': '缺少 openid'}), 400
    
    db = get_db()
    rows = db.execute('SELECT * FROM characters WHERE openid=? ORDER BY create_time DESC', (openid,)).fetchall()
    db.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@app.route('/api/templates', methods=['GET', 'POST'])
def api_templates():
    """模板管理"""
    if request.method == 'POST':
        data = request.json
        openid = data.get('openid')
        if not openid:
            return jsonify({'success': False, 'error': '缺少 openid'}), 400
        
        tid = 'tmpl_' + str(uuid.uuid4())[:12]
        db = get_db()
        db.execute(
            'INSERT INTO templates (id, openid, name, data, create_time) VALUES (?, ?, ?, ?, ?)',
            (tid, openid, data.get('name', ''), json.dumps(data.get('data', {}), ensure_ascii=False), datetime.now().isoformat())
        )
        db.commit()
        db.close()
        return jsonify({'success': True, 'data': {'id': tid, **data.get('data', {})}})
    
    openid = request.args.get('openid')
    if not openid:
        return jsonify({'success': False, 'error': '缺少 openid'}), 400
    
    db = get_db()
    rows = db.execute('SELECT * FROM templates WHERE openid=? ORDER BY create_time DESC', (openid,)).fetchall()
    db.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@app.route('/api/configs', methods=['GET', 'POST'])
def api_configs():
    """API 配置管理"""
    if request.method == 'POST':
        data = request.json
        openid = data.get('openid')
        if not openid:
            return jsonify({'success': False, 'error': '缺少 openid'}), 400
        
        db = get_db()
        db.execute(
            'INSERT OR REPLACE INTO api_configs (openid, data) VALUES (?, ?)',
            (openid, json.dumps(data.get('data', {}), ensure_ascii=False))
        )
        db.commit()
        db.close()
        return jsonify({'success': True, 'data': data.get('data', {})})
    
    openid = request.args.get('openid')
    if not openid:
        return jsonify({'success': False, 'error': '缺少 openid'}), 400
    
    db = get_db()
    row = db.execute('SELECT data FROM api_configs WHERE openid=?', (openid,)).fetchone()
    db.close()
    return jsonify({'success': True, 'data': json.loads(row['data']) if row else {}})


@app.route('/api/wechat-accounts', methods=['GET', 'POST'])
def api_wechat_accounts():
    """
    微信公众号账号管理
    GET: 获取账号列表 / 获取选中的账号
    POST: 保存/删除/设置选中账号
    支持 action 参数: getAccounts, saveAccount, deleteAccount, setSelected, getSelected
    """
    action = None
    openid = None
    data = {}

    if request.method == 'POST':
        data = request.json or {}
        action = data.get('action', 'saveAccount')
        openid = data.get('openid') or data.get('clientOpenId')
    else:
        action = request.args.get('action', 'getAccounts')
        openid = request.args.get('openid')

    if not openid:
        return jsonify({'success': False, 'message': '缺少 openid'}), 400

    db = get_db()

    try:
        if action == 'getAccounts':
            rows = db.execute(
                'SELECT * FROM wechat_accounts WHERE openid=? ORDER BY create_time DESC',
                (openid,)
            ).fetchall()
            return jsonify({
                'success': True,
                'data': [dict(r) for r in rows]
            })

        elif action == 'saveAccount':
            account = data.get('account', {})
            app_id = account.get('app_id')
            name = account.get('name')
            app_secret = account.get('app_secret')
            avatar = account.get('avatar', '')

            if not app_id or not name or not app_secret:
                return jsonify({'success': False, 'message': '缺少必要参数'})

            now = datetime.now().isoformat()

            existing = db.execute(
                'SELECT * FROM wechat_accounts WHERE openid=? AND app_id=?',
                (openid, app_id)
            ).fetchone()

            if existing:
                db.execute(
                    'UPDATE wechat_accounts SET name=?, app_secret=?, avatar=?, update_time=? WHERE id=?',
                    (name, app_secret, avatar, now, existing['id'])
                )
                db.commit()
                return jsonify({
                    'success': True,
                    'message': '更新成功',
                    'data': {**dict(existing), 'name': name, 'app_secret': app_secret, 'avatar': avatar, 'update_time': now}
                })
            else:
                aid = 'wa_' + str(uuid.uuid4())[:12]
                db.execute(
                    'INSERT INTO wechat_accounts (id, openid, app_id, name, app_secret, avatar, is_selected, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
                    (aid, openid, app_id, name, app_secret, avatar, now, now)
                )
                db.commit()
                return jsonify({
                    'success': True,
                    'message': '添加成功',
                    'data': {'id': aid, 'openid': openid, 'app_id': app_id, 'name': name, 'app_secret': app_secret, 'avatar': avatar, 'is_selected': 0, 'create_time': now, 'update_time': now}
                })

        elif action == 'deleteAccount':
            app_id = data.get('app_id')
            if not app_id:
                return jsonify({'success': False, 'message': '缺少 app_id'})

            result = db.execute(
                'DELETE FROM wechat_accounts WHERE openid=? AND app_id=?',
                (openid, app_id)
            )
            db.commit()
            if result.rowcount > 0:
                return jsonify({'success': True, 'message': '删除成功'})
            else:
                return jsonify({'success': False, 'message': '未找到该配置'})

        elif action == 'setSelected':
            app_id = data.get('app_id')
            db.execute(
                'UPDATE wechat_accounts SET is_selected=0 WHERE openid=?',
                (openid,)
            )
            if app_id:
                db.execute(
                    'UPDATE wechat_accounts SET is_selected=1 WHERE openid=? AND app_id=?',
                    (openid, app_id)
                )
            db.commit()
            return jsonify({'success': True, 'message': '设置成功'})

        elif action == 'getSelected':
            row = db.execute(
                'SELECT * FROM wechat_accounts WHERE openid=? AND is_selected=1',
                (openid,)
            ).fetchone()

            if row:
                return jsonify({'success': True, 'data': dict(row)})

            # 没有选中的，返回最新的一个
            row = db.execute(
                'SELECT * FROM wechat_accounts WHERE openid=? ORDER BY create_time DESC LIMIT 1',
                (openid,)
            ).fetchone()

            if row:
                # 自动选中
                db.execute(
                    'UPDATE wechat_accounts SET is_selected=1 WHERE id=?',
                    (row['id'],)
                )
                db.commit()
                return jsonify({'success': True, 'data': dict(row)})

            return jsonify({'success': False, 'message': '没有配置公众号'})

        else:
            return jsonify({'success': False, 'message': '未知操作'})

    except Exception as e:
        print(f'[wechat-accounts] Error: {e}')
        return jsonify({'success': False, 'message': str(e)})
    finally:
        db.close()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'WeChat Draft API + User Data API'})

@app.route('/test-auto-publish', methods=['GET'])
def test_auto_publish():
    """测试完整流程接口"""
    print("\n========== 测试自动发布流程 ==========")
    try:
        # 调用内部流程
        return jsonify({
            'success': True,
            'message': '请使用 POST /auto-publish 接口进行完整流程测试',
            'endpoints': {
                'auto_publish': 'POST /auto-publish - 完整流程（采集->评分->生成->推送）',
                'hot_topics': 'GET /hot-topics - 获取今日热点',
                'best_topic': 'GET /best-topic - 获取最佳热点',
                'generate_article': 'POST /generate-article - 生成文章'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("\n========================================")
    print("    WeChat Draft API Server")
    print("========================================")
    print("✓ Running on: http://0.0.0.0:8002")
    print("✓ Health Check: GET /health")
    print("✓ Auto Publish: POST /auto-publish (直接调用本地发布，不再依赖 8002 端口)")
    print("✓ Publish Draft: POST /publish-draft")
    print("✓ Hotspot All: GET /api/hot/all (多源采集+智能分类+评分+缓存)")
    print("✓ Hotspot Sources: GET /api/hot/sources (指定数据源/分类采集)")
    print("✓ Hotspot Score: POST /api/hot/score (10分制多维度评分)")
    print("✓ Hotspot Analyze: POST /api/hot/analyze (深度分析报告)")
    print("✓ Hotspot Refresh: POST /api/hot/refresh (刷新热点缓存)")
    print("✓ User Credits: GET/POST /api/user/credits (用户积分)")
    print("✓ User Member: GET/POST /api/user/member (会员状态)")
    print("✓ History: GET/POST /api/history (创作历史)")
    print("✓ Projects: GET/POST /api/projects (项目管理)")
    print("✓ Characters: GET/POST /api/characters (角色管理)")
    print("✓ Templates: GET/POST /api/templates (模板管理)")
    print("✓ Configs: GET/POST /api/configs (API配置)")
    print("✓ WeChat Accounts: GET/POST /api/wechat-accounts (公众号账号管理)")
    print("========================================\n")
    app.run(host='0.0.0.0', port=8002, debug=False)
