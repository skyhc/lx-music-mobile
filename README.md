# LX Music for iOS / iPadOS

**面向 iPhone 与 iPad 的 LX Music 社区移植版，由 skyhc 维护。**

基于 [lyswhut/LX Music 移动版](https://github.com/lyswhut/lx-music-mobile)与 [Q-1515 的早期 iOS 移植](https://github.com/Q-1515/lx-music-mobile)继续开发，保留原项目的音乐列表、搜索、歌词、自定义源与同步体系，补齐 Apple 平台的原生播放、持久缓存、窗口布局和键盘交互。**本仓库不是上游官方发布的 iOS 应用。**

[下载与发布记录](https://github.com/skyhc/lx-music-mobile/releases/latest) · [iOS / iPadOS 完整改动说明](docs/IOS_IPADOS_PORT.md) · [Build87 发布说明](docs/releases/BUILD87.md) · [问题反馈](https://github.com/skyhc/lx-music-mobile/issues)

## 当前版本与运行要求

| 项目 | 说明 |
| --- | --- |
| 发布版本 | **1.9.0 / Build 87** |
| 平台 | **iPhone：iOS 15.0 及以上；iPad：iPadOS 15.0 及以上** |
| 架构 | arm64；同一应用包含 iPhone 与 iPad 设备适配 |
| 主线 | `master`，由原 `codex/ios-upstream-1.9.0` 完整提升而来 |
| 发布源代码 | `a29a9d758fd601d42fd22a4a5e1d009537a2df73` |
| 已验证构建 | [Actions #88](https://github.com/skyhc/lx-music-mobile/actions/runs/35008293921) |
| 安装包状态 | **unsigned（未签名）IPA / Xcode Archive，安装前需要自行签名** |

最低系统版本是构建目标，不代表已逐一测试每个 iOS/iPadOS 版本。较新的窗口能力在支持的系统上启用，旧系统保留回退路径。

## 主要功能

### 原生播放、歌词与音效

- MP3 等系统支持的音频通过 TrackPlayer / AVFoundation 播放；FLAC 使用独立的 libFLAC / AVAudioEngine 原生链路。
- 支持播放、暂停、恢复、进度跳转、音量控制，以及两条播放链路之间的资源切换。
- 适配后台音频会话、控制中心 / 锁屏播放信息、远程播放指令和逐行锁屏歌词。锁屏显示方式由系统控制，不是 Android 悬浮窗歌词。
- 保留均衡器、音调、卷积音效、动态处理和声像等原生音效适配；不同设备输出与主观听感仍需实际试听。

### 持久缓存与多端同步

- 完整音频保存到应用持久目录；按歌曲来源、标识与音质区分，校验完成后才登记为可用缓存。
- 完整缓存命中时可离线播放，并保留跨进程重启恢复、容量管理、单曲 / 全局清理，以及正在播放文件的保护机制。
- 缓存不等同于下载了整个曲库；未完整缓存、损坏或已清理的歌曲仍需要可用音源。卸载应用会删除沙盒数据。
- 对接 [LX Music 数据同步服务](https://github.com/lyswhut/lx-music-sync-server)，兼容桌面版协议，支持配对、歌单与歌曲变更同步、断线重连。首次同步方向由用户选择，建议先导出备份。

### iPad 布局与外接键盘

- 宽窗口采用侧边导航、单行歌曲表格及封面 / 控制区与歌词分栏；竖屏或窄窗口切换为紧凑布局。
- 统一处理安全区、窗口尺寸变化、菜单锚点、收藏弹窗与底部控制区域，避免同一安全区重复计算。
- 提供外接键盘总开关，以及播放、进度、选择、导航分项。文字输入时保留系统编辑按键，隐藏页面不接收当前页指令。
- **Build87 修复快速连续调整进度的问题**：立即累计显示目标，120 毫秒内连续输入合并；旧请求及旧进度查询不能覆盖最新目标，不再逐个重放历史 seek。

### 跟随系统的独立亮色 / 暗色主题

在 **设置 → 基本设置 → 主题** 中选择 **“道法自然”**，再打开跟随系统主题设置，分别选择亮色主题和暗色主题。

两组预设独立保存；系统外观改变时切到相应预设，重启后继续生效。选择固定主题后不再跟随系统。修改非当前外观的预设，不会立即打断当前页面配色。

导航、列表名称、播放文字和菜单选中项使用与正文有区别的有彩色强调；保留原版背景层次，不额外添加播放整行底板或导航选中色块。

## 安装与升级

从本仓库 [Releases](https://github.com/skyhc/lx-music-mobile/releases) 下载：

| 文件 | 用途 |
| --- | --- |
| `lx-music-mobile-v1.9.0-build87-ios-unsigned.ipa` | 已编译的未签名应用，需要使用自己的签名方式安装 |
| `LX-Music-v1.9.0-build87.xcarchive.zip` | Xcode 归档，用于后续自行签名、导出或开发检查 |
| `SHA256SUMS.txt`、`BUILD-METADATA.txt` | 校验下载完整性、源代码提交、构建编号和签名状态 |
| `BUILD87-VERIFICATION.json`、`build87-ui-evidence.zip` | 本次原生测试及界面验证证据 |

**下载完成不等于可以直接安装。** 当前 Release 不包含开发者证书、描述文件或可直接用于 TestFlight 的签名包；请使用自己有权使用的开发者身份和签名工具。覆盖升级前导出歌单 / 设置备份；不要通过卸载来完成普通升级。数据能否保留还取决于签名身份、应用标识及所用安装方式。

应用不内置可用音频源，也不托管歌曲音频。播放依赖你配置的自定义源或已有合法本地资源，外部源的可用性不属于本仓库构建通过的保证。

## 已验证范围

Build87 的 Actions #88 已完成全项目 TypeScript、CocoaPods、Release 模拟器编译及设备 Archive / IPA 打包。原生报告包含 **32 项在线检查、11 项离线 / 重启检查**，涵盖 MP3 / FLAC 连续快捷键 seek、音量、缓存切换、同步和进程重启；系统主题切换与重启报告通过。界面证据包含 **54 张原有截图 + 3 张新增主题截图**。

这些是 macOS / Xcode / iOS Simulator 环境的证据，**不代表完成 App Store 审核、TestFlight 分发、所有真实音源验证，或实体设备长时间听感和蓝牙兼容性验收**。

## 从源代码开发

代码与开发分支统一为 `master`。当前工程采用 React Native **0.73.11**、TypeScript，以及 Swift / Objective-C++ / C++ 原生模块。CI 的构建环境与完整检查步骤见 [iOS 工作流](.github/workflows/ios-ipa.yml)。

在安装完整 Xcode 的 macOS 上，按仓库锁文件准备 Node 与 Ruby / CocoaPods。当前 `.nvmrc` 固定 Node 18，CI 使用 Ruby 3.2；不要把更新到任意新版本当作等价环境。

```bash
git clone --branch master https://github.com/skyhc/lx-music-mobile.git
cd lx-music-mobile
nvm install
nvm use
npm ci
bundle install
(cd ios && NO_FLIPPER=1 bundle exec pod install --repo-update)
npm run ios
```

`npm ci` 会执行仓库需要的依赖补丁。不要跳过 postinstall，也不要用历史 Android 打包命令生成本项目的 iOS 发布包。仓库中的 `android/` 和历史脚本保留用于上游对照，不是本移植版的发布平台承诺。

提交修改时请同时提供复现步骤和验证证据。现有原生播放、同步、系统主题、截图及归档校验不能用语法检查或 mock 测试代替。

## 反馈与致谢

请到 [本仓库 Issues](https://github.com/skyhc/lx-music-mobile/issues) 提交移植版问题，附应用版本 / Build、设备型号、系统版本、窗口方向、复现步骤和脱敏日志。不要上传签名私钥、配对密码、音源密钥或私人歌单。请勿把本移植版特有问题直接转交上游维护者。

感谢 **lyswhut** 的 LX Music 移动版、桌面版与同步服务，感谢 **Q-1515** 的早期 iOS 移植，以及相关依赖的维护者。独立亮暗预设交互参考桌面版，再以 React Native / UIKit 方式适配，并非嵌入 Electron 页面。

项目保留 [Apache-2.0 LICENSE](LICENSE)；上游原始说明与协议文字保存在 [历史资料](docs/UPSTREAM_README.md)，第三方组件遵循各自随源码保留的许可。请尊重音乐版权，只使用有权访问的内容。
