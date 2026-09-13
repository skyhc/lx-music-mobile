import UIKit
import React

// Measure in window coordinates and subtract the content root's existing origin.
// Never reposition system views or add another titlebar to an already-inset root.
@objc(LXWindowInsetsView)
final class LXWindowInsetsView: UIView {
  @objc var onInsetsChange: RCTDirectEventBlock? { didSet { scheduleInsets() } }
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
      guard let window = self.window, let emit = self.onInsetsChange else { return }
      var insets = window.safeAreaInsets
      if #available(iOS 26.0, *) {
        insets = window.edgeInsets(for: .safeArea(cornerAdaptation: .vertical))
      }
      let region = self.convert(window.bounds.inset(by: insets), from: window)
      let top = max(0, region.minY - self.bounds.minY)
      let bottom = max(0, self.bounds.maxY - region.maxY)
      guard abs(top - self.lastTop) > 0.1 || abs(bottom - self.lastBottom) > 0.1 else { return }
      self.lastTop = top
      self.lastBottom = bottom
      emit(["top": top, "bottom": bottom])
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
