import { useState, useRef, useEffect, useCallback } from 'react'
import { RecordingType, DesktopCaptureConstraints, DesktopSource } from '../types'
import {
  generateFilename,
  generateTranscriptFilename,
  getVideoMimeType
} from '../utils/recording.utils'

interface UseRecordingReturn {
  stream: MediaStream | null
  isRecording: boolean
  recordedVideo: string | null
  isSaving: boolean
  isProcessingTranscript: boolean
  saveMessage: string
  transcriptMessage: string
  recordingType: RecordingType
  hasVideo: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  previewVideoRef: React.RefObject<HTMLVideoElement | null>
  availableScreens: DesktopSource[]
  selectedScreen: DesktopSource | null
  timerDuration: number
  timeRemaining: number | null
  setTimerDuration: (minutes: number) => void
  setRecordingType: (type: RecordingType) => void
  setSelectedScreen: (screen: DesktopSource | null) => void
  getAvailableScreens: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => void
  downloadVideo: () => Promise<void>
  processTranscript: () => Promise<void>
}

export const useRecording = (): UseRecordingReturn => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>('')
  const [transcriptMessage, setTranscriptMessage] = useState<string>('')
  const [recordingType, setRecordingType] = useState<RecordingType>(RecordingType.VIDEO)
  const [availableScreens, setAvailableScreens] = useState<DesktopSource[]>([])
  const [selectedScreen, setSelectedScreen] = useState<DesktopSource | null>(null)
  const [timerDuration, setTimerDuration] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const chunksRef = useRef<Blob[]>([])
  const currentBlobRef = useRef<Blob | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopPendingRef = useRef(false)

  useEffect(() => {
    if (previewVideoRef.current && stream) {
      previewVideoRef.current.srcObject = stream
    }
  }, [stream])

  const getAvailableScreens = useCallback(async (): Promise<void> => {
    if (!window.electronAPI) {
      console.error('electronAPI is not available.')
      return
    }

    try {
      const sources = await window.electronAPI.getDesktopSources()
      if (sources && sources.length > 0) {
        setAvailableScreens(sources)
        if (!selectedScreen && sources.length > 0) {
          setSelectedScreen(sources[0])
        }
      }
    } catch (error) {
      console.error('Error getting desktop sources:', error)
    }
  }, [selectedScreen])

  useEffect(() => {
    getAvailableScreens()
  }, [getAvailableScreens])

  const startRecording = async (): Promise<void> => {
    if (!window.electronAPI) {
      console.error('electronAPI is not available.')
      return
    }

    if (!selectedScreen) {
      console.error('No screen selected for recording.')
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedScreen.id
          }
        } as MediaTrackConstraints & DesktopCaptureConstraints,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedScreen.id
          }
        } as MediaTrackConstraints & DesktopCaptureConstraints
      })
      setStream(mediaStream)

      const mimeType = getVideoMimeType()
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: mimeType
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        currentBlobRef.current = blob
        audioBlobRef.current = blob

        if (recordedVideo) {
          URL.revokeObjectURL(recordedVideo)
        }

        const newBlobUrl = URL.createObjectURL(blob)
        setRecordedVideo(newBlobUrl)
        setIsRecording(false)

        const testVideo = document.createElement('video')
        testVideo.onerror = () => {
          console.error('Blob is not a valid video')
        }
        testVideo.src = newBlobUrl

        if (autoStopPendingRef.current) {
          autoStopPendingRef.current = false
          autoSaveAndProcess(blob)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
      }

      mediaRecorder.start(1000)
      setMediaRecorder(mediaRecorder)
      setIsRecording(true)

      if (timerDuration > 0) {
        const totalSeconds = timerDuration * 60
        setTimeRemaining(totalSeconds)
        timerIntervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
                timerIntervalRef.current = null
              }
              autoStopPendingRef.current = true
              mediaRecorder.stop()
              mediaStream.getTracks().forEach((track) => track.stop())
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = (): void => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setTimeRemaining(null)
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
      })
      setStream(null)
    }
  }

  const autoSaveAndProcess = async (blob: Blob): Promise<void> => {
    if (!window.electronAPI) return

    setIsSaving(true)
    setSaveMessage('')
    setIsProcessingTranscript(true)
    setTranscriptMessage('🔄 Timer ended. Saving video and processing transcript...')

    try {
      const filename = generateFilename()
      const saveResult = await window.electronAPI.saveVideo(blob, filename)
      if (saveResult.success) {
        setSaveMessage(
          `✅ ${saveResult.message}\nVideo: ${saveResult.videoPath}\nTranscript: ${saveResult.transcriptPath}`
        )
      } else {
        setSaveMessage(`❌ ${saveResult.message}: ${saveResult.error}`)
      }
    } catch (error) {
      setSaveMessage(`❌ Failed to save video: ${error}`)
    } finally {
      setIsSaving(false)
    }

    try {
      const transcriptFilename = generateTranscriptFilename()
      const result = await window.electronAPI.processTranscript(
        blob,
        transcriptFilename,
        recordingType
      )

      if (result.success) {
        setTranscriptMessage(`✅ Transcript and summary processed successfully!
📝 Transcript: ${result.transcript}
📋 Summary: ${result.summary}
📁 Files:
Transcript: ${result.transcriptPath}
Summary: ${result.summaryPath}`)
      } else {
        setTranscriptMessage(`❌ Failed to process transcript: ${result.error}`)
      }
    } catch (error) {
      setTranscriptMessage(
        `❌ Error processing transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingTranscript(false)
    }
  }

  const downloadVideo = async (): Promise<void> => {
    if (!currentBlobRef.current || !window.electronAPI) {
      console.error('No video blob available or electronAPI not available')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const filename = generateFilename()
      const result = await window.electronAPI.saveVideo(currentBlobRef.current, filename)
      if (result.success) {
        setSaveMessage(
          `✅ ${result.message}\nVideo: ${result.videoPath}\nTranscript: ${result.transcriptPath}`
        )
      } else {
        setSaveMessage(`❌ ${result.message}: ${result.error}`)
      }
    } catch (error) {
      console.error('Error downloading video:', error)
      setSaveMessage(`❌ Failed to save video: ${error}`)
    } finally {
      setIsSaving(false)
    }
  }

  const processTranscript = async (): Promise<void> => {
    if (!currentBlobRef.current || !window.electronAPI) {
      setTranscriptMessage(
        '❌ No video available for transcript processing or electronAPI not available'
      )
      return
    }

    setIsProcessingTranscript(true)
    setTranscriptMessage('🔄 Processing transcript and generating summary...')

    try {
      const filename = generateTranscriptFilename()
      const result = await window.electronAPI.processTranscript(
        currentBlobRef.current,
        filename,
        recordingType
      )

      if (result.success) {
        setTranscriptMessage(`✅ Transcript and summary processed successfully!
📝 Transcript: ${result.transcript}
📋 Summary: ${result.summary}
📁 Files:
Transcript: ${result.transcriptPath}
Summary: ${result.summaryPath}`)
      } else {
        setTranscriptMessage(`❌ Failed to process transcript: ${result.error}`)
      }
    } catch (error) {
      setTranscriptMessage(
        `❌ Error processing transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsProcessingTranscript(false)
    }
  }

  return {
    stream,
    isRecording,
    recordedVideo,
    isSaving,
    isProcessingTranscript,
    saveMessage,
    transcriptMessage,
    recordingType,
    hasVideo: !!currentBlobRef.current,
    videoRef,
    previewVideoRef,
    availableScreens,
    selectedScreen,
    timerDuration,
    timeRemaining,
    setTimerDuration,
    setRecordingType,
    setSelectedScreen,
    getAvailableScreens,
    startRecording,
    stopRecording,
    downloadVideo,
    processTranscript
  }
}
