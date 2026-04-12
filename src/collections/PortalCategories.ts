import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

export const PortalCategories: CollectionConfig = {
  slug: 'portal-categories',
  labels: {
    singular: '门户分类',
    plural: '门户分类',
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
    defaultColumns: ['name', 'order', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      label: '分类名',
      type: 'text',
      required: true,
      unique: true,
      index: true,
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
