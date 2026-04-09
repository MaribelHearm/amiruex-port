import SectionPostsPage, { buildSectionMetadata } from '../(sections)/SectionPostsPage'

export default function VisualCosCraftPage() {
  return <SectionPostsPage section="visual-cos-craft" />
}

export function generateMetadata() {
  return buildSectionMetadata('visual-cos-craft')
}
