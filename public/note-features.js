// Note to MP 功能集成
// 整合 Obsidian 插件的核心功能

class NoteToMPIntegration {
  constructor() {
    this.PluginHost = 'https://obplugin.sunboshi.tech';
    this.authkey = 'default-auth-key';
  }

  // 获取微信 Token
  async wxGetToken(authkey, appid, secret) {
    const url = this.PluginHost + '/v1/wx/token';
    const body = {
      authkey,
      appid,
      secret
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    return await response.json();
  }

  // 加密微信数据
  async wxEncrypt(authkey, wechatData) {
    const url = this.PluginHost + '/v1/wx/encrypt';
    const body = JSON.stringify({
      authkey,
      wechat: wechatData
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    });
    
    return await response.json();
  }

  // 获取关键信息
  async wxKeyInfo(authkey) {
    const url = this.PluginHost + '/v1/wx/info/' + authkey;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
  }

  // 上传图片
  async wxUploadImage(data, filename, token, type = '') {
    let url = '';
    if (type === '') {
      url = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=' + token;
    } else {
      url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=${type}`;
    }

    const N = 16;
    const randomBoundryString = "djmangoBoundry" + Array(N+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, N);
    
    const pre_string = `------${randomBoundryString}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: "application/octet-stream"\r\n\r\n`;
    const post_string = `\r\n------${randomBoundryString}--`;
    
    const pre_string_encoded = new TextEncoder().encode(pre_string);
    const post_string_encoded = new TextEncoder().encode(post_string);
    const concatenated = await new Blob([pre_string_encoded, data, post_string_encoded]).arrayBuffer();

    const options = {
      method: 'POST',
      url: url,
      contentType: `multipart/form-data; boundary=----${randomBoundryString}`,
      body: concatenated
    };

    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      url: result.url || '',
      media_id: result.media_id || '',
      errcode: result.errcode || 0,
      errmsg: result.errmsg || '',
    };
  }

  // 新建草稿
  async wxAddDraft(token, data) {
    const url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + token;
    const body = {
      articles: [{
        title: data.title,
        content: data.content,
        digest: data.digest || '',
        thumb_media_id: data.thumb_media_id || '',
        need_open_comment: data.need_open_comment || 0,
        only_fans_can_comment: data.only_fans_can_comment || 0,
        ...data.pic_crop_235_1 && {pic_crop_235_1: data.pic_crop_235_1},
        ...data.pic_crop_1_1 && {pic_crop_1_1: data.pic_crop_1_1},
        ...data.content_source_url && {content_source_url: data.content_source_url},
        ...data.author && {author: data.author},
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    return await response.json();
  }

  // 数学公式 Widget
  async wxWidget(authkey, params) {
    const host = 'https://obplugin.sunboshi.tech';
    const path = '/math/widget';
    const url = `${host}${path}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'authkey': authkey
        },
        body: params
      });
      
      if (response.status === 200) {
        const result = await response.json();
        return result.content;
      }
      return result.msg;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  }
}

// 导出类
window.NoteToMPIntegration = NoteToMPIntegration;