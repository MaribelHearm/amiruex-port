import type { GlobalConfig } from 'payload'
import { revalidateAbout } from './hooks/revalidateAbout'

export const About: GlobalConfig = {
  slug: 'about',
  label: '关于页面',
  access: {
    read: () => true,
  },
  fields: [
    // ── 页头区 ──────────────────────────────────────────
    {
      name: 'tag',
      type: 'text',
      defaultValue: 'About / 人的入口',
      admin: {
        description: '页头小标签，显示在标题上方。',
      },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: '你好，我是子湛。',
      admin: {
        description: '页面主标题（h1）。',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      required: true,
      defaultValue:
        '一个在工程实践、内容写作和轻交互产品之间反复横跳的人。比起"做一个完美站点"，我更在意"把真实的阶段记录下来"。',
      admin: {
        description: '页头副标题，一两句话介绍自己。',
      },
    },

    // ── 当前状态 ─────────────────────────────────────────
    {
      name: 'statusTitle',
      type: 'text',
      defaultValue: '当前状态',
      admin: {
        description: '「当前状态」区块的标题，一般不用改。',
      },
    },
    {
      name: 'statusContent',
      type: 'textarea',
      required: true,
      defaultValue:
        '现在主要在推进这件事：把主站从"页面集合"升级成"有连续输出 + 有工具可玩 + 有个人表达"的长期项目。最近重心放在 Blog 的稳定发布节奏，以及 Tools 区的 MVP 落地。',
      admin: {
        description: '当前在做什么、重心在哪里，经常更新这里。',
      },
    },

    // ── 这个站为什么存在 ──────────────────────────────────
    {
      name: 'whyTitle',
      type: 'text',
      defaultValue: '这个站为什么存在',
      admin: {
        description: '「为什么」区块的标题。',
      },
    },
    {
      name: 'whyContent',
      type: 'textarea',
      required: true,
      defaultValue:
        '过去很多想法都散落在聊天记录、临时文档和零碎片段里。这个站的意义，是给这些内容一个持续生长的"母体"：可以记录、可以迭代、可以被未来的自己复用。',
      admin: {
        description: '站点存在的理由，一段话。',
      },
    },

    // ── 碎碎念 ───────────────────────────────────────────
    {
      name: 'notesTitle',
      type: 'text',
      defaultValue: '轻碎碎念',
      admin: {
        description: '碎碎念区块的标题。',
      },
    },
    {
      name: 'notes',
      type: 'array',
      label: '碎碎念列表',
      minRows: 1,
      admin: {
        description: '每条一句话，想加就加一行，想删就删。输入内容后折叠标签会自动显示内容预览。',
        components: {
          RowLabel: '@/About/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: '内容',
          required: true,
          admin: {
            description: '一条碎碎念，一句话即可。',
            placeholder: '在这里输入内容…',
          },
        },
      ],
      defaultValue: [
        { text: '我喜欢把复杂问题拆成可执行的小阶段，再一块块推进。' },
        { text: '我对"有手感的工具"有执念：哪怕很小，也要真的能用。' },
        { text: '如果你在这里看到很多"施工中"，那不是敷衍，是我真实的迭代方式。' },
      ],
    },

    // ── 留白区 ───────────────────────────────────────────
    {
      name: 'placeholderTitle',
      type: 'text',
      defaultValue: '留白区（持续扩展）',
      admin: {
        description: '留白区标题。',
      },
    },
    {
      name: 'placeholderContent',
      type: 'textarea',
      defaultValue:
        '下一步会补：时间线、常用工具清单、工作流与设备偏好、以及我长期喜欢的内容入口。',
      admin: {
        description: '留白区说明文字，用来预告还没做但打算做的内容。',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateAbout],
  },
}
