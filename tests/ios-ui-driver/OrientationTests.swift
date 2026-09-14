import XCTest

// Test-only runner. Rotate the simulated DEVICE rather than asking a windowed
// application to change its interface orientation (UIKit rejects that request).
final class OrientationTests: XCTestCase {
    @MainActor
    private func rotate(_ orientation: UIDeviceOrientation, landscape: Bool) {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.skyhc.lxmusic")
        app.activate()
        XCUIDevice.shared.orientation = orientation
        let matches = NSPredicate { _, _ in
            let frame = app.frame
            return frame.width > 0 && frame.height > 0 && (frame.width > frame.height) == landscape
        }
        let result = XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: matches, object: app)], timeout: 15)
        XCTAssertEqual(result, .completed, "Real app viewport did not rotate: \(app.frame)")
        XCTAssertEqual(XCUIDevice.shared.orientation, orientation)
        let capture = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        capture.name = landscape ? "device-landscape" : "device-portrait"
        capture.lifetime = .keepAlways
        add(capture)
    }

    @MainActor func testLandscape() { rotate(.landscapeLeft, landscape: true) }
    @MainActor func testPortrait() { rotate(.portrait, landscape: false) }
}
