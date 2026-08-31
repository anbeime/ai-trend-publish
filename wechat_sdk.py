 #!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信公众 API Python SDK
支持草稿箱、发布、素材管理等功能
"""

import requests
import json
import time
from typing import Dict, List, Optional, Union

class WeChatAPI:
    """微信公众号 API 客户端"""
    
    def __init__(self, app_id: str, app_secret: str):
        """
        初始化微信 API 客户端

        Args:
            app_id: 微信公众号 AppID
            app_secret: 微信公众号 AppSecret
        """
        self.app_id = app_id
        self.app_secret = app_secret
        self.access_token = None
        self.token_expires_at = 0
        self.base_url = "https://api.weixin.qq.com/cgi-bin"

        # 会话管理（禁用代理，直接连接）
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'WeChat-Python-SDK/1.0',
            'Content-Type': 'application/json'
        })
        # 禁用代理，确保使用本地公网 IP
        self.session.trust_env = False
        self.session.proxies = {
            'http': None,
            'https': None
        }
    
    def get_access_token(self) -> str:
        """
        获取访问令牌（带缓存）
        
        Returns:
            str: 访问令牌
        """
        # 检查缓存是否有效
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token
        
        url = f"{self.base_url}/token"
        params = {
            'grant_type': 'client_credential',
            'appid': self.app_id,
            'secret': self.app_secret
        }
        
        response = self.session.get(url, params=params)
        data = response.json()
        
        if 'access_token' in data:
            self.access_token = data['access_token']
            self.token_expires_at = time.time() + data.get('expires_in', 7200) - 300  # 提前5分钟刷新
            return self.access_token
        else:
            raise Exception(f"获取访问令牌失败: {data}")
    
    def switch_draft_box(self, check_only: bool = False) -> Dict:
        """
        草稿箱开关设置
        
        Args:
            check_only: 是否仅查询状态
            
        Returns:
            Dict: API 响应结果
        """
        token = self.get_access_token()
        url = f"{self.base_url}/draft/switch"
        
        params = {'access_token': token}
        if check_only:
            params['checkonly'] = '1'
        
        response = self.session.post(url, params=params)
        data = response.json()
        
        if data.get('errcode') == 0:
            status = '已开启' if data.get('is_open') == 1 else '未开启'
            result = {
                'success': True,
                'data': data,
                'message': f"草稿箱{status}",
                'operation_type': '查询状态' if check_only else '设置开关',
                'tips': {
                    'status': status,
                    'note': '草稿箱开启后，微信公众平台后台的图文素材库将升级为草稿箱',
                    'warning': '开启后不可逆，请谨慎操作'
                } if check_only else None
            }
        else:
            result = {
                'success': False,
                'error': data,
                'message': '操作失败'
            }
        
        return result
    
    def create_draft(self, articles: List[Dict]) -> Dict:
        """
        创建草稿
        优先使用草稿箱接口 (draft/add)，
        若返回 48001（无权限），降级为旧版图文素材接口 (media/uploadnews)。

        Args:
            articles: 文章列表，每个文章包含 title, content, digest, thumb_media_id 等

        Returns:
            Dict: API 响应结果
        """
        token = self.get_access_token()
        url = f"{self.base_url}/draft/add"

        data = {'articles': articles}

        # 手动序列化JSON，确保中文不被转义（使用ensure_ascii=False）
        json_str = json.dumps(data, ensure_ascii=False)
        json_bytes = json_str.encode('utf-8')

        response = self.session.post(
            url,
            params={'access_token': token},
            data=json_bytes,
            headers={'Content-Type': 'application/json; charset=utf-8'}
        )
        result = response.json()

        # 成功时返回 {'media_id': '...', 'item': [...]}
        if 'media_id' in result:
            return {
                'success': True,
                'data': result,
                'message': '草稿创建成功',
                'media_id': result.get('media_id')
            }

        # 检查是否是 48001 错误，降级为旧版图文素材接口
        errcode = result.get('errcode', 0)
        if errcode == 48001:
            print(f"  [WeChatSDK] 草稿箱接口无权限(48001)，降级为旧版图文素材...")
            token = self.get_access_token()
            url_legacy = f"{self.base_url}/media/uploadnews"
            response = self.session.post(
                url_legacy,
                params={'access_token': token},
                data=json_bytes,
                headers={'Content-Type': 'application/json; charset=utf-8'}
            )
            result = response.json()

            if 'media_id' in result:
                return {
                    'success': True,
                    'data': result,
                    'message': '图文素材创建成功（旧版接口）',
                    'media_id': result.get('media_id')
                }

        # 失败
        return {
            'success': False,
            'error': result,
            'message': f"草稿创建失败: {result.get('errmsg', '未知错误')}"
        }
    
    def get_draft_list(self, offset: int = 0, count: int = 20, no_content: int = 0) -> Dict:
        """
        获取草稿列表
        
        Args:
            offset: 偏移量
            count: 数量
            no_content: 是否不返回内容
            
        Returns:
            Dict: API 响应结果
        """
        token = self.get_access_token()
        url = f"{self.base_url}/draft/batchget"
        
        data = {
            'offset': offset,
            'count': count,
            'no_content': no_content
        }
        
        response = self.session.post(url, params={'access_token': token}, json=data)
        result = response.json()
        
        if result.get('errcode') == 0:
            return {
                'success': True,
                'data': result,
                'message': '草稿列表获取成功'
            }
        else:
            return {
                'success': False,
                'error': result,
                'message': '获取草稿列表失败'
            }
    
    def delete_draft(self, media_id: str) -> Dict:
        """
        删除草稿
        
        Args:
            media_id: 草稿媒体ID
            
        Returns:
            Dict: API 响应结果
        """
        token = self.get_access_token()
        url = f"{self.base_url}/draft/delete"
        
        data = {'media_id': media_id}
        
        response = self.session.post(url, params={'access_token': token}, json=data)
        result = response.json()
        
        if result.get('errcode') == 0:
            return {
                'success': True,
                'data': result,
                'message': '草稿删除成功',
                'warning': '此操作不可逆，请谨慎操作'
            }
        else:
            return {
                'success': False,
                'error': result,
                'message': '草稿删除失败'
            }
    
    def publish_article(self, media_id: str) -> Dict:
        """
        发布文章
        
        Args:
            media_id: 草稿媒体ID
            
        Returns:
            Dict: API 响应结果
        """
        token = self.get_access_token()
        url = f"{self.base_url}/freepublish/submit"
        
        data = {'media_id': media_id}
        
        response = self.session.post(url, params={'access_token': token}, json=data)
        result = response.json()
        
        if result.get('errcode') == 0:
            return {
                'success': True,
                'data': result,
                'message': '发布任务提交成功！请使用 publish_id 查询发布状态',
                'publish_id': result.get('publish_id'),
                'next_step': f"调用 publish_status 查询发布状态，publish_id: {result.get('publish_id')}"
            }
        else:
            return {
                'success': False,
                'error': result,
                'message': '发布任务提交失败'
            }
    
    def get_publish_status(self, publish_id: str) -> Dict:
        """
        查询发布状态
        
        Args:
            publish_id: 发布任务ID
            
        Returns:
            Dict: API 响应结果
        """
        token = self.get_access_token()
        url = f"{self.base_url}/freepublish/get"
        
        data = {'publish_id': publish_id}
        
        response = self.session.post(url, params={'access_token': token}, json=data)
        result = response.json()
        
        # 状态码映射
        status_map = {
            0: '发布成功',
            1: '发布中',
            2: '原创失败',
            3: '常规失败',
            4: '平台审核不通过',
            5: '成功后用户删除所有文章',
            6: '成功后系统封禁所有文章'
        }
        
        if result.get('errcode') == 0:
            status_code = result.get('publish_status')
            status_desc = status_map.get(status_code, '未知状态')
            
            response_data = {
                'success': True,
                'data': result,
                'message': '状态查询成功',
                'publish_status': status_code,
                'publish_status_desc': status_desc
            }
            
            # 如果发布成功，添加文章链接
            if status_code == 0 and 'article_detail' in result:
                articles = result['article_detail'].get('item', [])
                if articles:
                    response_data['article_links'] = [
                        {'idx': item['idx'], 'url': item['article_url']} 
                        for item in articles
                    ]
            
            return response_data
        else:
            return {
                'success': False,
                'error': result,
                'message': '状态查询失败'
            }
    
    def upload_media(self, media_path: str, media_type: str = 'thumb') -> Dict:
        """
        上传媒体文件（永久素材接口）
        若返回 48001（无权限，常见于未认证订阅号），
        返回失败，让调用方跳过封面图（草稿箱不支持临时素材的 media_id）。

        Args:
            media_path: 文件路径
            media_type: 媒体类型 (thumb, image, voice, video等)

        Returns:
            Dict: API 响应结果
        """
        import os

        token = self.get_access_token()
        filename = os.path.basename(media_path)

        # 尝试永久素材接口
        url = f"{self.base_url}/material/add_material?access_token={token}&type={media_type}"
        with open(media_path, 'rb') as f:
            files = {'media': (filename, f, 'image/jpeg')}
            response = requests.post(url, files=files, proxies={'http': None, 'https': None})
            result = response.json()

        if 'media_id' in result:
            return {
                'success': True,
                'data': result,
                'message': '媒体文件上传成功',
                'media_id': result.get('media_id'),
                'url': result.get('url')
            }

        errcode = result.get('errcode', 0)
        if errcode == 48001:
            # 未认证订阅号没有永久素材权限，返回失败让上层处理
            print(f"  [WeChatSDK] 永久素材接口无权限(48001)")
            return {
                'success': False,
                'data': result,
                'message': '无永久素材权限',
            }

        return {
            'success': False,
            'error': result,
            'message': f"媒体文件上传失败: {result.get('errmsg', '未知错误')}"
        }
    
    def complete_publish(self, title: str, content: str, summary: str = '', thumb_media_id: str = '') -> Dict:
        """
        一键完整发布流程：创建草稿 -> 提交发布
        
        Args:
            title: 文章标题
            content: 文章内容 (HTML)
            summary: 文章摘要
            thumb_media_id: 封面图片媒体ID
            
        Returns:
            Dict: 完整流程结果
        """
        steps = {}
        
        try:
            # Step 1: 创建草稿
            articles = [{
                'title': title,
                'content': content,
                'digest': summary,
                'thumb_media_id': thumb_media_id,
                'need_open_comment': 0,
                'only_fans_can_comment': 0
            }]
            
            draft_result = self.create_draft(articles)
            if draft_result['success']:
                steps['1.创建草稿'] = '✅ 成功'
                media_id = draft_result['media_id']
            else:
                steps['1.创建草稿'] = '❌ 失败'
                return {
                    'success': False,
                    'error': draft_result['error'],
                    'message': '草稿创建失败，流程终止',
                    'steps': steps
                }
            
            # Step 2: 提交发布
            publish_result = self.publish_article(media_id)
            if publish_result['success']:
                steps['2.提交发布'] = '✅ 成功'
            else:
                steps['2.提交发布'] = '❌ 失败'
                return {
                    'success': False,
                    'error': publish_result['error'],
                    'message': '发布任务提交失败',
                    'steps': steps
                }
            
            # 成功
            steps['✅ 流程完成'] = '所有步骤执行成功'
            return {
                'success': True,
                'data': {
                    'access_token': self.access_token,
                    'media_id': media_id,
                    'publish_id': publish_result['publish_id'],
                    'steps': steps
                },
                'message': '发布任务提交成功！请使用 publish_id 查询发布状态',
                'next_step': publish_result['next_step'],
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': f'发布流程异常: {str(e)}',
                'steps': steps
            }


def main():
    """示例用法"""
    # 配置你的微信公众信息
    APP_ID = 'wx8410119dfbb7f756'
    APP_SECRET = '3c93e33e087e57b906f5c341aa5223b9'
    
    # 初始化 API 客户端
    wechat = WeChatAPI(APP_ID, APP_SECRET)
    
    print("🚀 微信公众 API 测试开始\n")
    
    try:
        # 1. 检查草稿箱状态
        print("1️⃣ 检查草稿箱状态...")
        switch_result = wechat.switch_draft_box(check_only=True)
        print(f"   状态: {switch_result.get('message')}")
        if switch_result.get('tips'):
            tips = switch_result['tips']
            print(f"   说明: {tips.get('note')}")
            print(f"   ⚠️  警告: {tips.get('warning')}")
        
        # 如果草稿箱未开启，询问是否开启
        if not switch_result.get('data', {}).get('is_open'):
            print("\n📝 草稿箱未开启，是否要开启？")
            choice = input("输入 'y' 开启草稿箱（注意：此操作不可逆）: ")
            if choice.lower() == 'y':
                print("   正在开启草稿箱...")
                enable_result = wechat.switch_draft_box(check_only=False)
                print(f"   结果: {enable_result.get('message')}")
                if not enable_result['success']:
                    print(f"   错误: {enable_result.get('error')}")
                    return
            else:
                print("   跳过草稿箱开启")
        
        # 2. 一键发布测试
        print("\n2️⃣ 测试一键发布...")
        test_title = f"API测试文章 - {time.strftime('%Y-%m-%d %H:%M:%S')}"
        test_content = f"""
        <h1>📱 微信API测试</h1>
        <p>这是一篇通过Python SDK发布的测试文章。</p>
        <p><strong>发布时间:</strong> {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p><strong>测试功能:</strong></p>
        <ul>
            <li>✅ 获取访问令牌</li>
            <li>✅ 创建草稿</li>
            <li>✅ 提交发布</li>
            <li>✅ 查询发布状态</li>
        </ul>
        <p><em>这是自动生成的测试文章。</em></p>
        """
        
        complete_result = wechat.complete_publish(
            title=test_title,
            content=test_content,
            summary="Python SDK 自动测试文章"
        )
        
        if complete_result['success']:
            data = complete_result['data']
            print(f"   ✅ 发布任务提交成功!")
            print(f"   📝 Media ID: {data.get('media_id')}")
            print(f"   🚀 Publish ID: {data.get('publish_id')}")
            print(f"   📋 执行步骤:")
            for step, status in data.get('steps', {}).items():
                print(f"      {step}: {status}")
            
            # 3. 查询发布状态
            if data.get('publish_id'):
                print(f"\n3️⃣ 查询发布状态 (Publish ID: {data.get('publish_id')})...")
                
                # 轮询状态
                for i in range(5):  # 最多查询5次
                    time.sleep(3)  # 等待3秒
                    
                    status_result = wechat.get_publish_status(data['publish_id'])
                    if status_result['success']:
                        status = status_result['publish_status']
                        desc = status_result['publish_status_desc']
                        print(f"   第{i+1}次查询: {status} - {desc}")
                        
                        if status == 0:  # 发布成功
                            if 'article_links' in status_result:
                                for link in status_result['article_links']:
                                    print(f"   📎 文章链接: {link['url']}")
                            break
                        elif status > 1:  # 失败状态
                            break
                    else:
                        print(f"   第{i+1}次查询失败: {status_result.get('message')}")
                        break
                else:
                    print("   ⏰ 查询超时，请稍后手动查看发布状态")
        else:
            print(f"   ❌ 发布失败: {complete_result.get('message')}")
            if complete_result.get('error'):
                print(f"   错误详情: {complete_result['error']}")
        
        # 4. 获取草稿列表
        print("\n4️⃣ 获取草稿列表...")
        draft_list_result = wechat.get_draft_list(offset=0, count=5)
        if draft_list_result['success']:
            data = draft_list_result['data']
            total = data.get('total_count', 0)
            items = data.get('item', [])
            print(f"   📝 草稿总数: {total}")
            print(f"   📄 返回数量: {len(items)}")
            for i, draft in enumerate(items, 1):
                print(f"   {i}. {draft.get('title', '无标题')} (ID: {draft.get('media_id', 'N/A')})")
        else:
            print(f"   ❌ 获取草稿列表失败: {draft_list_result.get('message')}")
    
    except Exception as e:
        print(f"💥 测试过程中出现错误: {str(e)}")
    
    print("\n🎉 测试完成!")


if __name__ == '__main__':
    main()