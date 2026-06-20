import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'

import type { User } from '@/payload-types'

type WriterAuthContext = {
  payload: Payload
  user: User
}

export async function requireWriterUser(): Promise<WriterAuthContext> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    throw new Error('UNAUTHENTICATED')
  }

  return { payload, user: user as User }
}

export function unauthenticatedResponse() {
  return Response.json({ error: '请先登录 Payload 后台' }, { status: 401 })
}
