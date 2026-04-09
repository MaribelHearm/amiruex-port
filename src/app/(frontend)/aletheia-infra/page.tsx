import SectionPostsPage, { buildSectionMetadata } from '../(sections)/SectionPostsPage'

export default function AletheiaInfraPage() {
  return <SectionPostsPage section="aletheia-infra" />
}

export function generateMetadata() {
  return buildSectionMetadata('aletheia-infra')
}
