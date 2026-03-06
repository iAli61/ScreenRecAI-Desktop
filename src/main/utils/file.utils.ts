import { join } from 'path'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync, statSync } from 'fs'
import { app } from 'electron'
import { FilePaths } from '../types'

const CONFIG_FILE = 'storage-config.json'

function getConfigPath(): string {
  return join(app.getPath('userData'), CONFIG_FILE)
}

export async function getStoragePath(): Promise<string> {
  const configPath = getConfigPath()
  if (existsSync(configPath)) {
    try {
      const data = await readFile(configPath, 'utf-8')
      const config = JSON.parse(data)
      if (config.storagePath && typeof config.storagePath === 'string') {
        return config.storagePath
      }
    } catch {
      // fall through to default
    }
  }
  return join(app.getPath('desktop'), 'captured-videos')
}

export async function setStoragePath(newPath: string): Promise<void> {
  const configPath = getConfigPath()
  await writeFile(configPath, JSON.stringify({ storagePath: newPath }), 'utf-8')
}

/**
 * Create the necessary directories for file storage
 */
export async function createStorageDirectories(): Promise<{
  desktopPath: string
  dateDir: string
}> {
  const storagePath = await getStoragePath()

  if (!existsSync(storagePath)) {
    await mkdir(storagePath, { recursive: true })
  }

  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const dateDir = join(storagePath, dateStr)

  if (!existsSync(dateDir)) {
    await mkdir(dateDir, { recursive: true })
  }

  return { desktopPath: storagePath, dateDir }
}

/**
 * Generate file paths for video, transcript, and summary
 */
export function generateFilePaths(dateDir: string, filename: string): FilePaths {
  const videoPath = join(dateDir, `${filename}.mp4`)
  const audioPath = join(dateDir, `${filename}.wav`)
  const transcriptPath = join(dateDir, `${filename}.txt`)
  const summaryPath = join(dateDir, `${filename}-summary.txt`)

  return {
    desktopPath: dateDir,
    dateDir,
    videoPath,
    audioPath,
    transcriptPath,
    summaryPath
  }
}

/**
 * Save video file to disk
 */
export async function saveVideoFile(videoPath: string, videoBlob: Buffer): Promise<void> {
  await writeFile(videoPath, videoBlob)
}

/**
 * Save transcript file to disk
 */
export async function saveTranscriptFile(
  transcriptPath: string,
  transcript: string
): Promise<void> {
  await writeFile(transcriptPath, transcript)
}

/**
 * Save summary file to disk
 */
export async function saveSummaryFile(summaryPath: string, summary: string): Promise<void> {
  await writeFile(summaryPath, summary)
}

/**
 * Generate fallback transcript when Python script is not available
 */
export function generateFallbackTranscript(videoPath: string): string {
  const videoSize = statSync(videoPath).size
  const durationMinutes = Math.max(1, Math.round(videoSize / (2 * 1024 * 1024))) // 2MB per minute

  return `Fallback transcript for ${durationMinutes} minute video recording.

This is a fallback transcript since the Python audio extraction script is not available.
To enable real audio-to-text conversion:

1. Install Python dependencies: pip install -r requirements.txt
2. Install FFmpeg: https://ffmpeg.org/download.html
3. Ensure the audio_extractor.py script is in the project root

Video path: ${videoPath}
Video size: ${videoSize} bytes
Estimated duration: ${durationMinutes} minutes`
}
