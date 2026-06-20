import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const inputPath = path.join(projectRoot, 'public/assets/backgrounds/1.png')
const outputDir = path.join(projectRoot, 'public/assets/backgrounds/homepage')
const publicBase = '/assets/backgrounds/homepage'

const widths = [768, 1280, 1920, 2560]
const variants = [
  {
    name: 'original-like',
    description: 'rotate + resize only; no color adjustment or blur',
    transform: (pipeline) => pipeline,
  },
  {
    name: 'soft',
    description: 'subtle softening for optional background use',
    transform: (pipeline) => pipeline.blur(0.35).modulate({ brightness: 0.96, saturation: 1.02 }),
  },
]
const formats = [
  {
    name: 'avif',
    options: { quality: 56, effort: 7, chromaSubsampling: '4:2:0' },
    apply: (pipeline, options) => pipeline.avif(options),
  },
  {
    name: 'webp',
    options: { quality: 80, effort: 6, smartSubsample: true },
    apply: (pipeline, options) => pipeline.webp(options),
  },
]

const resizeOptions = {
  fit: 'inside',
  kernel: 'lanczos3',
  withoutEnlargement: true,
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

await mkdir(outputDir, { recursive: true })

const inputStat = await stat(inputPath)
const inputMetadata = await sharp(inputPath).metadata()
const generatedAt = new Date().toISOString()
const manifest = {
  source: '/assets/backgrounds/1.png',
  generatedAt,
  generator: 'scripts/generate-homepage-bg-derivatives.mjs',
  variants: {},
  settings: {
    widths,
    resize: resizeOptions,
    formats: Object.fromEntries(formats.map((format) => [format.name, format.options])),
  },
  sourceInfo: {
    width: inputMetadata.width,
    height: inputMetadata.height,
    format: inputMetadata.format,
    sizeBytes: inputStat.size,
    size: formatBytes(inputStat.size),
  },
}
const sizeRows = ['variant\twidth\tformat\tfile\tbytes\thuman']

for (const variant of variants) {
  manifest.variants[variant.name] = {
    description: variant.description,
    files: {},
  }

  for (const width of widths) {
    manifest.variants[variant.name].files[width] = {}

    for (const format of formats) {
      const filename = `${variant.name}-${width}.${format.name}`
      const outputPath = path.join(outputDir, filename)

      const basePipeline = sharp(inputPath)
        .rotate()
        .resize({ width, ...resizeOptions })

      const outputInfo = await format.apply(variant.transform(basePipeline), format.options).toFile(outputPath)
      const outputStat = await stat(outputPath)
      const publicPath = `${publicBase}/${filename}`

      manifest.variants[variant.name].files[width][format.name] = {
        path: publicPath,
        width: outputInfo.width,
        height: outputInfo.height,
        sizeBytes: outputStat.size,
        size: formatBytes(outputStat.size),
      }
      sizeRows.push([
        variant.name,
        width,
        format.name,
        publicPath,
        outputStat.size,
        formatBytes(outputStat.size),
      ].join('\t'))
    }
  }
}

await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(path.join(outputDir, 'sizes.tsv'), `${sizeRows.join('\n')}\n`)

console.log(`Generated homepage background derivatives in ${path.relative(projectRoot, outputDir)}`)
console.log(sizeRows.join('\n'))
