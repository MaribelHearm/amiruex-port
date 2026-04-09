import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <Link className="site-footer__brand" href="/">
          <Logo />
        </Link>

        <div className="site-footer__right">
          <nav className="site-footer__nav" aria-label="页脚导航">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="site-footer__link" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
