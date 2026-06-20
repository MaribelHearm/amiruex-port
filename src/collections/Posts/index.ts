import type { CollectionConfig } from 'payload'
import { validations } from 'payload'

import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  OrderedListFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { MarkdownImportFeature } from '@/features/MarkdownImport'
import { markdownToSafeHtml } from '@/lib/writer/markdown'
import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'
import { SECTION_OPTIONS } from '@/constants/sections'
import { slugify } from '@/utilities/slugify'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: {
    singular: '文章',
    plural: '文章',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    section: true,
    excerpt: true,
    heroImage: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'section', 'isFeatured', 'publishedAt', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: '文章标题，显示在列表页、文章页 Hero 区及浏览器标签。',
      },
    },
    {
      name: 'section',
      type: 'select',
      required: true,
      defaultValue: 'home',
      options: [...SECTION_OPTIONS],
      admin: {
        position: 'sidebar',
        description: '控制文章归属的栏目区域，影响首页各区块的文章来源筛选。',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 220,
      admin: {
        description: '文章摘要（最多 220 字）。显示在卡片列表、首页推荐区，不影响正文。',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: '勾选后文章会被标记为「精选」，可在首页特定区块优先展示。',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: '文章分类，从预设列表中选择。显示在 Hero 区标题上方。',
      },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: '自由标签，输入后按回车添加。比分类更灵活，不需要预先定义。',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: '文章封面图。显示在文章页顶部全屏 Hero 区，也作为卡片列表的封面缩略图（优先级高于 SEO 图）。建议尺寸 1920×1080 或更宽。',
              },
            },
            {
              name: 'writerOpenField',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/WriterOpenField#WriterOpenField',
                },
              },
            },
            {
              name: 'contentSource',
              type: 'radio',
              defaultValue: 'writerMarkdown',
              options: [
                {
                  label: 'Payload 富文本（旧文章兼容）',
                  value: 'payloadLexical',
                },
                {
                  label: 'Writer Markdown',
                  value: 'writerMarkdown',
                },
              ],
              admin: {
                description: '选择正文来源。旧文章继续使用 Payload 富文本；Writer Markdown 会在保存时生成安全 HTML 供前台渲染。',
                layout: 'horizontal',
              },
            },
            {
              name: 'contentMarkdown',
              type: 'textarea',
              admin: {
                condition: (_data, siblingData) => siblingData?.contentSource === 'writerMarkdown',
                description: 'Markdown-first 正文源。保存时由服务端转换并清洗为 contentHtml，前台优先渲染该安全 HTML。',
                rows: 24,
              },
            },
            {
              name: 'contentHtml',
              type: 'textarea',
              admin: {
                condition: (_data, siblingData) => siblingData?.contentSource === 'writerMarkdown',
                description: '服务端从 Markdown 生成的安全 HTML。通常无需手改；前台不会信任未经服务端生成/清洗的客户端 HTML。',
                readOnly: true,
                rows: 18,
              },
            },
            {
              name: 'writerUpdatedAt',
              type: 'date',
              admin: {
                condition: (_data, siblingData) => siblingData?.contentSource === 'writerMarkdown',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: 'Writer Markdown 内容最近一次由服务端重新生成 HTML 的时间。',
                readOnly: true,
              },
            },
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    UnorderedListFeature(),
                    OrderedListFeature(),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    BlockquoteFeature(),
                    AlignFeature(),
                    EXPERIMENTAL_TableFeature(),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                    MarkdownImportFeature(),
                  ]
                },
              }),
              admin: {
                condition: (_data, siblingData) => siblingData?.contentSource !== 'writerMarkdown',
              },
              label: false,
              required: true,
              validate: (value, options) => {
                if (
                  'contentSource' in options.siblingData &&
                  options.siblingData.contentSource === 'writerMarkdown'
                ) {
                  return true
                }

                return validations.richText(value, {
                  ...options,
                  required: true,
                })
              },
            },
          ],
          label: '正文内容',
        },
        {
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
                description: '手动指定相关文章，显示在正文底部「延伸阅读」区。留空则不展示该区块。',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
          ],
          label: '关联设置',
        },
        {
          name: 'meta',
          label: 'SEO 设置',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        description: '发布时间，显示在文章 Hero 区。留空时首次「发布」操作会自动填入当前时间。',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        description: '文章作者，从后台用户列表中选择。显示在文章 Hero 区。可多选（合著）。',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    slugField({
      slugify: ({ valueToSlugify }) => {
        if (!valueToSlugify?.trim()) return undefined
        return slugify(valueToSlugify)
      },
    }),
  ],
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc }) => {
        if (data?.contentSource !== 'writerMarkdown') {
          return data
        }

        const nextMarkdown = data.contentMarkdown ?? originalDoc?.contentMarkdown ?? ''

        return {
          ...data,
          contentHtml: await markdownToSafeHtml(nextMarkdown),
          writerUpdatedAt: new Date().toISOString(),
        }
      },
    ],
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
