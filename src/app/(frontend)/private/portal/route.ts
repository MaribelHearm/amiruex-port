import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response(
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>访问受限</title>' +
      '<style>body{font-family:monospace;display:flex;align-items:center;justify-content:center;' +
      'min-height:100vh;margin:0;background:#1a1b26;color:#c0caf5;}' +
      '.box{text-align:center;padding:2rem;border:1px solid #7aa2f740;border-radius:1rem;}' +
      'a{color:#7aa2f7;text-decoration:none;}</style></head>' +
      '<body><div class="box"><h1>🔒 访问受限</h1>' +
      '<p style="margin:1rem 0;color:#9aa5ce;">此页面仅限授权用户访问。</p>' +
      '<a href="/admin">前往登录 →</a></div></body></html>',
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    )
  }

  const htmlPath = join(process.cwd(), 'src', 'app', '(frontend)', 'private', 'portal', 'portal.html')
  const html = readFileSync(htmlPath, 'utf-8')

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
