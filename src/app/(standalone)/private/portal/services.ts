export interface PortalService {
  name: string
  desc: string
  category: string
  internal?: string
  external?: string
}

export interface PortalConfig {
  services: PortalService[]
  categories: string[]
  portalTagline: string
}

const DEFAULT_SERVICES: PortalService[] = [
  { name: 'LobeChat', desc: 'AI 对话平台', category: '核心应用', internal: 'http://192.168.1.103:3210', external: 'https://ai.amireux.chat' },
  { name: 'OpenClaw', desc: 'AI 自动化工作台', category: '核心应用', internal: 'http://192.168.1.103:18789', external: 'https://oc.amireux.chat' },
  { name: 'Dify', desc: 'LLM 应用编排平台', category: '核心应用', external: 'https://dify.amireux.chat' },
  { name: 'Wiki.js', desc: '知识库系统', category: '核心应用', internal: 'http://192.168.1.103:3005', external: 'https://wiki.amireux.chat' },
  { name: 'Immich', desc: '照片管理系统', category: '核心应用', internal: 'http://192.168.1.103:2283', external: 'https://p.amireux.chat' },
  { name: 'Jellyfin', desc: '媒体服务器', category: '核心应用', internal: 'http://192.168.1.103:8096', external: 'https://media.amireux.chat' },
  { name: 'Home Assistant', desc: '智能家居控制', category: '核心应用', internal: 'http://192.168.1.103:8123', external: 'https://ha.amireux.chat' },
  { name: 'CLIProxyAPI', desc: 'CLI 多模型代理服务', category: 'API 与代理', internal: 'http://192.168.1.103:3011/management.html', external: 'https://clip.amireux.chat/management.html' },
  { name: 'EasyProxies', desc: '多端口代理池管理', category: 'API 与代理', internal: 'http://192.168.1.103:9888', external: 'https://proxy.amireux.chat' },
  { name: 'GOT-OCR', desc: '高精度 OCR 识别服务', category: 'API 与代理', internal: 'http://192.168.1.103:8866' },
  { name: 'OutlookMail Plus', desc: '邮箱接码 / 验证码提取', category: 'API 与代理', internal: 'http://192.168.1.103:5002' },
  { name: 'Dockge', desc: 'Docker Compose 管理面板', category: '基础设施', internal: 'http://192.168.1.103:5001', external: 'https://dockge.amireux.chat' },
  { name: 'Traefik', desc: '反向代理 Dashboard', category: '基础设施', internal: 'http://192.168.1.103:8080', external: 'https://traefik.amireux.chat' },
  { name: 'Aria2 / AriaNg', desc: '下载工具', category: '基础设施', internal: 'http://192.168.1.103:6880', external: 'https://aria.amireux.chat' },
  { name: 'CasaOS', desc: 'NAS 管理面板', category: '基础设施', internal: 'http://192.168.1.103:8580' },
  { name: 'Telegram Downloader', desc: 'Telegram 媒体下载', category: '基础设施', internal: 'http://192.168.1.103:5000' },
  { name: 'Glances', desc: '系统监控', category: '基础设施', internal: 'http://192.168.1.103:61208' },
  { name: 'MCP Wiki', desc: 'Wiki 操作工具', category: 'MCP 工具', internal: 'http://192.168.1.103:3001' },
  { name: 'MCP Wiki Incremental', desc: 'Wiki 增量更新', category: 'MCP 工具', internal: 'http://192.168.1.103:3007' },
  { name: 'MCP Search', desc: '搜索服务', category: 'MCP 工具', internal: 'http://192.168.1.103:3002' },
  { name: 'MCP D2', desc: 'D2 图表生成', category: 'MCP 工具', internal: 'http://192.168.1.103:3003' },
  { name: 'MCP Mermaid', desc: 'Mermaid 图表', category: 'MCP 工具', internal: 'http://192.168.1.103:3006' },
  { name: 'MCP Media', desc: '媒体服务', category: 'MCP 工具', internal: 'http://192.168.1.103:3004' },
  { name: 'NapCat', desc: 'QQ 机器人', category: 'QQ Bot', internal: 'http://192.168.1.103:6099' },
  { name: 'NapCat Exporter', desc: '聊天记录导出 + QCE', category: 'QQ Bot', internal: 'http://192.168.1.103:6098', external: 'http://192.168.1.103:40654/qce-v4-tool' },
]

const DEFAULT_CATEGORIES = ['核心应用', 'API 与代理', '基础设施', 'MCP 工具', 'QQ Bot']
const DEFAULT_PORTAL_TAGLINE = 'DIGITAL SOVEREIGNTY PORTAL · 192.168.1.103'

function safeParseServices(raw: string | undefined): PortalService[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const services = parsed.filter((item): item is PortalService => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as PortalService).name === 'string' &&
        typeof (item as PortalService).desc === 'string' &&
        typeof (item as PortalService).category === 'string'
      )
    })
    return services.length > 0 ? services : null
  } catch {
    return null
  }
}

export function getPortalConfig(): PortalConfig {
  const envServices = safeParseServices(process.env.PORTAL_SERVICES_JSON)

  const services = envServices ?? DEFAULT_SERVICES
  const categories = Array.from(new Set(services.map((s) => s.category)))
  const portalTagline = process.env.PORTAL_TAGLINE || DEFAULT_PORTAL_TAGLINE

  return {
    services,
    categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
    portalTagline,
  }
}
