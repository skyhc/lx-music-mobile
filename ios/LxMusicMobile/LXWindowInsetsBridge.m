#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(LXWindowInsets, LXWindowInsetsManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, RCTDirectEventBlock)
@end
