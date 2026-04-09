import SectionPostsPage, { buildSectionMetadata } from '../(sections)/SectionPostsPage'

export default function GuidesDocsPage() {
  return <SectionPostsPage section="guides-docs" />
}

export function generateMetadata() {
  return buildSectionMetadata('guides-docs')
}
