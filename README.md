# cuber-debug.github.io
A small website created by a newbie, welcome to play!

[我的博客链接](https://www.cnblogs.com/accuber/p/19069415)

# 表单提交与数据存储系统

一个初步的前后端一体化表单系统，支持用户信息收集、数据验证、MySQL数据库存储和结果反馈，结合内网穿透技术实现公网访问。

## 项目概述

该系统通过前端HTML表单收集用户信息，经过Express后端服务器进行数据验证后存储到MySQL数据库。支持本地开发环境和公网访问，具备自动建表、数据校验、跨域支持等核心功能，非常适合个人学习或小型信息收集场景。

## 技术栈

| 模块     | 技术/工具          | 作用描述                                   |
| -------- | ------------------ | ------------------------------------------ |
| 前端     | HTML5 + JavaScript | 提供表单界面和前端数据验证                 |
| 后端     | Node.js + Express  | 处理服务器逻辑和业务请求                   |
| 数据库   | MySQL 8.0.11       | 实现数据的持久化存储                       |
| 网络访问 | cors + natapp 隧道 | 解决跨域问题，通过内网穿透提供公网访问能力 |

## 核心功能

- **双重数据验证**：前端实时校验结合后端二次验证（必填项检查、密码长度验证、昵称唯一性检查）
- **智能数据库管理**：系统首次启动时自动创建数据表结构，缺失字段时自动重建
- **多环境访问支持**：同时支持本地访问和通过natapp隧道的公网访问

## 界面预览

### 网页页面

![网页页面](https://img2024.cnblogs.com/blog/3580909/202509/3580909-20250902092659374-993960482.png)

### MySQL页面

![MySQL页面](https://img2024.cnblogs.com/blog/3580909/202509/3580909-20250902092926855-1061971567.png)

## 公网访问与跨域配置

### 内网穿透配置（natapp）

通过natapp.cn隧道服务实现公网访问功能：

- 功能：将本地服务（localhost:80）映射到临时公网域名（例如：http://n8c9d43f.natappfree.cc）
- 配置方法：需要在natapp官网注册账号并获取隧道域名，随后替换代码中的公网地址配置

### 跨域支持配置

为同时支持本地和公网访问，在server.js中配置了跨域规则：

```javascript
app.use(cors({
  origin: [
    'http://localhost:80',                 // 本地访问地址
    'http://n8c9d43f.natappfree.cc'        // natapp公网域名（请替换为您的实际隧道域名）
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
```

> **重要提示**：如果更换了natapp隧道服务，需要同步更新上述origin配置中的公网域名

## 快速开始指南

### 环境要求

- Node.js v12 或更高版本
- MySQL 8.0.11 数据库
- natapp隧道服务（可选，仅公网访问时需要）

### 安装和运行步骤

1. 克隆项目仓库并安装依赖包：

```bash
git clone git@github.com:cuber-debug/cuber-debug.github.io.git
cd cuber-debug.github.io
npm install express mysql2 cors
```

2. 配置数据库连接信息（编辑env.js文件）：

```javascript
module.exports = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'root',
  DB_PASSWORD: '您的MySQL密码',  // 请修改为实际的数据库密码
  DB_NAME: 'my_form_db'
};
```

3. 启动服务器：

```bash
node server.js
```

4. 访问应用：

- 本地访问：`http://localhost/learning.html`
- 公网访问：`http://您的natapp域名/learning.html`

## 项目文件结构

```
cuber-debug.github.io/
├── public/
│   └── learning.html      # 前端表单页面
├── server.js              # 后端服务器主文件（包含路由和数据库逻辑）
├── env.js                 # 数据库连接配置文件
└── README.md              # 项目说明文档
```

## 常见问题解答

- **数据库连接失败**：请检查MySQL服务状态和密码是否正确
- **跨域访问错误**：确认server.js中origin配置包含当前访问域名
- **端口占用问题**：可以修改server.js中的PORT变量（默认使用80端口）

