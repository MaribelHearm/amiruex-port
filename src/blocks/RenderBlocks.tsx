import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

type LayoutBlock = Page['layout'][number]

export const RenderBlocks: React.FC<{
  blocks: LayoutBlock[]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          switch (block.blockType) {
            case 'archive':
              return (
                <div className="my-16" key={index}>
                  <ArchiveBlock {...block} />
                </div>
              )
            case 'content':
              return (
                <div className="my-16" key={index}>
                  <ContentBlock {...block} />
                </div>
              )
            case 'cta':
              return (
                <div className="my-16" key={index}>
                  <CallToActionBlock {...block} />
                </div>
              )
            case 'formBlock':
              if (typeof block.form !== 'object' || block.form === null) {
                return null
              }

              return (
                <div className="my-16" key={index}>
                  <FormBlock {...block} form={block.form} />
                </div>
              )
            case 'mediaBlock':
              return (
                <div className="my-16" key={index}>
                  <MediaBlock {...block} disableInnerContainer />
                </div>
              )
            default:
              return null
          }
        })}
      </Fragment>
    )
  }

  return null
}
