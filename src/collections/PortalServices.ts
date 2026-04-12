import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

export const PortalServices: CollectionConfig = {
  slug: 'portal-services',
  labels: {
    singular: '门户服务',
    plural: '门户服务',
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'order', 'enabled', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      label: '服务名',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'desc',
      label: '描述',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      label: '分类',
      type: 'relationship',
      relationTo: 'portal-categories',
      required: true,
      index: true,
      filterOptions: {
        enabled: {
          equals: true,
        },
      },
    },
    {
      name: 'internal',
      label: '内网地址',
      type: 'text',
    },
    {
      name: 'external',
      label: '外网地址',
      type: 'text',
    },
    {
      name: 'order',
      label: '排序',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: '数字越小越靠前',
      },
    },
    {
      name: 'enabled',
      label: '启用',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
  ],
  timestamps: true,
}
