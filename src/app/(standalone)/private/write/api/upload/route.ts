import crypto from 'node:crypto'

import { requireWriterUser, unauthenticatedResponse } from '@/lib/writer/auth'

export const dynamic = 'force-dynamic'

const MAX_IMAGE_BYTES = 12 * 1024 * 1024

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanSha256(value: unknown): string {
  const text = cleanString(value).toLowerCase()
  return /^[a-f0-9]{64}$/.test(text) ? text : ''
}

function safeFilename(value: string) {
  const filename = value.trim().replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '-')
  return filename || `writer-image-${Date.now()}`
}

function publicMediaUrl(url: string | null | undefined, filename: string | null | undefined) {
  if (url) return url
  if (filename) return `/media/${filename}`
  return ''
}

export async function POST(req: Request) {
  try {
    const { payload, user } = await requireWriterUser()
    const formData = await req.formData()
    const file = formData.get('file')
    const alt = cleanString(formData.get('alt')) || '文章图片'
    const clientHash = cleanSha256(formData.get('hash'))

    if (!(file instanceof File)) {
      return Response.json({ error: '请上传图片文件' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return Response.json({ error: '只能上传图片文件' }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: '图片不能超过 12MB' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const serverHash = crypto.createHash('sha256').update(Buffer.from(arrayBuffer)).digest('hex')
    const hash = clientHash && clientHash === serverHash ? clientHash : serverHash

    const existing = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        writerFileHash: { equals: hash },
      },
    })
    const existingMedia = existing.docs[0]
    if (existingMedia) {
      const url = publicMediaUrl(existingMedia.url, existingMedia.filename)
      if (url) {
        return Response.json({
          id: existingMedia.id,
          alt: existingMedia.alt || alt,
          filename: existingMedia.filename,
          hash,
          reused: true,
          url,
        })
      }
    }

    const filename = safeFilename(file.name)
    const media = await payload.create({
      collection: 'media',
      user,
      depth: 0,
      data: { alt, writerFileHash: hash },
      file: {
        data: Buffer.from(arrayBuffer),
        mimetype: file.type,
        name: filename,
        size: file.size,
      },
    })
    const url = publicMediaUrl(media.url, media.filename)

    if (!url) {
      return Response.json({ error: '图片已上传但没有返回 URL' }, { status: 500 })
    }

    return Response.json({
      id: media.id,
      alt,
      filename: media.filename,
      hash,
      reused: false,
      url,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return unauthenticatedResponse()
    }

    console.error('[writer-upload]', error)
    return Response.json({ error: '图片上传失败' }, { status: 500 })
  }
}
