# LingoLoop

英语学习网站：口语对话、CBS 真人新闻听力、写作练习、AI 每日阅读、点词查询和学习记录。

## 项目结构

- `public/`：HTML、CSS、浏览器 JavaScript 和随项目提供的词典/播放器等静态资源。
- `worker/`：Cloudflare Worker 服务端、持久化阅读/听力接口、DeepSeek / 智谱 GLM 模型连接。
- `data/dictionary.json`：词典数据；许可见 `public/dictionary-license.txt`。
- `scripts/`：构建及检查脚本。
- `.openai/hosting.json`：现有 Sites 项目的托管标识和 R2 绑定声明，不含密钥。

## 构建

使用支持 Web API 的现代 Node.js（建议 Node.js 22 或更新版本）：

```sh
node scripts/build.mjs
node scripts/validate-artifact.mjs
```

产物为 `dist/server/index.js`。无需 npm 依赖安装。当前实现使用 Sites 提供的身份认证、R2 `BUCKET` 绑定以及服务端密钥。**直接部署到 GitHub Pages 不能运行这些服务端功能。** 迁移到其他托管平台时必须先实现相同的访问控制；不要将写入或模型调用接口公开。

## 模型与自动更新状态

已支持通过网站设置验证并保存 DeepSeek / 智谱 GLM 标准 API 连接。模型密钥在服务端加密保存，不包含在仓库中。`LINGOLOOP_KEY_ENCRYPTION` 必须通过托管平台的 secret 配置，不能写入源码或提交 Git。

每日阅读和 CBS 听力的定时更新目前暂停。模型连接成功不会自动启用定时更新；完整的新闻检索、来源核验、生成、持久化回读与调度还需要联调。详见 `MODEL_CONNECTION.md`、`READING_UPDATES.md` 和 `LISTENING_UPDATES.md`。

线上学习数据和加密模型配置位于服务端 R2，不包含在本仓库。`public/*-seed.json` 仅为示例/兜底内容。个人学习记录保存在用户浏览器中，不包含在仓库。

## 来源

源码快照来自关联 LingoLoop Site，源提交 `09f8b2aeedfa7707c1a4103ed2e1423368fd7347`。GitHub 存储源码不代表已经建立与 Sites 的双向同步或自动发布。

第三方资源保留原许可文件（包括 ECDICT、Three.js），HLS.js 的许可说明保留在资源头部。
