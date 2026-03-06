import { ipcMain, desktopCapturer, dialog, BrowserWindow } from 'electron'
import { SaveVideoResponse, ProcessTranscriptResponse } from '../types'
import {
  createStorageDirectories,
  generateFilePaths,
  saveVideoFile,
  saveTranscriptFile,
  saveSummaryFile,
  getStoragePath,
  setStoragePath
} from '../utils/file.utils'
import { extractTranscriptFromVideo } from '../utils/transcript.utils'
import { generateSummary } from '../utils/ollama.utils'

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers(): void {
  ipcMain.handle('get-desktop-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 150, height: 150 }
    })
    return sources
  })

  ipcMain.handle('get-storage-path', async () => {
    return await getStoragePath()
  })

  ipcMain.handle('select-storage-path', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: 'Select storage folder for recordings'
    })
    if (!result.canceled && result.filePaths.length > 0) {
      await setStoragePath(result.filePaths[0])
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle(
    'save-video',
    async (_, videoBlob: Buffer, filename: string): Promise<SaveVideoResponse> => {
      try {
        const { dateDir } = await createStorageDirectories()
        const { videoPath, audioPath, transcriptPath } = generateFilePaths(dateDir, filename)

        await saveVideoFile(videoPath, videoBlob)
        await saveTranscriptFile(transcriptPath, '')

        return {
          success: true,
          videoPath,
          audioPath,
          transcriptPath,
          message: 'Video saved successfully!'
        }
      } catch (error) {
        console.error('Error saving video:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to save video'
        }
      }
    }
  )

  ipcMain.handle(
    'process-transcript',
    async (
      _,
      videoBlob: Buffer,
      filename: string,
      recordingType: string
    ): Promise<ProcessTranscriptResponse> => {
      try {
        const { dateDir } = await createStorageDirectories()
        const { videoPath, audioPath, transcriptPath, summaryPath } = generateFilePaths(dateDir, filename)

        await saveVideoFile(videoPath, videoBlob)
        const transcript = await extractTranscriptFromVideo(videoPath, audioPath)
        const summary = await generateSummary(transcript, recordingType)

        await saveTranscriptFile(transcriptPath, transcript)
        await saveSummaryFile(summaryPath, summary)

        return {
          success: true,
          transcript,
          summary,
          audioPath,
          transcriptPath,
          summaryPath,
          message: 'Transcript and summary processed successfully!'
        }
      } catch (error) {
        console.error('Error processing transcript:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to process transcript'
        }
      }
    }
  )
}
