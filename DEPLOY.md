# 部署手册（自托管 Docker · amireux.chat）

> 本文档面向运维 LLM 或人工运维，描述将本项目以 Docker standalone 方式部署到 NAS/VPS 的完整流程。

---

## 一、环境要求

| 项目           | 要求                                                             |
| -------------- | ---------------------------------------------------------------- |
| Docker         | >= 24.x                                                          |
| Docker Compose | >= v2                                                            |
| MongoDB        | 已运行，可从容器网络访问（内网 `192.168.1.103:27017`）           |
| 对外端口       | 宿主机 `3000` 映射容器 `3000`，或由反向代理（Traefik/Nginx）接管 |

---

## 二、环境变量

`.env` 文件已随代码提供，内容如下（**不要提交到公开仓库**）：

```
DATABASE_URL=mongodb://next_admin:vpkoNDSYxw07ogMF562fDbT1lRk6ItWB@192.168.1.103:27017/next_portal?authSource=admin
PAYLOAD_SECRET=864e9e2fe20106edd20d6b9ee102f02ff57b4574639eccb65eaf7fa7a28d426030396031002117056c5122423bab4bba
NEXT_PUBLIC_SERVER_URL=https://amireux.chat
CRON_SECRET=YOUR_CRON_SECRET_HERE
PREVIEW_SECRET=YOUR_SECRET_HERE
```

> ⚠️ `CRON_SECRET` 和 `PREVIEW_SECRET` 如需使用请替换为真实随机值。

---

## 三、构建镜像

在项目根目录（`next-portal/`）执行：

```bash
# 构建镜像，标记为 amireux-portal:latest
docker build -t amireux-portal:latest .

# 可选：推送到私有镜像仓库
# docker tag amireux-portal:latest your-registry/amireux-portal:latest
# docker push your-registry/amireux-portal:latest
```

> Dockerfile 使用 `node:22.17.0-alpine` 多阶段构建，依赖 `output: 'standalone'`（已在 `next.config.ts` 配置）。

---

## 四、启动容器

### 方式 A：直接 docker run

```bash
docker run -d \
  --name amireux-portal \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  amireux-portal:latest
```

### 方式 B：docker compose（推荐，便于日志管理）

在 NAS/VPS 上创建 `docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  portal:
    image: amireux-portal:latest
    container_name: amireux-portal
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

然后运行：

```bash
docker compose -f docker-compose.prod.yml up -d
```

> 如果 MongoDB 在宿主机，需要 `extra_hosts` 或直接使用宿主机 IP。

---

## 五、首次初始化（清库后必须执行）

容器启动后，**数据库是空的**，需要创建第一个管理员账号：

1. 访问 `https://amireux.chat/admin`
2. Payload CMS 首次进入会提示创建第一个 Admin 用户
3. 填写邮箱和密码，完成注册

> 注册完成后，登录状态下访问 `/admin` 可进入管理后台，访问 `/private/portal` 可访问私有基础设施门户。

---

## 六、可选：Seed 演示数据

登录管理后台后，点击 Dashboard 顶部的 **Seed Database** 按钮，或发送：

```bash
curl -X POST https://amireux.chat/api/next/seed \
  -H "Cookie: payload-token=<your-token>"
```

> ⚠️ Seed 会清空当前数据库，仅在初始化时使用。

---

## 七、反向代理（Traefik 示例）

如果 Traefik 已在 NAS 上运行，在 `docker-compose.prod.yml` 中添加 labels：

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.portal.rule=Host(`amireux.chat`)"
  - "traefik.http.routers.portal.entrypoints=websecure"
  - "traefik.http.routers.portal.tls.certresolver=letsencrypt"
  - "traefik.http.services.portal.loadbalancer.server.port=3000"
```

---

## 八、验收检查点

部署完成后逐项验证：

- [ ] `https://amireux.chat` 首页正常加载，背景图显示
- [ ] `https://amireux.chat/admin` 可访问 Payload 管理后台
- [ ] 未登录访问 `https://amireux.chat/private/portal` → 收到 403 + 提示跳转
- [ ] 登录后访问 `https://amireux.chat/private/portal` → 正常显示 Aletheia 服务导航面板
- [ ] 导航栏灵动岛中 🛡️ 和 📊 图标可点击
- [ ] `/assets/backgrounds/2.png` 图片资源返回 200

---

## 九、常用运维命令

```bash
# 查看日志
docker logs -f amireux-portal

# 重启容器
docker restart amireux-portal

# 更新镜像后重新部署
docker pull amireux-portal:latest  # 如果使用镜像仓库
docker compose -f docker-compose.prod.yml up -d --force-recreate

# 进入容器调试
docker exec -it amireux-portal sh
```
