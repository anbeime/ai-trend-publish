export interface StableTokenOptions {
  appid: string;
  secret: string;
  endpoint?: string; // default微信稳定令牌接口
  ttlSeconds?: number; // token 缓存有效时长，单位秒，默认 7200
}

type TokenResponse = {
  access_token: string;
  expires_in?: number;
};

/**
 * 微信 Stable Token 服务
 * - 支持普通模式与强制刷新模式
 * - 内部对刷新进行简单的全局锁，避免并发重复刷新
 */
export class StableTokenService {
  private appid: string;
  private secret: string;
  private endpoint: string;
  private ttlSeconds: number;

  private token?: string;
  private expiresAt?: number;
  private refreshing?: Promise<string>;

  constructor(opts: StableTokenOptions) {
    this.appid = opts.appid;
    this.secret = opts.secret;
    this.endpoint = opts.endpoint ?? 'https://api.weixin.qq.com/cgi-bin/stable_token';
    this.ttlSeconds = opts.ttlSeconds ?? 7200;
  }

  async getToken(forceRefresh = false): Promise<string> {
    const now = Date.now();

    const needsRefresh = forceRefresh || !this.token || !this.expiresAt || now >= this.expiresAt;
    if (needsRefresh) {
      if (!this.refreshing) {
        this.refreshing = this.refreshToken();
        try {
          const t = await this.refreshing;
          this.token = t;
        } finally {
          this.refreshing = undefined;
        }
      }
      // 等待中间刷新完成
      const t = await this.refreshing ?? this.refreshToken();
      this.token = t;
      // 更新过期时间，尽量使用接口返回的 expires_in（若有）或 ttlSeconds
      // 这里默认 ttlSeconds，若接口返回 expires_in 则覆盖
      const expiresIn = (this._lastExpiresIn ?? this.ttlSeconds);
      this.expiresAt = now + expiresIn * 1000;
    }

    return this.token as string;
  }

  private _lastExpiresIn?: number;

  private async refreshToken(): Promise<string> {
    const body = {
      grant_type: 'client_credential',
      appid: this.appid,
      secret: this.secret
    } as const;

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stable token request failed: ${res.status} ${res.statusText} - ${text}`);
    }

    const data: TokenResponse = await res.json();
    if (!data.access_token) {
      throw new Error('Stable token response missing access_token');
    }

    // 支持服务器端返回 expires_in 时的缓存更新
    const expiresIn = data.expires_in ?? this.ttlSeconds;
    this._lastExpiresIn = expiresIn;
    this.token = data.access_token;
    this.expiresAt = Date.now() + expiresIn * 1000;
    return this.token;
  }
}

// 导出一个默认的工厂方法，方便快速接入
export function createStableTokenService(opts: StableTokenOptions): StableTokenService {
  return new StableTokenService(opts);
}
