#import <UIKit/UIKit.h>

#import "AppDelegate.h"

static NSString * const LXKeyboardRemoteCommandNotificationName = @"LXRemoteCommand";

static void LXPostKeyboardCommand(NSString *command)
{
  if (command.length == 0) return;
  [[NSNotificationCenter defaultCenter]
    postNotificationName:LXKeyboardRemoteCommandNotificationName
    object:nil
    userInfo:@{ @"command": command }];
}

@interface LXApplication : UIApplication
@end

@implementation LXApplication

- (NSArray<UIKeyCommand *> *)keyCommands
{
  NSMutableArray<UIKeyCommand *> *commands = [NSMutableArray arrayWithArray:[super keyCommands] ?: @[]];

  UIKeyCommand *toggle = [UIKeyCommand keyCommandWithInput:@" " modifierFlags:0 action:@selector(lx_togglePlayback:)];
  toggle.discoverabilityTitle = @"播放/暂停";
  [commands addObject:toggle];

  UIKeyCommand *previous = [UIKeyCommand keyCommandWithInput:UIKeyInputLeftArrow modifierFlags:UIKeyModifierCommand action:@selector(lx_previousTrack:)];
  previous.discoverabilityTitle = @"上一曲";
  [commands addObject:previous];

  UIKeyCommand *next = [UIKeyCommand keyCommandWithInput:UIKeyInputRightArrow modifierFlags:UIKeyModifierCommand action:@selector(lx_nextTrack:)];
  next.discoverabilityTitle = @"下一曲";
  [commands addObject:next];

  UIKeyCommand *search = [UIKeyCommand keyCommandWithInput:@"1" modifierFlags:UIKeyModifierCommand action:@selector(lx_openSearch:)];
  search.discoverabilityTitle = @"搜索";
  [commands addObject:search];

  UIKeyCommand *songList = [UIKeyCommand keyCommandWithInput:@"2" modifierFlags:UIKeyModifierCommand action:@selector(lx_openSongList:)];
  songList.discoverabilityTitle = @"歌单";
  [commands addObject:songList];

  UIKeyCommand *leaderboard = [UIKeyCommand keyCommandWithInput:@"3" modifierFlags:UIKeyModifierCommand action:@selector(lx_openLeaderboard:)];
  leaderboard.discoverabilityTitle = @"排行榜";
  [commands addObject:leaderboard];

  UIKeyCommand *favorites = [UIKeyCommand keyCommandWithInput:@"4" modifierFlags:UIKeyModifierCommand action:@selector(lx_openFavorites:)];
  favorites.discoverabilityTitle = @"收藏";
  [commands addObject:favorites];

  UIKeyCommand *settings = [UIKeyCommand keyCommandWithInput:@"," modifierFlags:UIKeyModifierCommand action:@selector(lx_openSettings:)];
  settings.discoverabilityTitle = @"设置";
  [commands addObject:settings];

  return commands;
}

- (void)lx_togglePlayback:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"toggle");
}

- (void)lx_previousTrack:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"previous");
}

- (void)lx_nextTrack:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"next");
}

- (void)lx_openSearch:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"nav_search");
}

- (void)lx_openSongList:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"nav_songlist");
}

- (void)lx_openLeaderboard:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"nav_top");
}

- (void)lx_openFavorites:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"nav_love");
}

- (void)lx_openSettings:(UIKeyCommand *)command
{
  LXPostKeyboardCommand(@"nav_setting");
}

@end

int main(int argc, char *argv[])
{
  @autoreleasepool {
    return UIApplicationMain(argc, argv, NSStringFromClass([LXApplication class]), NSStringFromClass([AppDelegate class]));
  }
}
