# 支付功能数据库配置

## 数据库集合配置

在微信云开发控制台中，需要创建以下数据库集合：

### 1. `orders` 集合 - 订单表

用于存储所有支付订单记录。

**字段说明：**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 订单唯一标识（系统自动生成） |
| _openid | string | 用户openid（系统自动添加） |
| orderId | string | 订单编号 |
| type | string | 订单类型：membership/credits |
| planId | string | 套餐ID |
| planName | string | 套餐名称 |
| amount | number | 订单金额 |
| status | string | 订单状态：pending/paid/cancelled |
| duration | number | 会员时长（天） |
| credits | number | 积分数量（积分订单） |
| createTime | date | 创建时间 |
| payTime | date | 支付时间 |
| updateTime | date | 更新时间 |

**索引配置：**
```json
{
  "indexes": [
    {
      "name": "orderId_index",
      "keys": { "orderId": 1 },
      "unique": true
    },
    {
      "name": "openid_status_index",
      "keys": { "_openid": 1, "status": 1 }
    }
  ]
}
```

### 2. `memberships` 集合 - 会员表

用于存储用户会员状态信息。

**字段说明：**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 记录唯一标识 |
| _openid | string | 用户openid |
| type | string | 会员类型：monthly/quarterly/yearly |
| typeName | string | 会员类型名称 |
| status | string | 会员状态：active/expired |
| startTime | date | 开始时间 |
| expireTime | date | 过期时间 |
| dailyQuota | number | 每日使用额度 |
| createTime | date | 创建时间 |
| updateTime | date | 更新时间 |

**索引配置：**
```json
{
  "indexes": [
    {
      "name": "openid_index",
      "keys": { "_openid": 1 },
      "unique": true
    },
    {
      "name": "expireTime_index",
      "keys": { "expireTime": 1 }
    }
  ]
}
```

### 3. `user_credits` 集合 - 用户积分表

用于存储用户积分和使用记录（如果已存在可跳过）。

**字段说明：**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 记录唯一标识 |
| _openid | string | 用户openid |
| credits | number | 当前积分 |
| coins | number | 金币数量 |
| dailyQuota | number | 每日额度 |
| dailyUsed | number | 今日已使用 |
| lastResetDate | string | 上次重置日期 |
| totalCreations | number | 总创作次数 |
| level | number | 用户等级 |
| memberType | string | 会员类型 |
| memberExpireTime | date | 会员过期时间 |
| createTime | date | 创建时间 |

**索引配置：**
```json
{
  "indexes": [
    {
      "name": "openid_index",
      "keys": { "_openid": 1 },
      "unique": true
    }
  ]
}
```

### 4. `usage_logs` 集合 - 使用日志表

用于记录用户使用日志（可选）。

**字段说明：**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 记录唯一标识 |
| _openid | string | 用户openid |
| action | string | 操作类型 |
| details | object | 详情 |
| createTime | date | 创建时间 |

---

## 数据库权限配置

在云开发控制台 -> 数据库 -> 权限设置中，配置以下权限：

### 集合权限规则

所有集合使用 **"仅创建者可写，所有人可读"** 模式：

```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

或者更严格的配置：

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

---

## 云函数部署步骤

### 1. 安装依赖

```bash
cd cloudfunctions/pay
npm install

cd ../member-manager
npm install
```

### 2. 上传云函数

在微信开发者工具中：
1. 右键点击 `cloudfunctions/pay` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 同样操作部署 `cloudfunctions/member-manager`

### 3. 测试云函数

在云开发控制台 -> 云函数中，测试以下接口：

**测试 member-manager：**
```json
{
  "action": "getStatus"
}
```

**测试 pay：**
```json
{
  "action": "getMembershipPlans"
}
```

---

## 页面配置

### 在 app.json 中添加订阅页面

```json
{
  "pages": [
    ...
    "pages/subscription/subscription"
  ]
}
```

---

## 安全规则

### 1. 支付密钥安全

生产环境中，支付密钥应存储在云函数环境变量或云开发 Secret Manager 中：

```javascript
// 使用环境变量
const partnerKey = process.env.WECHAT_PAY_KEY

// 或使用云开发 Secret Manager
const secret = await cloud.getSecret({
  name: 'wechat-pay-key'
})
```

### 2. 防止重复支付

在订单处理时，使用数据库事务确保幂等性：

```javascript
const transaction = await db.startTransaction()
try {
  // 检查订单状态
  // 处理支付
  await transaction.commit()
} catch (e) {
  await transaction.rollback()
}
```

### 3. 价格校验

在服务端验证价格，防止前端篡改：

```javascript
const validPrice = MEMBERSHIP_PLANS[planId].price
if (orderAmount !== validPrice) {
  throw new Error('价格不匹配')
}
```

---

## 测试流程

### 1. 模拟支付测试

当前实现了 `mockPay` 接口用于开发测试：

1. 创建订单
2. 调用 mockPay 模拟支付成功
3. 验证会员状态变更

### 2. 生产支付流程

接入真实微信支付后：

1. 前端调用 `wx.requestPayment`
2. 支付成功后微信回调云函数
3. 云函数验证签名并处理订单

---

## 下一步：接入真实微信支付

当小程序完成企业认证后，需要：

1. 申请微信支付商户号
2. 配置支付密钥和证书
3. 修改 `pay/index.js` 中的支付逻辑：

```javascript
// 生成微信支付订单
const payResult = await cloud.cloudPay.unifiedOrder({
  body: planName,
  outTradeNo: orderId,
  totalFee: Math.floor(amount * 100), // 单位：分
  envId: 'your-env-id',
  functionName: 'payCallback',
  nonceStr: nonceStr,
  tradeType: 'JSAPI'
})

// 返回支付参数给前端
return {
  success: true,
  payment: payResult
}
```

前端调用：
```javascript
wx.requestPayment({
  ...payment,
  success: () => { /* 支付成功 */ },
  fail: () => { /* 支付失败 */ }
})
```
