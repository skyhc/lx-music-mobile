# iPad 横屏播放器修改与未完成项

基线：`ipad-landscape`，`d9cf9f3b881b1ab45674662977f8ca9be3c21655`（Build 77）。
本次不修改版本号、不签名、不生成 IPA、不自动合并。

## 已实现的代码修改

- 收起箭头固定在左侧，取消原先由窗口尺寸判断产生的 88 点横向避让。
- PageContent 统一保留 iOS 原生安全区域；增加共享 WindowContent。iPad 顶部至少保留 36 点窗口控制区域，只补足原生安全区域不足的部分，不做横向移动。
- 横屏播放器删除重复的内层 PageContent / StatusBar。外层继续负责背景与安全区域，Android 原有状态栏高度处理保留。
- 上部封面与歌词分栏，歌曲名 / 歌手在封面下方；封面按父容器实际剩余高度等比缩放。
- 底部改成通栏进度条、时间、状态文字、两行按钮。第一行：模式、上一曲、播放/暂停、下一曲、播放列表。第二行：评论、音效、收藏/添加、定时、设置。
- 播放列表入口复用现有 getList / playListById；显示当前播放来源列表，不声称它是重新计算后的随机队列或“稍后播放”完整队列。下载列表受现有 getList 的限制可能为空。
- 设置、音效面板从左侧出现，音效改为适合侧边宽度的 stacked 排列；侧边 Popup 也使用共享安全区域。收藏与定时仍使用项目原有确认框，本次没有把确认框改造成侧边编辑页。

## 未完成：音频持久缓存

本次没有提交音频缓存修复，不能用这一版本宣称“重启缓存已修好”。
已确认的代码事实：

1. `src/plugins/player/index.ts` 读取 `player.cacheSize` 并向 TrackPlayer 传入 `maxCacheSize`，项目并非完全没有缓存配置。
2. `src/plugins/player/utils.ts` 存在旧 TrackPlayer 目录迁移逻辑，目标为 `temporaryDirectoryPath + '/TrackPlayer'`。必须进一步核对 iOS 的实际路径映射，不能只根据变量名就认定它每次启动被清空。
3. `src/plugins/player/nativeFlac.ts` 的自定义无损播放分支只接受 HTTP(S)；本地文件分支会抛出 `Native local FLAC playback is disabled`。这不等同于系统 TrackPlayer 完全不能播放本地 FLAC。
4. `src/plugins/player/engine/resourceLoader.ts` 把无损音质交给自定义原生引擎，其余走 TrackPlayer，两条链路必须分别检查。
5. `ios/LxMusicMobile/AppDelegate.mm` 的 StreamingFlacPlayerModule 使用 streamData 保存压缩流，openStream 创建新的 NSURLSession 请求。现有读取片段没有提供“按歌曲/音质稳定标识查找已完成音频文件”的闭环。NSURLSession 自带 HTTP 缓存是否生效仍取决于实际响应和配置，不能据此宣称全部请求完全没有任何缓存。

### 缓存后续必须完成的工程验收

沿用现有播放引擎，不以强行换成另一套引擎掩盖问题。检查音频文件落盘、完整性标记、索引持久化、启动恢复和播放命中；缓存键区分来源、歌曲 ID、实际音质，不能仅依赖会过期的 URL。完整缓存应先于联网解析音源命中；半成品不能当作完整缓存。保留容量配置、明确淘汰策略、手动清理，并防止清理后异步任务又把旧缓存写回。

至少验证：普通音质、FLAC；完整播放后关闭进程并断网重开；URL 更新；切换音质；缓存只完成一部分；文件缺失/损坏；超出容量；清理时仍在缓冲；更新安装但不卸载。用文件大小、缓存命中记录、网络请求结果证明命中，不以“看起来起播更快”作为唯一证据。

## 验证边界

`node scripts/check-ipad-player-layout.js` 只做 TypeScript/TSX 语法检查、纯函数与源代码布局规则检查，不等同于全项目 TypeScript 类型检查、Metro 构建、Xcode 编译或真机 UI 验收。

本环境没有运行 Xcode、iPad 模拟器、真机、签名 IPA 或缓存重启测试。36 点是集中管理的保守避让值，不是读取 iPadOS 26 窗口控件实际几何信息的原生实现。全屏、浮动窗口、窗口缩放、系统控件显示/隐藏、软键盘、11/13 英寸 iPad 都还需要截图验证；必要时用系统窗口控件适配布局指南替换这个回退值，仍保持只做纵向避让。

不得标记本轮五项需求全部完成。应先审阅草稿 PR、完成构建与真机回归，再合并。
