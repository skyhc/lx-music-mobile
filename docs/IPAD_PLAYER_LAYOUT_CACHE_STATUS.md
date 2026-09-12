# iPad 横屏播放器修改与未完成项

原基线：`ipad-landscape`，`d9cf9f3b881b1ab45674662977f8ca9be3c21655`（Build 77）。
继续修改分支：`codex/ipad-player-layout-cache-review`。
本轮 UI 提交：`4119f3336d4a976ff47e00f1ebce43d58e0f656a`。
不修改版本号，不签名，不生成 IPA，不自动合并。

## 本轮 UI 代码修改

1. `WindowContent` 在 iPad 上使用不可交互的 SafeAreaView 测量垂直安全区；可见内容使用普通 View，不继承原生横向 padding。收起箭头不再因为该安全区而横移。
2. 顶部内容起点为 `max(原生顶部安全区, 36) + 4` 点；底部保留原生安全区。36 点是集中管理的回退值，不是系统窗口按钮实际几何测量。红绿灯由系统控制，本轮不移动系统按钮。
3. `PageContent` 和侧边 `Popup` 已共用 WindowContent，本轮规则随之作用于这些页面。未作脱离该公共容器的每个独立原生窗口的视觉验收。
4. 横屏播放器恢复左右双栏：左栏封面、歌曲名、歌手、进度和两行按钮；右栏歌词。左栏宽度为 48%，歌词使用剩余空间。控制区不再占用底部通栏，左右内边距收紧。
5. iPad 横屏的通用 Popup 统一取左侧位置，不再随调用方的 bottom/right 参数变化。iPhone、Android 和竖屏保持调用方位置。原有收藏、定时确认框仍是确认框，不把它们改造成设置编辑面板。

保留现有屏幕唤醒生命周期、播放控制、歌词逻辑和解码引擎。封面继续使用实际剩余空间缩放。播放列表入口仍显示来源列表，不声称是完整的随机队列或稍后播放队列。

## 未完成：音频持久缓存

本轮没有提交缓存实现，不得宣称“重启缓存已修复”。

已读取的代码事实：
- `src/plugins/player/index.ts` 读取 `player.cacheSize`，并向 TrackPlayer 传入 `maxCacheSize`。
- `src/plugins/player/utils.ts` 有旧 TrackPlayer 目录迁移逻辑，目标为 `temporaryDirectoryPath + '/TrackPlayer'`；变量名本身不能证明 iOS 每次启动清空该目录。iOS 缓存统计与清理依赖 NativeTrackPlayerModule 对应方法。
- `src/plugins/player/nativeFlac.ts` 的自定义无损播放入口仅接受 HTTP(S)，本地地址会抛出 `Native local FLAC playback is disabled`。不能仅保存音频文件就认为这条播放链已经支持缓存命中。

还需要实现或核实：音频落盘、完整性标记、来源/歌曲 ID/实际音质隔离的索引、重启恢复、播放前本地命中、容量淘汰与清理并发控制。完整缓存应先于联网解析音源命中，半成品不可作为完整文件使用。应分别测试 TrackPlayer 与自定义 FLAC 路径，而不是强行更换解码引擎。

缓存验收必须包括：普通音质与 FLAC、关闭进程后断网重开、URL 更新、音质切换、半成品、文件丢失/损坏、容量上限、缓冲中清理、更新安装但不卸载。需要文件、命中日志与网络请求证据。

## 已执行验证与边界

本轮执行 `node scripts/check-ipad-window-layout.js`：8 项定向检查通过，包含 4 个修改文件的 TS/TSX 转译语法检查，以及垂直留白、无横向避让、双栏归属、Popup 位置 4 组源码/纯函数检查。

同时更新既有 `scripts/check-ipad-player-layout.js` 的顶部留白预期与 StyleSheet 测试替身；本轮没有在完整仓库安装依赖后重跑该旧脚本。

这些不是全项目类型检查、Metro 构建、Xcode 编译或截图验收。本轮没有生成 IPA，没有完成 iPad 真机/模拟器验证，也没有完成音频缓存重启测试。

合并前需要验证全屏/浮动窗口/缩放/系统控件显示隐藏、软键盘、大字体与横竖屏切换；核对按钮热区、歌词与进度拖动、播放列表、设置和音效。缓存问题保持未完成状态，不得据本轮 UI 检查关闭。
