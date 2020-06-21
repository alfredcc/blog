---
title: iOS Keyboard Extension Tips
author: racechao
date: 2020-06-19 22:34:00 +0800
categories: [iOS]
tags: [ios, keyboard extension]
comments: ture
---

![keyboard_architecture_2x.png](https://user-gold-cdn.xitu.io/2020/6/18/172c78576a0f70ee?w=1240&h=942&f=png&s=43116)

Apple 在 iOS 8 里就引入了 Keyboard Extension，但网上相关但开发但资料很少，我在开发中也遇到了不少坑，为了给大家分享下这方面但知识，所以才有了这篇文章。
Custom Keyboard 要实现起来也非常简单，我们只需要在项目里新建一个 Custom Keyboard Extension 的 Target，Xcode 就自动会给我们创建一个 KeyboardViewController，开发者通过这个类就可以做简单的开发了。但是往往实际情况并没有那么简单。我们可能需要在键盘请求网络数据，或者和Containing App 通信等等，这时我们会遇到很多问题。这边文章我会讲述一下常见的问题和解法。

---

## 概要

- Extension 如何通讯
- 检测键盘是否已经添加
- 检测键盘是否激活
- 播放系统声音
- 检测是否已经获取（最高访问权限） RequestsOpenAccess
- 键盘切换方法

### Extension 如何通讯

![detailed_communication_2x.png](https://user-gold-cdn.xitu.io/2020/6/18/172c7857750786ab?w=1240&h=437&f=png&s=20772)


这是苹果官方给出的一张图，Containing App 是我们的主 App, Host app 是 Extension 所运行的第三方 App（比如微信），为了方便理解下面我们会把 Containing App 称为“主 App”，Host App 称为“第三方 App”。

总结如下：

1. App extension 无法直接与主 App 通信（简单的理解它们就是两个不同的进程，extension 启动了并不代表主App也会启动）
2. App extension 可以通过 open URL 和主 App通信，但这条链路只是单向的（因为App extension 没有 `openURL`  之类接受消息的入口）
3. 主 App 和 App extension 可以通过读写共同的文件资源来通信（比如 UserDefault, 前提需要加到同一个 `AppGroups` ）
4. 另外一个官方没提到的方法：可以用更底层的 DarwinNotify 来建立 Extension 和 Containing app 之间的通讯，可以参考下面的👇开源库

[choefele/CCHDarwinNotificationCenter](https://github.com/choefele/CCHDarwinNotificationCenter)

> 通过 App Groups 共同维护 UserDefault 是一种比较简单的通讯方法。但是开发者也需要注意的是如果我们的键盘没有获取到没有完全访问权限，键盘是只能读取，没法修改 UserDefault 的值的（如果这个 UserDefault 是 Containing app 创建的）。另外一点是 DarwinNotify 现在同样也需要完全访问权限了。

最后给大家一个忠告： 千万一定要在真机上调试！

### 检测键盘是否已经添加

```swift
var isKeyboardEnabled: Bool {
    guard let keyboards = UserDefaults.standard.object(forKey: "AppleKeyboards") as? [String] else {
        return false
    }
    return keyboards.contains("你的 extension bundle id")
}
```

 

### 检测键盘是否已经激活

键盘类型的应用往往有个需求是：当用户第一次切换到我们开发的 Keyboard，需要在主 App 显示欢迎👏图文或者开启引导流程。我们可以通过 `openURL` 的方式来通知主App。

```swift
// Step1: 在 keyboard 中调用
// 打开主APP，比如 openURL(scheme:"yourAppScheme://actived")
func openURL(scheme: String) {
	let url = URL(string: scheme)!
	let context = NSExtensionContext()
	context.open(url, completionHandler: nil)
	var responder = self as UIResponder?
	let selectorOpenURL = sel_registerName("openURL:")
	while (responder != nil) {
		if responder!.responds(to: selectorOpenURL) {
			responder!.perform(selectorOpenURL, with: url)
			break
		}
		responder = responder?.next
	}
}

// step2:
// app 在前台的时候接收通知
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
	if url.scheme == "yourAppScheme" && url.host == "actived" {
		// do something
	}
	return true
}
```

这里要注意的是openURL 会唤起主 App（如果主 App 不在前台），所以这里需要额外做判断。

### 播放系统声音

```swift
// 直接上代码
// 点击: SystemSoundID = 1123
// 删除按钮: SystemSoundID = 1155
// 系统键盘: SystemSoundID = 1156
AudioServicesPlaySystemSound(SystemSoundID)
```

### 检测是否已经获取（最高访问权限） RequestsOpenAccess



```swift
// Keyboard Extension
override var hasFullAccess: Bool {
	if #available(iOS 11.0, *) {
		return super.hasFullAccess// super is UIInputViewController.
	}
	if #available(iOS 10.0, *) {
		let original: String? = UIPasteboard.general.string
		UIPasteboard.general.string = " "
		let val: Bool = UIPasteboard.general.hasStrings
		if let str = original {
			UIPasteboard.general.string = str
		}
		return val
	}
	return UIPasteboard.general.isKind(of: UIPasteboard.self)
}
```

主 App 没有直接获取的方法，但我们可以通过上面提到的通讯方法，在 Keyboard Extension 中把状态传过去

### 全面屏幕隐藏切换 keyboard 按键

在全屏但设备系统会给我们默认提供切换键盘但按钮，所以我们开发的键盘就不需要提供此按钮了，我们可以通过以下方式来判断：

```swift
// needsInputModeSwitchKey
var needsSwitchKey: Bool {
	if #available(iOSApplicationExtension 11.0, *) {
		return needsInputModeSwitchKey
	} else {
		return true
	}
}
```

---

### 其他资料

[Custom Keyboard](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW4)

[Custom Keyboards - Extensions - iOS - Human Interface Guidelines - Apple Developer](https://developer.apple.com/design/human-interface-guidelines/ios/extensions/custom-keyboards/)