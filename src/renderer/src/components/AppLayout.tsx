import React from 'react'
import { Header } from './Header/index'
import { RecordingControls } from './RecordingControls/index'
import { StatusMessages } from './StatusMessages/index'
import { RecordingStatus } from './RecordingStatus/index'
import { VideoPreview } from './VideoPreview/index'
import { ScreenSelector } from './ScreenSelector/index'
import { StoragePath } from './StoragePath/index'
import { RecordingType, DesktopSource, CropRegion } from '../types'

interface AppLayoutProps {
  isRecording: boolean
  isPreviewing: boolean
  isSaving: boolean
  isProcessingTranscript: boolean
  hasVideo: boolean
  recordingType: RecordingType
  saveMessage: string
  transcriptMessage: string
  previewVideoRef: React.RefObject<HTMLVideoElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  recordedVideo: string | null
  availableScreens: DesktopSource[]
  selectedScreen: DesktopSource | null
  timerDuration: number
  timeRemaining: number | null
  cropRegion: CropRegion | null
  cropEnabled: boolean
  onCropChange: (region: CropRegion | null) => void
  onCropEnabledChange: (enabled: boolean) => void
  onTimerDurationChange: (minutes: number) => void
  onRecordingTypeChange: (type: RecordingType) => void
  onScreenSelect: (screen: DesktopSource | null) => void
  onRefreshScreens: () => Promise<void>
  onStartPreview: () => Promise<void>
  onStopPreview: () => void
  onStartRecording: () => Promise<void>
  onStopRecording: () => void
  onDownloadVideo: () => Promise<void>
  onProcessTranscript: () => Promise<void>
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  isRecording,
  isPreviewing,
  isSaving,
  isProcessingTranscript,
  hasVideo,
  recordingType,
  saveMessage,
  transcriptMessage,
  previewVideoRef,
  videoRef,
  stream,
  recordedVideo,
  availableScreens,
  selectedScreen,
  timerDuration,
  timeRemaining,
  cropRegion,
  cropEnabled,
  onCropChange,
  onCropEnabledChange,
  onTimerDurationChange,
  onRecordingTypeChange,
  onScreenSelect,
  onRefreshScreens,
  onStartPreview,
  onStopPreview,
  onStartRecording,
  onStopRecording,
  onDownloadVideo,
  onProcessTranscript
}) => {
  return (
    <div className="app-container">
      <div className="app-content">
        <Header />

        <ScreenSelector
          availableScreens={availableScreens}
          selectedScreen={selectedScreen}
          onScreenSelect={onScreenSelect}
          onRefreshScreens={onRefreshScreens}
        />

        <StoragePath />

        <RecordingControls
          isRecording={isRecording}
          isSaving={isSaving}
          isProcessingTranscript={isProcessingTranscript}
          hasVideo={hasVideo}
          recordingType={recordingType}
          selectedScreen={selectedScreen}
          timerDuration={timerDuration}
          timeRemaining={timeRemaining}
          onTimerDurationChange={onTimerDurationChange}
          onRecordingTypeChange={onRecordingTypeChange}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onDownloadVideo={onDownloadVideo}
          onProcessTranscript={onProcessTranscript}
        />

        <StatusMessages saveMessage={saveMessage} transcriptMessage={transcriptMessage} />

        <RecordingStatus isRecording={isRecording} />

        <VideoPreview
          stream={stream}
          recordedVideo={recordedVideo}
          previewVideoRef={previewVideoRef}
          videoRef={videoRef}
          cropRegion={cropRegion}
          cropEnabled={cropEnabled}
          isPreviewing={isPreviewing}
          isRecording={isRecording}
          selectedScreen={selectedScreen}
          onCropChange={onCropChange}
          onCropEnabledChange={onCropEnabledChange}
          onStartPreview={onStartPreview}
          onStopPreview={onStopPreview}
        />
      </div>
    </div>
  )
}
