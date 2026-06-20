import type { Metadata } from 'next'

import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import './writer.css'

export const metadata: Metadata = {
  title: 'Writer | Aletheia',
  robots: { index: false, follow: false },
}

export default function WriterLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
