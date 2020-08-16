---
title: 博客优化和迁移，我却采坑了个大坑
author: racechao
date: 2020-08-16
tag:
  - ios
  - keyboard extension
---
![Cloudflare architecture](/assets/img/github-actions.jpg)

因为之前博客一直用的 [netlify](https://netlify.com/) 托管，测试了一段时间，访问速度不是很理想，基本等于不可用的状态。所以就趁这个周末，把网址迁移到 Github Pages。

# Build 脚本迁移到 Github Actions
一直听说 Github Actions 挺香的，而且有免费 2000 分钟的额度，故打算将 `Build` 从 `Netlify` 迁移 `Github Actions`.

迁移过程也挺简单的，具体可以参考[Jekyll 的官方教程](https://jekyllrb.com/docs/continuous-integration/github-actions/)
1. 在 .github/workflows 目录下创建 github-pages.yml 文件
2. 打开文件并输入已下内容

```yaml
name: Build and deploy Jekyll site to GitHub Pages

on:
  push:
    branches:
      - master

jobs:
  github-pages:
    runs-on: ubuntu-16.04
    steps:
      - uses: actions/checkout@v2
      - uses: helaili/jekyll-action@2.0.1
        env:
          JEKYLL_PAT: ${{ secrets.JEKYLL_PAT }}
```
> 这里会自动将生成的静态博客文件 push 到 hg-page 分支
> 并且每次 build 完之后会清空之前的所有文件

# 自定义域名

#### 1. 购买域名
`Github Pages` 支持自定义域名，因为 `Github Pages` 免费的域名看起来不太爽，而且自己的博客当然得有自己的域名。于是去 [namecheap](namecheap.com) 上购买域名，这里吐槽下 GoDaddy 啃爹定价策略，第一年的价格虽然看起来还可以，但仔细看你会发现第二签续费贼坑。而且 namecheap 还可以在网上收集到 `promo code` 可以优惠不少。

#### 2. 域名解析托管

`Cloudflare` 就不用多介绍了，购买完域名的第一件事就是将域名解析服务迁移到 `Cloudflare`，另外 `Cloudflare` 提供免费的 ssl 证书所以就不用再自己创建 `Let's Encrypt` 的 ssl 证书了。
这里最主要的一步就是在 DNS 解析中配一条 `CANME` 指向我的 `Github Page` 的记录即可。

#### 3. Github Pages 自定义域名配置
方案一：然后就是在项目 `Setting` 里面修改 `GitHub Pages ` 的自定义域名如下：
![img](/assets/img/github-pages.png)

方案二：在项目根目录添加 `CNAME` 文件，在里面输入自定义域名 `jiechaoz.com`。`GitHub Pages` 会自动检测这个文件去设置自定义域名
> 注意 CNAME 里面只有一条记录可以生效，换句话说你只能输入一个自定义域名地址

#### 4. 强制开启 HTTPS
因为安全策略，我开了 `Surge` 用 `Chrome` 在访问 HTTP 网页的时候会报错，所以需要强制将将 HTTP 跳转到 HTTPS。如果我们网站有 `Nginx` 的话，简单配个规则就行了，但是我的博客是托管在 `Github Pages` 上的，那就得试试其他办法。`Github Pages` 可以强制开启 HTTPS，但似乎得需要自己申请 `Let's Encrypt`（默认是不可选的），最后 Google 了一下，其实我们配个 meta 标签就行了。
```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
```

# CANME 的坑
这个真是被自己坑到了，因为上面说到我们用的 Github Action 配置每次 build 会把 gh-pages 分支所有文件清空，所以之前添加的 CNAME 在执行完后就不见了，网上搜了一圈发现解决办法是只要在主分支根目录创建一个 CNAME 就可以了，每次执行完后会自动拷贝到 gh-pages 分支下，但我试了好几次并没发现 CNAME 被拷贝，也尝试自己修改 Github Actions 脚本，直接执行 `touch CNAME&echo "jiechaoz.com" > CNAME` 发现也没效果。试了好久最后发现自己在 Jekyll `_config.yml` 配置文件下把 CNAME 给 exclude 掉了。

最后大功告成！
测试了下速度，基本访问速度在 1s 之内，比之前 [netlify](https://netlify.com/) 快多了。
