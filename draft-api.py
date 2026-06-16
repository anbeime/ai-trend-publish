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

load_dotenv()
from wechat_sdk import WeChatAPI

app = Flask(__name__)
CORS(app)

wechat = WeChatAPI(
    app_id=os.getenv('WEIXIN_APP_ID'),
    app_secret=os.getenv('WEIXIN_APP_SECRET')
)

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

@app.route('/publish-draft', methods=['POST'])
def publish_draft():
    import sys
    print("\n========== 收到请求 ==========", flush=True)
    try:
        raw_data = request.json
        print(f"1. raw_data类型: {type(raw_data)}", flush=True)

        # 第一步：处理数组
        if isinstance(raw_data, list):
            print(f"2. 是数组，长度: {len(raw_data)}", flush=True)
            if len(raw_data) > 0:
                data = raw_data[0]
            else:
                data = {}
        else:
            data = raw_data

        print(f"3. data类型: {type(data)}", flush=True)

        # 第二步：确保是字典
        if not isinstance(data, dict):
            print(f"4. 不是字典，转换中...", flush=True)
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except:
                    data = {'content': data}
            else:
                data = {}

        print(f"5. 最终data类型: {type(data)}, 键: {list(data.keys()) if isinstance(data, dict) else 'N/A'}", flush=True)

        # 第三步：获取SSE文本
        sse_text = ''
        if isinstance(data, dict):
            sse_text = data.get('data', '') or data.get('body', '')
        print(f"6. SSE文本长度: {len(sse_text)}", flush=True)

        # 第四步：解析COZE输出
        coze_parsed = parse_coze_sse_output(sse_text)
        if coze_parsed:
            title = coze_parsed['title']
            content = coze_parsed['content']
            cover_url = coze_parsed['cover_url']
            thumb_media_id = ''
            print(f"7. COZE解析成功: {title[:20] if title else 'N/A'}...", flush=True)
        else:
            # 标准格式
            title = data.get('title', '') if isinstance(data, dict) else ''
            content = (data.get('content', '') or data.get('output', '')) if isinstance(data, dict) else ''
            cover_url = (data.get('cover_url', '') or data.get('cover', '')) if isinstance(data, dict) else ''
            thumb_media_id = data.get('thumb_media_id', '') if isinstance(data, dict) else ''
            print(f"7. 使用标准格式: {title[:20] if title else 'N/A'}...", flush=True)

        print(f"\n收到发布请求: {title}")
        print(f"  内容长度: {len(content)} 字符")

        # 判断内容格式
        is_markdown = content and ('![' in content or (content.count('#') > 2 and '<' not in content[:100]))
        is_html = content and ('<p>' in content or '<div>' in content or '<section>' in content)

        if is_markdown:
            # Markdown内容需要转换
            print(f"  检测到Markdown格式")

            # 第一步：处理markdown中的图片（上传到微信并替换URL）
            if '![' in content:
                content = process_markdown_images(content)

            # 第二步：转换markdown为HTML
            print(f"  正在转换为微信HTML...")
            content = convert_markdown_to_wechat_html(content)
            print(f"  转换后长度: {len(content)} 字符")
        elif is_html:
            # HTML内容，直接使用（COZE已经生成了完整样式）
            print(f"  检测到HTML格式，直接使用COZE样式")
        else:
            # 纯文本，简单包装
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
            print(f"  成功: {result.get('media_id')[:30]}...\n")
            return jsonify({
                'success': True,
                'media_id': result.get('media_id'),
                'message': 'Draft published successfully'
            })
        else:
            print(f"  失败: {result.get('error')}\n")
            return jsonify({
                'success': False,
                'error': result.get('error')
            }), 400

    except Exception as e:
        print(f"  异常: {e}\n")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'WeChat Draft Publisher'})

if __name__ == '__main__':
    print("\nWeChat Draft API Server")
    print("Running on: http://localhost:8001")
    print("Endpoint: POST http://localhost:8001/publish-draft")
    print("\nReady for N8N workflow\n")
    app.run(host='0.0.0.0', port=8001, debug=False)
