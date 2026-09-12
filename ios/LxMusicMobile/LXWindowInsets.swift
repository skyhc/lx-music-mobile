import UIKit
import React

// iPadOS owns the window buttons. Only report vertical content clearance.
@objc(LXWindowInsetsView)
final class LXWindowInsetsView: UIView {
  @objc var onInsetsChange: RCTDirectEventBlock?
  private var lastTop: CGFloat = -1
  private var lastBottom: CGFloat = -1
  private var scheduled = false

  override func layoutSubviews() { super.layoutSubviews(); scheduleInsets() }
  override func safeAreaInsetsDidChange() { super.safeAreaInsetsDidChange(); scheduleInsets() }
  override func didMoveToWindow() { super.didMoveToWindow(); scheduleInsets() }

  private func scheduleInsets() {
    guard !scheduled else { return }
    scheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.scheduled = false
      guard self.window != nil, let emit = self.onInsetsChange else { return }
      var insets = self.safeAreaInsets
      if #available(iOS 26.0, *) {
        let adapted = self.edgeInsets(for: .safeArea(cornerAdaptation: .vertical))
        insets.top = max(insets.top, adapted.top)
        insets.bottom = max(insets.bottom, adapted.bottom)
      }
      guard abs(insets.top - self.lastTop) > 0.1 || abs(insets.bottom - self.lastBottom) > 0.1 else { return }
      self.lastTop = insets.top
      self.lastBottom = insets.bottom
      emit(["top": max(0, insets.top), "bottom": max(0, insets.bottom)])
    }
  }
}

@objc(LXWindowInsetsManager)
final class LXWindowInsetsManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { return true }
  override func view() -> UIView! {
    let view = LXWindowInsetsView()
    view.backgroundColor = .clear
    view.isUserInteractionEnabled = false
    view.isAccessibilityElement = false
    return view
  }
}
