import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

export type TranscribeSourceType = 'bilibili' | 'upload'
export type TranscribeTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed'
export type ProviderKey = 'tencent_asr' | 'azure_speech_asr' | 'openai_asr' | 'custom_asr_http'

type TaskError = {
  code:
    | 'INVALID_INPUT'
    | 'UNSUPPORTED_SOURCE'
    | 'TASK_NOT_FOUND'
    | 'DOWNLOAD_FAILED'
    | 'DURATION_EXCEEDED'
    | 'TRANSCRIBE_FAILED'
    | 'INTERNAL_ERROR'
  message: string
}

export type TranscribeTask = {
  taskId: string
  status: TranscribeTaskStatus
  progress: number
  sourceType: TranscribeSourceType
  text?: string
  error?: TaskError
  meta?: {
    provider?: ProviderKey
    durationSec?: number
  }
  createdAt: number
  updatedAt: number
  expiresAt: number
}

type UploadPayload = {
  sourceType: 'upload'
  fileName: string
  fileBytes: Uint8Array
}

type BilibiliPayload = {
  sourceType: 'bilibili'
  url: string
}

type StartPayload = UploadPayload | BilibiliPayload

type Store = Map<string, TranscribeTask>

type AppErrorCode = TaskError['code']

class AppError extends Error {
  code: AppErrorCode

  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

const TASK_TTL_MS = 1000 * 60 * 60 * 6
const TASK_GC_INTERVAL_MS = Number(process.env.TRANSCRIBE_TASK_GC_INTERVAL_MS || 1000 * 60 * 10)
const MAX_MINUTES = Number(process.env.TRANSCRIBE_MAX_MINUTES || 10)
const MAX_UPLOAD_MB = Number(process.env.TRANSCRIBE_MAX_UPLOAD_MB || 30)
const COMMAND_TIMEOUT_MS = Number(process.env.TRANSCRIBE_TIMEOUT_MS || 1000 * 60 * 5)

const getStore = (): Store => {
  const scoped = globalThis as typeof globalThis & { __transcribeTaskStore?: Store }
  if (!scoped.__transcribeTaskStore) scoped.__transcribeTaskStore = new Map<string, TranscribeTask>()
  return scoped.__transcribeTaskStore
}

const now = () => Date.now()

const cleanupExpired = () => {
  const store = getStore()
  const t = now()
  for (const [taskId, task] of store.entries()) {
    if (task.expiresAt <= t) store.delete(taskId)
  }
}

const ensureTaskGC = () => {
  const scoped = globalThis as typeof globalThis & { __transcribeTaskGCStarted?: boolean }
  if (scoped.__transcribeTaskGCStarted) return

  scoped.__transcribeTaskGCStarted = true
  setInterval(() => {
    cleanupExpired()
  }, TASK_GC_INTERVAL_MS).unref?.()
}

const patchTask = (taskId: string, patch: Partial<TranscribeTask>) => {
  const store = getStore()
  const current = store.get(taskId)
  if (!current) return
  store.set(taskId, {
    ...current,
    ...patch,
    updatedAt: now(),
  })
}

export const createTask = (sourceType: TranscribeSourceType): TranscribeTask => {
  cleanupExpired()
  ensureTaskGC()
  const createdAt = now()
  const task: TranscribeTask = {
    taskId: randomUUID(),
    sourceType,
    status: 'queued',
    progress: 0,
    createdAt,
    updatedAt: createdAt,
    expiresAt: createdAt + TASK_TTL_MS,
  }
  getStore().set(task.taskId, task)
  return task
}

export const getTask = (taskId: string): TranscribeTask | null => {
  cleanupExpired()
  ensureTaskGC()
  return getStore().get(taskId) ?? null
}

const ALL_PROVIDERS: ProviderKey[] = ['tencent_asr', 'azure_speech_asr', 'openai_asr', 'custom_asr_http']

export const listProviderChain = (): ProviderKey[] => {
  const raw = (process.env.TRANSCRIBE_PROVIDER_CHAIN || 'tencent_asr,azure_speech_asr,openai_asr,custom_asr_http')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const chain = raw.filter((item): item is ProviderKey => ALL_PROVIDERS.includes(item as ProviderKey))
  if (chain.length === 0) return ALL_PROVIDERS

  return [...new Set(chain)]
}

const resolveExecutable = async (command: string): Promise<string> => {
  const map: Record<string, string | undefined> = {
    'yt-dlp': process.env.TRANSCRIBE_YTDLP_PATH,
    ffmpeg: process.env.TRANSCRIBE_FFMPEG_PATH,
    ffprobe: process.env.TRANSCRIBE_FFPROBE_PATH,
  }

  const configured = map[command]
  if (configured) return configured

  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA
    if (local) {
      if (command === 'yt-dlp') {
        const p = path.join(
          local,
          'Microsoft',
          'WinGet',
          'Packages',
          'yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe',
          'yt-dlp.exe',
        )
        try {
          await fs.access(p)
          return p
        } catch {
          // ignore
        }
      }

      if (command === 'ffmpeg' || command === 'ffprobe') {
        const base = path.join(
          local,
          'Microsoft',
          'WinGet',
          'Packages',
          'yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe',
          'ffmpeg-N-123778-g3b55818764-win64-gpl',
          'bin',
        )
        const p = path.join(base, `${command}.exe`)
        try {
          await fs.access(p)
          return p
        } catch {
          // ignore
        }
      }
    }
  }

  return command
}

const runCommand = async (
  command: string,
  args: string[],
  options?: { cwd?: string; timeoutMs?: number },
): Promise<{ stdout: string; stderr: string }> => {
  const timeoutMs = options?.timeoutMs ?? COMMAND_TIMEOUT_MS
  const executable = await resolveExecutable(command)

  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: options?.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    const timer = setTimeout(() => {
      child.kill()
      reject(new AppError('INTERNAL_ERROR', `${command} 执行超时`))
    }, timeoutMs)

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`${command} exit(${code}): ${stderr || stdout}`))
      }
    })
  })
}

const ensureBilibiliURL = (url: string) => {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (!host.includes('bilibili.com') && host !== 'b23.tv') {
      throw new AppError('INVALID_INPUT', '仅支持 bilibili.com / b23.tv 链接')
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('INVALID_INPUT', '无效的 URL')
  }
}

const probeDurationSec = async (audioPath: string): Promise<number> => {
  try {
    const { stdout } = await runCommand('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ])

    const duration = Number(stdout.trim())
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new AppError('INTERNAL_ERROR', '无法识别音频时长')
    }

    return duration
  } catch {
    throw new AppError('INTERNAL_ERROR', 'ffprobe 不可用或音频无法解析')
  }
}

const normalizeToWav = async (inputPath: string, outputPath: string) => {
  try {
    await runCommand('ffmpeg', [
      '-y',
      '-i',
      inputPath,
      '-ac',
      '1',
      '-ar',
      '16000',
      '-vn',
      outputPath,
    ])
  } catch {
    throw new AppError('INTERNAL_ERROR', 'ffmpeg 不可用或音频转码失败')
  }
}

const downloadBilibiliAudio = async (url: string, workDir: string): Promise<string> => {
  ensureBilibiliURL(url)

  try {
    const ffmpegPath = await resolveExecutable('ffmpeg')
    const ffmpegLocation = path.dirname(ffmpegPath)

    await runCommand(
      'yt-dlp',
      [
        '--no-playlist',
        '--extract-audio',
        '--audio-format',
        'wav',
        '--audio-quality',
        '0',
        '--ffmpeg-location',
        ffmpegLocation,
        '-o',
        path.join(workDir, 'source.%(ext)s'),
        url,
      ],
      { cwd: workDir, timeoutMs: COMMAND_TIMEOUT_MS * 2 },
    )
  } catch {
    throw new AppError('DOWNLOAD_FAILED', 'Bilibili 音频下载失败，请检查链接或下载器环境')
  }

  const files = await fs.readdir(workDir)
  const wav = files.find((f) => f.endsWith('.wav'))
  if (!wav) throw new AppError('DOWNLOAD_FAILED', '未找到下载后的音频文件')
  return path.join(workDir, wav)
}

const saveUploadedFile = async (payload: UploadPayload, workDir: string): Promise<string> => {
  const sizeMB = payload.fileBytes.byteLength / (1024 * 1024)
  if (sizeMB > MAX_UPLOAD_MB) {
    throw new AppError('INVALID_INPUT', `上传文件超过限制（${MAX_UPLOAD_MB}MB）`)
  }

  const rawPath = path.join(workDir, payload.fileName || 'upload.bin')
  await fs.writeFile(rawPath, payload.fileBytes)
  return rawPath
}

const prepareTencentAudio = async (
  audioPath: string,
): Promise<{ audio: Buffer; voiceFormat: 'wav' | 'mp3'; dataPath: string }> => {
  const stat = await fs.stat(audioPath)
  const directMaxBytes = 2.8 * 1024 * 1024

  if (stat.size <= directMaxBytes) {
    const audio = await fs.readFile(audioPath)
    return { audio, voiceFormat: 'wav', dataPath: audioPath }
  }

  const mp3Path = path.join(path.dirname(audioPath), 'tencent-input.mp3')
  await runCommand('ffmpeg', ['-y', '-i', audioPath, '-ac', '1', '-ar', '16000', '-b:a', '32k', mp3Path])

  const mp3Stat = await fs.stat(mp3Path)
  if (mp3Stat.size > directMaxBytes) {
    throw new Error('tencent input still larger than 3MB after mp3 compression')
  }

  const audio = await fs.readFile(mp3Path)
  return { audio, voiceFormat: 'mp3', dataPath: mp3Path }
}

const callTencentSentenceRecognition = async (params: {
  audio: Buffer
  voiceFormat: 'wav' | 'mp3'
  secretId: string
  secretKey: string
  region: string
}): Promise<string> => {
  const sdk = (await import('tencentcloud-sdk-nodejs')) as {
    asr: {
      v20190614: {
        Client: new (config: {
          credential: { secretId: string; secretKey: string }
          region: string
          profile: { httpProfile: { endpoint: string } }
        }) => {
          SentenceRecognition: (req: {
            ProjectId: number
            SubServiceType: number
            EngSerViceType: string
            SourceType: number
            VoiceFormat: 'wav' | 'mp3'
            UsrAudioKey: string
            Data: string
            DataLen: number
          }) => Promise<{ Result?: string }>
        }
      }
    }
  }

  const client = new sdk.asr.v20190614.Client({
    credential: {
      secretId: params.secretId,
      secretKey: params.secretKey,
    },
    region: params.region,
    profile: {
      httpProfile: {
        endpoint: 'asr.tencentcloudapi.com',
      },
    },
  })

  const result = await client.SentenceRecognition({
    ProjectId: 0,
    SubServiceType: 2,
    EngSerViceType: '16k_zh',
    SourceType: 1,
    VoiceFormat: params.voiceFormat,
    UsrAudioKey: randomUUID(),
    Data: params.audio.toString('base64'),
    DataLen: params.audio.byteLength,
  })

  const text = result.Result?.trim()
  if (!text) throw new Error('tencent empty text')
  return text
}

const splitAudioForTencent = async (audioPath: string, segmentSeconds = 55): Promise<string[]> => {
  const segmentDir = await fs.mkdtemp(path.join(path.dirname(audioPath), 'tencent-seg-'))

  await runCommand('ffmpeg', [
    '-y',
    '-i',
    audioPath,
    '-f',
    'segment',
    '-segment_time',
    String(segmentSeconds),
    '-reset_timestamps',
    '1',
    '-ac',
    '1',
    '-ar',
    '16000',
    path.join(segmentDir, 'segment-%03d.wav'),
  ])

  const files = (await fs.readdir(segmentDir))
    .filter((f) => f.endsWith('.wav'))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => path.join(segmentDir, f))

  if (files.length === 0) {
    throw new Error('tencent split produced no segments')
  }

  return files
}

const providerTencent = async (audioPath: string): Promise<string> => {
  const secretId = process.env.TENCENT_ASR_SECRET_ID
  const secretKey = process.env.TENCENT_ASR_SECRET_KEY
  const region = process.env.TENCENT_ASR_REGION || 'ap-guangzhou'

  if (!secretId || !secretKey) {
    throw new Error('TENCENT_ASR_SECRET_ID / TENCENT_ASR_SECRET_KEY missing')
  }

  const duration = await probeDurationSec(audioPath)

  if (duration <= 60) {
    const prepared = await prepareTencentAudio(audioPath)
    return await callTencentSentenceRecognition({
      audio: prepared.audio,
      voiceFormat: prepared.voiceFormat,
      secretId,
      secretKey,
      region,
    })
  }

  const segments = await splitAudioForTencent(audioPath, 55)
  try {
    const parts: string[] = []

    for (const segmentPath of segments) {
      const prepared = await prepareTencentAudio(segmentPath)
      const text = await callTencentSentenceRecognition({
        audio: prepared.audio,
        voiceFormat: prepared.voiceFormat,
        secretId,
        secretKey,
        region,
      })
      if (text.trim()) parts.push(text.trim())
    }

    const merged = parts.join('\n')
    if (!merged.trim()) throw new Error('tencent empty text after segment merge')
    return merged
  } finally {
    const segmentDir = path.dirname(segments[0])
    await fs.rm(segmentDir, { recursive: true, force: true })
  }
}

const providerAzure = async (audioPath: string): Promise<string> => {
  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) throw new Error('AZURE_SPEECH_KEY / AZURE_SPEECH_REGION missing')

  const data = await fs.readFile(audioPath)
  const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=zh-CN&format=detailed`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
    },
    body: data,
  })

  if (!res.ok) throw new Error(`azure status ${res.status}`)
  const json = (await res.json()) as { DisplayText?: string; NBest?: Array<{ Display?: string }> }
  const text = json.DisplayText || json.NBest?.[0]?.Display
  if (!text) throw new Error('azure empty text')
  return text
}

const providerOpenAI = async (audioPath: string): Promise<string> => {
  const apiKey = process.env.TRANSCRIBE_API_KEY
  if (!apiKey) throw new Error('TRANSCRIBE_API_KEY missing')

  const model = process.env.OPENAI_ASR_MODEL || 'gpt-4o-mini-transcribe'
  const data = await fs.readFile(audioPath)

  const form = new FormData()
  form.append('file', new Blob([data]), 'audio.wav')
  form.append('model', model)
  form.append('language', 'zh')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!res.ok) throw new Error(`openai status ${res.status}`)
  const json = (await res.json()) as { text?: string }
  if (!json.text) throw new Error('openai empty text')
  return json.text
}

const providerCustom = async (audioPath: string): Promise<string> => {
  const endpoint = process.env.CUSTOM_ASR_ENDPOINT
  if (!endpoint) throw new Error('CUSTOM_ASR_ENDPOINT missing')

  const token = process.env.CUSTOM_ASR_TOKEN
  const data = await fs.readFile(audioPath)

  const form = new FormData()
  form.append('file', new Blob([data]), 'audio.wav')

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  if (!res.ok) throw new Error(`custom status ${res.status}`)
  const json = (await res.json()) as { text?: string }
  if (!json.text) throw new Error('custom empty text')
  return json.text
}

const isProviderConfigMissingError = (error: unknown): boolean => {
  return error instanceof Error && /\bmissing\b/i.test(error.message)
}

const transcribeWithProviderChain = async (audioPath: string): Promise<{ text: string; provider: ProviderKey }> => {
  const chain = listProviderChain()
  const skippedByConfig: string[] = []
  const failedProviders: string[] = []

  for (const provider of chain) {
    try {
      if (provider === 'tencent_asr') {
        const text = await providerTencent(audioPath)
        return { text, provider }
      }
      if (provider === 'azure_speech_asr') {
        const text = await providerAzure(audioPath)
        return { text, provider }
      }
      if (provider === 'openai_asr') {
        const text = await providerOpenAI(audioPath)
        return { text, provider }
      }
      if (provider === 'custom_asr_http') {
        const text = await providerCustom(audioPath)
        return { text, provider }
      }
    } catch (error) {
      if (isProviderConfigMissingError(error)) {
        skippedByConfig.push(`${provider}: ${error instanceof Error ? error.message : String(error)}`)
        continue
      }

      failedProviders.push(`${provider}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (failedProviders.length > 0) {
    const skipped = skippedByConfig.length > 0 ? `；未配置已跳过 -> ${skippedByConfig.join(' | ')}` : ''
    throw new AppError('TRANSCRIBE_FAILED', `所有已配置 provider 失败: ${failedProviders.join(' | ')}${skipped}`)
  }

  if (skippedByConfig.length > 0) {
    throw new AppError('TRANSCRIBE_FAILED', `未配置可用 provider: ${skippedByConfig.join(' | ')}`)
  }

  throw new AppError('TRANSCRIBE_FAILED', '未找到可用 provider')
}

const asTaskError = (error: unknown): TaskError => {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message }
  }
  return {
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : '未知错误',
  }
}

export const startTask = (taskId: string, payload: StartPayload): void => {
  void (async () => {
    const task = getTask(taskId)
    if (!task) return

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bili-transcribe-'))

    try {
      patchTask(taskId, { status: 'running', progress: 5 })

      let sourceAudioPath = ''
      if (payload.sourceType === 'bilibili') {
        patchTask(taskId, { progress: 15 })
        sourceAudioPath = await downloadBilibiliAudio(payload.url, workDir)
      } else {
        patchTask(taskId, { progress: 15 })
        sourceAudioPath = await saveUploadedFile(payload, workDir)
      }

      patchTask(taskId, { progress: 30 })
      const normalizedAudioPath = path.join(workDir, 'normalized.wav')
      await normalizeToWav(sourceAudioPath, normalizedAudioPath)

      patchTask(taskId, { progress: 45 })
      const durationSec = await probeDurationSec(normalizedAudioPath)
      if (durationSec > MAX_MINUTES * 60) {
        throw new AppError('DURATION_EXCEEDED', `音频超过 ${MAX_MINUTES} 分钟上限`)
      }

      patchTask(taskId, { progress: 70 })
      const result = await transcribeWithProviderChain(normalizedAudioPath)

      patchTask(taskId, {
        status: 'succeeded',
        progress: 100,
        text: result.text,
        meta: {
          provider: result.provider,
          durationSec,
        },
      })
    } catch (error) {
      patchTask(taskId, {
        status: 'failed',
        progress: 100,
        error: asTaskError(error),
      })
    } finally {
      await fs.rm(workDir, { recursive: true, force: true })
    }
  })()
}
