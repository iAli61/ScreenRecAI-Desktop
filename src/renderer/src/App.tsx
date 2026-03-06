import React from 'react'
import { AppLayout } from './components/AppLayout'
import { useRecording } from './hooks/useRecording'

export default function App(): React.JSX.Element {
  const {
    stream,
    isRecording,
    isPreviewing,
    recordedVideo,
    isSaving,
    isProcessingTranscript,
    saveMessage,
    transcriptMessage,
    recordingType,
    hasVideo,
    videoRef,
    previewVideoRef,
    availableScreens,
    selectedScreen,
    timerDuration,
    timeRemaining,
    cropRegion,
    cropEnabled,
    setCropRegion,
    setCropEnabled,
    setTimerDuration,
    setRecordingType,
    setSelectedScreen,
    getAvailableScreens,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    downloadVideo,
    processTranscript
  } = useRecording()

  return (
    <AppLayout
      isRecording={isRecording}
      isPreviewing={isPreviewing}
      isSaving={isSaving}
      isProcessingTranscript={isProcessingTranscript}
      hasVideo={hasVideo}
      recordingType={recordingType}
      saveMessage={saveMessage}
      transcriptMessage={transcriptMessage}
      previewVideoRef={previewVideoRef}
      videoRef={videoRef}
      stream={stream}
      recordedVideo={recordedVideo}
      availableScreens={availableScreens}
      selectedScreen={selectedScreen}
      timerDuration={timerDuration}
      timeRemaining={timeRemaining}
      cropRegion={cropRegion}
      cropEnabled={cropEnabled}
      onCropChange={setCropRegion}
      onCropEnabledChange={setCropEnabled}
      onTimerDurationChange={setTimerDuration}
      onRecordingTypeChange={setRecordingType}
      onScreenSelect={setSelectedScreen}
      onRefreshScreens={getAvailableScreens}
      onStartPreview={startPreview}
      onStopPreview={stopPreview}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onDownloadVideo={downloadVideo}
      onProcessTranscript={processTranscript}
    />
  )
}
