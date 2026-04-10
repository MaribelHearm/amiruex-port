import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { PortalClient } from './PortalClient'
import { getPortalConfig } from './services'

export default async function PortalPage() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    redirect('/admin')
  }

  const portalConfig = getPortalConfig()

  return (
    <PortalClient
      categories={portalConfig.categories}
      portalTagline={portalConfig.portalTagline}
      services={portalConfig.services}
    />
  )
}
