# 部署手册（自托管 Docker · home-103 · amireux.chat）

> 面向运维 LLM 或人工运维。生产环境跑在 home-103，源码托管 GitHub，走 Cloudflare Tunnel 对外。

---

## 架构一览

```
本地开发 → push GitHub → home-103 git pull → docker build → restart
                                    ↓
                    Cloudflare Tunnel → Traefik → aletheia-core-next-portal:3000
                                                        ↓
                                         aletheia-core-mongodb-nextportal:27017
```

---

## 一、本地开发

`.env` 使用内网 MongoDB（同一局域网即可访问）：

```
DATABASE_URL=mongodb://next_admin:<password>@192.168.1.103:27017/next_portal?authSource=admin
PAYLOAD_SECRET=<同生产>
NEXT_PUBLIC_SERVER_URL=https://amireux.chat
CRON_SECRET=任意值
PREVIEW_SECRET=任意值
```

启动：

```bash
npm run db:ping      # 验证 MongoDB 连通（5秒超时）
npm run dev:lite     # 日常开发
npm run dev:admin    # 需要进后台时
```

> `.env` 不提交 git（已加入 .gitignore）。

---

## 二、生产部署（home-103）

### IaC 路径

```
/data/aletheia/Aletheia-Ops/deployments/next-portal/
├── docker-compose.yml
├── .env              # 不在 git，运行时注入
└── README.md
```

### 运行时 .env（与本地区别：用容器名而非 IP）

```
DATABASE_URL=mongodb://next_admin:<password>@aletheia-core-mongodb-nextportal:27017/next_portal?authSource=admin
PAYLOAD_SECRET=<同本地>
NEXT_PUBLIC_SERVER_URL=https://amireux.chat
CRON_SECRET=<随机值>
PREVIEW_SECRET=<随机值>
```

---

## 三、更新部署（GitHub 工作流）

在 home-103 的构建目录执行：

```bash
cd /data/aletheia/build/next-portal && git pull && docker build --network=host -t amireux-portal:latest . && cd /data/aletheia/Aletheia-Ops/deployments/next-portal && docker compose up -d --force-recreate
```

> **必须用 `--network=host`**：`next build` 阶段 Payload CMS 会连接 MongoDB，builder 容器需要通过 `127.0.0.1:27017` 访问宿主机上的 MongoDB。

### 首次克隆（仅需一次）

```bash
cd /data/aletheia/build && git clone <your-github-repo-url> next-portal
```

克隆后在构建目录创建 build-time `.env`（用 `127.0.0.1`）：

```
DATABASE_URL=mongodb://next_admin:<password>@127.0.0.1:27017/next_portal?authSource=admin
PAYLOAD_SECRET=<同生产>
NEXT_PUBLIC_SERVER_URL=https://amireux.chat
CRON_SECRET=<随机值>
PREVIEW_SECRET=<随机值>
```

---

## 四、构建注意事项

| 项目 | 说明 |
|------|------|
| `npm install` 而非 `npm ci` | npm v10 不将 peer deps 写入 lock file，`npm ci` 会报错 |
| `--network=host` | Payload 在 build 阶段连 DB，builder 容器需要宿主网络 |
| build-time `.env` | 用 `127.0.0.1:27017`；runtime `.env` 用容器名 |

---

## 五、首次初始化（清库后）

1. 访问 `https://amireux.chat/admin`
2. 创建第一个 Admin 账号
3. 登录后：`/admin` 进管理后台，`/private/portal` 进基础设施导航面板

---

## 六、验收检查点

- [ ] `https://amireux.chat` 首页正常，标题"Amireux | 个人数字门户"
- [ ] `https://amireux.chat/admin` 可访问 Payload 管理后台
- [ ] 未登录访问 `/private/portal` → 403 + 跳转提示
- [ ] 登录后访问 `/private/portal` → 正常显示 Aletheia 服务导航

---

## 七、常用运维命令

```bash
# 查看日志
docker logs -f aletheia-core-next-portal

# 重启
docker restart aletheia-core-next-portal

# 进容器调试
docker exec -it aletheia-core-next-portal sh
```
