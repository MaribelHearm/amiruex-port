import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

const postListPaths = [
  '/',
  '/posts',
  '/posts/page/1',
  '/about',
  '/coding-tools',
  '/extensions',
  '/guides-docs',
  '/visual-cos-craft',
  '/aletheia-infra',
  '/photography',
  '/wandering',
]

function revalidatePostSurfaces(slug?: string | null) {
  for (const path of postListPaths) revalidatePath(path)
  if (slug) revalidatePath(`/posts/${slug}`)
  revalidatePath('/posts/[slug]', 'page')
  revalidatePath('/posts/page/[pageNumber]', 'page')
  revalidatePath('/posts/categories/[slug]', 'page')
  revalidateTag('posts-sitemap', 'max')
}

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePostSurfaces(doc.slug)
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePostSurfaces(previousDoc.slug)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePostSurfaces(doc?.slug)
  }

  return doc
}
