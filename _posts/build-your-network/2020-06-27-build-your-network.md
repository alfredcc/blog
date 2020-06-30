---
title: 如何设计你的网络请求
author: racechao
date: 2020-06-28 00:34:00 +0800
description: build your network architecture
tag:
  - ios
  - networking
  - RxSwift
---

## 概述
几乎所有的项目都需要网络请求，因为他可以给用户呈现更加丰富的内容，方便我们在不同设备之间管理同步数据。网络请求会出现在你项目的各个地方：启动页，列表页，登录注册...所以如何管理组织网络请求是 App 架构中非常重要的一部分。Github 上也有类似的框架比如 `Moya`, 我们且称其为网络框架的框架吧。`Moya` 也有这个框架也发展了很久了，功能很强大，社区也一直很活跃，也有衍生的 `RxMoya` 和 `ReactiveMoya` 。但我在使用过后发现他过于 `重` 了，一直觉得他那种 `path` + `method` + `parameter` 拆开的写法太过于繁琐，那么本文就让我们来一步步搭建适合自己的网络框架吧。

> 提示：为了方便和通用，我们的网络请求 API 就直接基于 Alamofire 来写好了。

## 方法
首先我们来看看最简单的请求长什么样？
```swift
AF.request("https://httpbin.org/get").response { response in
    debugPrint(response)
}
```
非常简单对不对？但现实并不是这样，在一个请求中我们需要处理各种疑难杂症，最终一个请求的代码可能会很长很长（长到一个屏幕都放不下！），所以我们要尽量抽象和复用这里的逻辑。

如何下手呢？解决一个问题的最常用的方法就是先看清楚问题，然后把大问题拆成小问题，再一个个解决。我们先来思考下🤔，一个完整请求要做的事情什么：
1. 将 url，method，body 封装成一个 `HTTP Request` 对象，
2. 设置请求的 `HTTP Header `
3. 接受 `HTTP Request` 回来的 data 数据
4. 处理 error 和 response code
5. 通过 `codable` 之类的框架将 raw data 转换 model 对象
6. 请求重试

在常规的业务中，2、3、4、5 往往是可以统一抽象处理的，而最常见做法就是用一个 `HTTPClient` 或 `APIManager` 来统一 handle 这类逻辑了。而对于 `1` 每个请求的参数、地址、方法都不一样所以我们还是会将他们暴露出去，最终大概长这样：

> warning：下面方法只是替提供思路，部分代码被省略

```swift
class HTTPClient {
  
  var host: String
  
  init(host: String) {
    self.host = host
  }
  
  // 设置 timeout
  private let sessionManager: SessionManager = {
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = 15
    let sessionManager = SessionManager(configuration: config)
    return sessionManager
  }()
  
  // 设置 HTTPHeaders
  private var defaultHeader: HTTPHeaders = {
    var defaultHTTPHeaders = SessionManager.defaultHTTPHeaders
    defaultHTTPHeaders["User-Agent"] = "You device user agent"
    defaultHTTPHeaders["Accept-Encoding"] = acceptEncoding
    // 在 header 中添加 token 
    return defaultHTTPHeaders
  }()
}

extension HTTPClient {
  @discardableResult
  func requestObject<T: Codable>(path: String,
                                 method: Alamofire.HTTPMethod = .get,
                                 parameters:[String:Any?]?,
                                 handler: @escaping (T?, Error?) -> Void) -> Request {
    // json -> model
    return buidRequest(path: path, method: method, parameters: parameters) { [weak self](dataSource, error) in
      if let error = error {
        handler(nil, error)
        return
      }
      // 通过 `codable` 框架将 raw data 转换 model 对象
      do {
        let model = try dataSource.data?.mapObject(Response<T>.self).data
        handler(model, nil)
      } catch let error {
        let parseError = HTTPClientError(code:.decodeError,localDescrition:"parse_error".localized)
        self?.showDecodingError(path: path, error: error)
        handler(nil, parseError)
      }
    }
  }
}

// MARK: - Private Methods
private extension HTTPClient {
  /// note: data used by codable
  typealias CompletionHandler = ((data: Data?, result: Any?), Error?) -> Void
  
  @discardableResult
  private func buidRequest(path:String,
                           method: Alamofire.HTTPMethod,
                           parameters:[String:Any?]?,
                           handler: @escaping CompletionHandler) -> Request {
    
    // filter nil value
    let validParas = parameters?.compactMapValues { $0 }
    let request = sessionManager.request(host + path, method: method, parameters: validParas, headers: defaultHeader)
    return request.responseJSON { response in
      // 4. 处理 error 和 response code
      self.handelResponse(response: response, handler: handler)
    }
  }
}
```

最后我们发起请求的方法大概长这样：
```swift
static func auth(from: String, token: String) -> AuthResult? {
  let path = "wp-json/wc/v3/third/party/access/token"
  let parameters = ["from": from, "third_access_token": token]
  return HTTPClient.shared.requestObject(path: path, parameters: parameters)
}
    
```

## 如何支持 RxSwift

```swift
extension HTTPClient: ReactiveCompatible {}

extension Reactive where Base: HTTPClient {
  /// Designated request-making method.
  ///
  /// - Parameters:
  ///   - path: url path
  ///   - parameters: A dictionary of parameters to apply to a `URLRequest`
  /// - Returns: Response of singleobject.
  func requestObject<T: Codable>(path:String, method: HTTPMethod = .get, parameters:[String:Any?]?) -> Single<T?> {
    
    return Single.create { single in
      let request = self.base.requestObject(path: path, method: method, parameters: parameters, handler: { (model: T?, error) in
        if let error = error {
          single(.error(error))
        } else {
          single(.success(model))
        }
      })
      
      return Disposables.create {
        request.cancel()
      }
    }
  }
}
```

## 重试和请求合并
得益与 RxSwift 重试和请求合并非常简单。
```swift 
// 请求合并
Observable.zip(request1, request2, request3)
  .subscribe(onNext: { (resp1, resp2, resp3) in
  })
  .disposed(by: disposeBag)

// 请求重试 
HTTPClient.rx.user()
  .asObservable()
  .catchErrorJustReturn(nil)
  .retry(3, delay: .constant(time: 3))
  .disposed(by: disposeBag)

// RxSwift+Retry
enum DelayOptions {
  case immediate
  case constant(time: Double)
  case exponential(initial: Double, multiplier: Double, maxDelay: Double)
  case custom(closure: (Int) -> Double)
}

extension DelayOptions {
  func make(_ attempt: Int) -> Double {
    switch self {
    case .immediate: return 0.0
    case .constant(let time): return time
    case .exponential(let initial, let multiplier, let maxDelay):
      // if it's first attempt, simply use initial delay, otherwise calculate delay
      let delay = attempt == 1 ? initial : initial * pow(multiplier, Double(attempt - 1))
      return min(maxDelay, delay)
    case .custom(let closure): return closure(attempt)
    }
  }
}
/// 主要是用于网络请求的重试，可以设置重试次数，重试之间的间隔，以及有网络开始重试的逻辑
/// reference:http://kean.github.io/post/smart-retry
extension ObservableType {
  /// Retries the source observable sequence on error using a provided retry
  /// strategy.
  /// - parameter maxAttemptCount: Maximum number of times to repeat the
  /// sequence. `Int.max` by default.
  /// - parameter didBecomeReachable: Trigger which is fired when network
  /// connection becomes reachable.
  /// - parameter shouldRetry: Always returns `true` by default.
  func retry(_ maxAttemptCount: Int = Int.max,
             delay: DelayOptions,
             didBecomeReachable: Observable<Void> = Reachability.shared.didBecomeReachable,
             shouldRetry: @escaping (Error) -> Bool = { _ in true }) -> Observable<Element> {
    return retryWhen { (errors: Observable<Error>) in
      
      return errors.enumerated().flatMap { attempt,error -> Observable<Void> in
        guard shouldRetry(error),
          maxAttemptCount > attempt + 1 else {
            return .error(error)
        }
        let timer = Observable<Int>
          .timer(RxTimeInterval.seconds(Int(delay.make(attempt + 1))),
                 scheduler: MainScheduler.instance)
          .map { _ in () }
        
        return Observable.merge(timer, didBecomeReachable)
      }
    }
  }
}

```
## 总结

对我来说要做好一份适用性很强的网络架构不是一件很容易的事情，实际上网络请求的复杂度远远不止于此，这里做的仅仅是把一些通用逻辑统一处理，还有很多本文没有讲到。比如
1. 如何用单一功能原则（Single responsibility principle）优化这里的逻辑
2. 当我们遇到服务端返回的不标准的数据结构怎么处理？
3. 使用 `Codable` 区分返回的是 Array 还是 Object 是要不同处理的
4. 当我们有多个 API 地址比如测试环境和正式环境，那么我们如何去管理？
都是我们需要去解决的。我当初也踩了无数坑，太难了。
这些问题先留给大家思考吧😆


   
## 参考

最后还是大力推荐下喵神在台湾 iPlayground 的演讲
https://speakerdeck.com/onevcat/wang-lu-zhi-nan-nan-yu-shang-qing-tian-iplayground-2019?slide=143

https://www.youtube.com/watch?v=Xk4HZfW6vK0


