import { redirect } from 'next/navigation'

import { WriterClient } from '@/components/writer/WriterClient'
import {
  categoryToWriterSummary,
  postToWriterDocument,
  postToWriterSummary,
  userToWriterSummary,
} from '@/lib/writer/types'
import { requireWriterUser } from '@/lib/writer/auth'

type Args = {
  searchParams: Promise<{
    id?: string
    slug?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function WriterPage({ searchParams }: Args) {
  let auth
  try {
    auth = await requireWriterUser()
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      redirect('/admin')
    }
    throw error
  }

  const { payload } = auth
  const { id, slug } = await searchParams

  const [initialPost, postsResult, categoriesResult, usersResult] = await Promise.all([
    loadInitialPost({ id, slug, payload }),
    payload.find({
      collection: 'posts',
      depth: 0,
      draft: true,
      limit: 30,
      sort: '-updatedAt',
      select: {
        title: true,
        slug: true,
        section: true,
        writerUpdatedAt: true,
        updatedAt: true,
        _status: true,
      },
    }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 100,
      pagination: false,
      sort: 'title',
      select: {
        title: true,
        slug: true,
      },
    }),
    payload.find({
      collection: 'users',
      depth: 0,
      limit: 50,
      pagination: false,
      sort: 'name',
      select: {
        email: true,
        name: true,
      },
    }),
  ])

  return (
    <WriterClient
      initialAuthors={usersResult.docs.map(userToWriterSummary)}
      initialCategories={categoriesResult.docs.map(categoryToWriterSummary)}
      initialPost={initialPost ? postToWriterDocument(initialPost) : null}
      initialPosts={postsResult.docs.map(postToWriterSummary)}
    />
  )
}

type LoadInitialPostArgs = {
  id?: string
  slug?: string
  payload: Awaited<ReturnType<typeof requireWriterUser>>['payload']
}

async function loadInitialPost({ id, slug, payload }: LoadInitialPostArgs) {
  if (id) {
    return payload.findByID({ collection: 'posts', id, depth: 2, draft: true })
  }

  if (slug) {
    const result = await payload.find({
      collection: 'posts',
      depth: 2,
      draft: true,
      limit: 1,
      pagination: false,
      where: { slug: { equals: slug } },
    })
    return result.docs[0] ?? null
  }

  return null
}
