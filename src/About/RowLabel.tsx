'use client'
import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ text?: string }>()
  return <span>{data?.text || `碎碎念 ${(rowNumber ?? 0) + 1}`}</span>
}
