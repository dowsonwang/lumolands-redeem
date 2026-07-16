# lumolands 会员兑换码 · 用户兑换前台 PRD

> 版本：v1.0  ·  对象：开发/测试  ·  语言：英文 UI

## 1. 产品概述

### 1.1 背景与目的

用户购买 lumolands 硬件产品后，包装内附赠一张实体刮刮卡（Redemption Card），卡片上印有 16 位兑换码。用户需通过本网页激活与 App 账号绑定的 12 个月会员。

本页面是兑换流程的唯一入口，目标用户为已完成 App 注册的硬件购买者。

### 1.2 核心目标

- 用户在 30 秒内完成"输邮箱 → 输码 → 激活"三步操作
- 针对谷歌/苹果快捷登录用户提供明确的邮箱指引，避免输错
- 兑换失败时给出清晰原因和下一步动作，减少客服工单

### 1.3 访问入口

- 独立 URL：`/`
- 移动端优先，桌面端兼容
- 无需登录，无 Cookie 依赖

---

## 2. 页面结构

页面为单屏卡片式布局，从上到下依次：

| 区域 | 内容 |
|---|---|
| 顶部品牌区 | lumolands logo + 副标题 "Membership Redemption" |
| 主卡片 | 标题 + 说明 + 邮箱输入区 + 兑换码输入区 + 提交按钮 |
| 结果反馈区 | 成功/失败卡片（提交后替换按钮位置） |
| 左下角浮动入口 | "Admin" 链接（开发原型用，生产可移除） |

---

## 3. 交互流程

### 3.1 主流程

```
用户进入页面
  ↓
输入注册邮箱 → 输入 16 位兑换码 → 点击 "Redeem Now"
  ↓
按钮进入 loading 状态，输入框锁定
  ↓
提交至服务端核销（约 600ms 响应）
  ↓
┌─ 成功 → 显示成功卡片，引导去 App 点 "Restore Purchases"
└─ 失败 → 显示失败卡片 + 原因 + "Try again" 按钮
```

### 3.2 邮箱输入

**输入框**
- 标签：`Registered App Email`
- 占位符：`e.g. you@example.com`
- 类型：email，启用浏览器原生邮箱键盘
- 大小写不敏感（服务端 trim + 小写化处理）

**提示卡 1（位置指引）**
- 标题：`Where can I find my registered email?`
- 内容：引导用户打开 App → 底部 Profile 标签 → 顶部显示的邮箱即为注册邮箱

**提示卡 2（隐私中继邮箱警示）**
- 标题：`Signed in with Google or Apple?`
- 内容：
  - 谷歌/苹果快捷登录用户，系统会生成一个隐私中继邮箱（如 `xxxx@privaterelay.appleid.com`）
  - **禁止**直接输入个人谷歌/苹果邮箱
  - 必须输入 App Profile 页面显示的完整中继邮箱，否则无法匹配会员

**校验规则**
- 失焦或输入内容时触发格式校验
- 格式非法（非邮箱）→ 输入框红色高亮 + 下方红色文案 `Please enter a valid email address.`
- 格式合法但未在 App 注册 → 提交后由服务端返回失败（见 3.5）

### 3.3 兑换码输入

**输入方式**
- 4 个独立输入框，每个 4 位，呈 4×4 网格
- 字符集：大写字母 + 数字（剔除易混淆字符 `0` `O` `1` `I` `L`，共 31 个合法字符）
- 输入自动转大写，非法字符自动过滤
- 每填满 4 位自动跳到下一格
- Backspace 在空格处自动回退到上一格
- 左右方向键可在格间切换
- 支持粘贴整串 16 位码（自动分配到 4 格）或粘贴带分隔符的码（如 `ABCD-EFGH-...`）

**提示卡**
- 标题：`Where is my code?`
- 内容：兑换码印在包装内卡片上，刮开银色涂层可见 16 位字符，每格输入 4 位

### 3.4 提交按钮

- 文案：`Redeem Now`
- 启用条件：邮箱格式合法 AND 4 格均填满 4 位 AND 非提交中
- 提交中：显示 loading 图标，按钮禁用，邮箱+码输入框全部锁定
- 提交完成后按钮消失，替换为结果卡片

### 3.5 结果反馈

#### 3.5.1 成功

- 绿色卡片，对勾图标
- 标题：`Redemption Successful`
- 引导文案：打开 App → Profile 标签 → 点击 `Restore Purchases` 激活会员
- 无重试按钮（成功后输入框锁定，不可再次提交）

#### 3.5.2 失败

- 红色卡片，叉号图标
- 标题：`Redemption Failed`
- 根据失败原因显示不同文案：

| 失败原因 | 展示文案 | 是否暴露码状态 |
|---|---|---|
| `invalid_code` | "We couldn't find this code. Please double-check the characters on your card and try again." | 否 |
| `already_used` | "This code has already been redeemed. Each code can be used only once." | 是 |
| `email_not_registered` | "This email is not registered in the App. Please create an account in the App first, then come back to redeem." | — |
| `rate_limited` | 按 `invalid_code` 文案展示（避免泄露码是否存在） | 否 |
| `voided`（码已作废） | 按 `already_used` 文案展示（避免暴露作废细节） | 是 |
| `batch_inactive`（批次未启用） | 按 `invalid_code` 文案展示 | 否 |

- 提供 `Try again` 按钮，点击后重置：清空兑换码、保留邮箱、隐藏结果卡片、恢复输入框可编辑

### 3.6 锁定与重置

| 状态 | 邮箱框 | 码框 | 按钮 |
|---|---|---|---|
| 初始 | 可编辑 | 可编辑 | 显示，按校验结果启用/禁用 |
| 提交中 | 锁定 | 锁定 | loading |
| 成功 | 锁定 | 锁定 | 隐藏（显示成功卡片） |
| 失败 | 可编辑 | 可编辑 | 隐藏（显示失败卡片 + Try again） |

点击 `Try again` 后回到初始状态，但**邮箱保留**（用户一般不需重输），**码清空**。

---

## 4. 异常情况处理

### 4.1 输入层异常

| 场景 | 处理 |
|---|---|
| 邮箱为空点击提交 | 按钮禁用，无法点击 |
| 邮箱格式错误 | 输入框红框 + 错误文案，按钮禁用 |
| 码未填满 16 位 | 按钮禁用 |
| 粘贴含中文/特殊符号 | 自动过滤，仅保留 A-Z0-9 |
| 粘贴不足 16 位 | 已填入部分正常显示，剩余格留空，按钮禁用 |

### 4.2 服务端异常

| 场景 | 处理 |
|---|---|
| 网络超时/500 | 仍按失败展示，文案走 `invalid_code` 兜底（避免暴露服务端细节） |
| 限频触发（同 IP 5次/分 或 同邮箱 10次/时） | 走 `invalid_code` 文案，不暴露"被限频"信息 |
| 码不存在 | `invalid_code` 文案 |
| 码已作废 | `already_used` 文案（统一为"已用过"语义） |
| 码已使用 | `already_used` 文案 |
| 批次未启用 | `invalid_code` 文案（不暴露批次状态） |
| 邮箱未在 App 注册 | `email_not_registered` 文案（明确告知先注册 App） |

### 4.3 安全考虑

- 不区分"码不存在"和"码已作废"的前端文案，防止枚举探测
- 限频双维度（IP + 邮箱），防爆破
- 所有兑换尝试（含失败）写入后台兑换记录，供客服查询

---

## 5. 状态机

```
idle ──提交──▶ loading ──成功──▶ success（终态）
                  │
                  └──失败──▶ failed ──Try again──▶ idle（保留邮箱，清码）
```

---

## 6. 验收标准

- [ ] 移动端 375px 宽度下 4 个码输入框完整可见，无横向滚动
- [ ] 邮箱失焦校验、码填满自动跳格、粘贴整串码自动分配均正常
- [ ] 成功/失败 4 种文案（invalid_code / already_used / email_not_registered / success）展示正确
- [ ] 限频触发后文案不泄露"被限频"
- [ ] Try again 后邮箱保留、码清空、可重新提交
- [ ] 页面无任何 TRAE/第三方品牌 logo 或浮标
