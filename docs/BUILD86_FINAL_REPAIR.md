# Build 86 续修核验

基线：be61344f82e77206b4a1b4062124e1d57804f34c；失败任务 Actions #73，run 34832416384。

## 同步失败

取回 playback-online.json：原生异步加密、首次配对、初次压缩列表、双向实时变更通过；重连报 Error: 列表已移除。冷进程随后报告 peer rename lost after restart。本次尚未执行到MP3播放，不继续引用旧任务的MP3失败作为本次原因。

使用生产 storage.ts、listManage.ts、ListEvent 确定性复现：saveData 删除元数据键后尚未完成 multiSet 的间隙，getUserLists 把空磁盘结果写回活目录。原代码得到空列表而非仍应保留的列表。这种错误快照可能在重连时被解释为用户删除。

修复：启动一次初始化、并发读取去重、迟到读取版本保护；同步快照与持久化修改共用串行队列并深拷贝。保留已删除列表旧请求拒绝和同步方向选择。新增六项实际存储竞争回归，旧代码首项稳定失败、修复后通过。

## 截图失败

ui-tablet-table.json 报 The current windowing mode does not allow for programmatic changes to interface orientation. 应用程序的场景旋转请求被窗口管理拒绝，与主题颜色断言无关。

改用独立CI XCTest bundle，通过 XCUIDevice.shared.orientation 旋转模拟设备，之后仍核对实际窗口宽高、设备类型、色差及54份PNG和运行记录。生产Info.plist、场景、Dimensions不伪造或改成测试专用模式，不旋转已生成图片。

## 验证范围

导航/标题多余底色撤回、主题自适应播放文字、原有多选底色、键盘居中配置、设置说明及认证保留。修改的同步快照文件从未修改指纹名单移出，改用新增行为检查，其余认证/音频/缓存/Scene指纹继续检查。此文件不预写新的Actions成功，最终以实际原生、截图和产物校验为准。
