# LingoLoop · 每天开口一点点

手机英语练习应用，包含情景口语、听力、阅读、写作、词典与学习宠物。

现有网站：https://lingoloop-shun-1105.lishun9876.chatgpt.site/

本仓库保存从 Sites 导出的完整应用源码。网站继续由原 Sites 项目托管；上传源码不代表已部署至 GitHub Pages。

## 开发与验证

使用 Node.js 22 或更新版本，无需安装依赖。

```sh
npm test
npm run build
```

构建生成 `dist/server/index.js`，其中包含页面、资源、词典数据及 Worker 服务端接口。

## 目录

- `public/`：页面、样式、交互、三维宠物和阅读/听力种子数据。
- `worker/`：AI 模型、词典、阅读和听力接口。
- `data/`：词典数据。
- `scripts/`：构建与验证脚本。
- `.openai/hosting.json`：原 Sites 项目关联与 R2 存储绑定声明。

## 托管要求

该项目不是纯静态网站，不能将 `public/` 直接上传 GitHub Pages 后期待全部功能正常。

完整运行依赖：

1. 能执行 Worker 的后端环境。
2. R2 兼容的 `BUCKET` 存储绑定。
3. 运行时密钥 `LINGOLOOP_KEY_ENCRYPTION`（不在仓库内）。
4. 可信身份验证网关。原站由 Sites 校验身份并注入 `oai-authenticated-user-id`；迁往其他托管服务前必须替换身份验证，不能信任公开请求自行提交的这个请求头。

仓库不包含云存储中的模型凭据、运行时密钥或个人学习数据。更换托管后需要单独迁移数据及配置身份验证。原网站的访问权限不变。

## GitHub Pages 的限制

Pages 仅能托管静态文件。AI 对话、模型密钥加密保存、内容在线更新、当前词典/发音接口与 ChatGPT 登录需要后端或改造。宠物动画和浏览器本地记录可以保留；阅读、听力可以改为静态种子内容，但本仓库目前保留原站完整实现。

每日自动更新原本处于暂停状态，上传代码不会恢复计划任务。详情参见 `MODEL_CONNECTION.md`、`READING_UPDATES.md`、`LISTENING_UPDATES.md`。

第三方资源许可参见 `public/three-license.txt`、`public/dictionary-license.txt` 及资源自身头部。
