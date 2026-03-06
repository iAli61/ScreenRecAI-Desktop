import React, { useState, useEffect } from 'react'
import { VideoIcon, MonitorIcon, CropIcon } from '../icons'
import { CropOverlay } from '../CropOverlay'
import { CropRegion } from '../../types'

interface VideoPreviewProps {
  stream: MediaStream | null
  recordedVideo: string | null
  previewVideoRef: React.RefObject<HTMLVideoElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  cropRegion: CropRegion | null
  cropEnabled: boolean
  isPreviewing: boolean
  isRecording: boolean
  selectedScreen: { id: string; name: string } | null
  onCropChange: (region: CropRegion | null) => void
  onCropEnabledChange: (enabled: boolean) => void
  onStartPreview: () => Promise<void>
  onStopPreview: () => void
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  stream,
  recordedVideo,
  previewVideoRef,
  videoRef,
  cropRegion,
  cropEnabled,
  isPreviewing,
  isRecording,
  selectedScreen,
  onCropChange,
  onCropEnabledChange,
  onStartPreview,
  onStopPreview
}) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    setVideoElement(previewVideoRef.current)
  }, [previewVideoRef, stream])

  const handleToggleCrop = (): void => {
    if (cropEnabled) {
      onCropEnabledChange(false)
    } else {
      onCropEnabledChange(true)
      if (!stream && selectedScreen && !isRecording) {
        onStartPreview()
      }
    }
  }

  const handleClearCrop = (): void => {
    onCropChange(null)
    onCropEnabledChange(false)
  }

  return (
    <div className="video-grid">
      <div className="video-card">
        <div className="video-card-header">
          <div className="video-card-title">
            <MonitorIcon />
            <h2 className="video-card-heading">Live Preview</h2>
          </div>
          <div className="crop-controls">
            <button
              className={`crop-toggle-btn ${cropEnabled ? 'crop-toggle-active' : ''}`}
              onClick={handleToggleCrop}
              title={cropEnabled ? 'Finish crop selection' : 'Select crop region'}
            >
              <CropIcon width={16} height={16} />
              {cropEnabled ? 'Drawing...' : 'Crop'}
            </button>
            {cropRegion && (
              <button className="crop-clear-btn" onClick={handleClearCrop} title="Clear crop">
                ✕
              </button>
            )}
            {isPreviewing && !isRecording && (
              <button className="crop-preview-stop-btn" onClick={onStopPreview}>
                Stop Preview
              </button>
            )}
          </div>
          <p className="video-card-description">
            {cropRegion
              ? 'Crop region selected — recording will capture only the selected area'
              : cropEnabled
                ? 'Draw a rectangle on the preview to select a crop region'
                : 'Real-time preview of your screen recording'}
          </p>
        </div>
        <div className="video-card-content">
          <div className="video-container">
            <video ref={previewVideoRef} autoPlay muted className="video-element" />
            {stream && (
              <CropOverlay
                enabled={cropEnabled}
                cropRegion={cropRegion}
                videoElement={videoElement}
                onCropChange={onCropChange}
              />
            )}
            {!stream && (
              <div className="video-placeholder">
                <div className="video-placeholder-content">
                  <div className="video-placeholder-icon">
                    <MonitorIcon />
                  </div>
                  <p className="video-placeholder-text">
                    {cropEnabled
                      ? 'Starting preview for crop selection...'
                      : 'Preview will appear here'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="video-card">
        <div className="video-card-header">
          <div className="video-card-title">
            <VideoIcon />
            <h2 className="video-card-heading">Recorded Video</h2>
          </div>
          <p className="video-card-description">Playback of your completed recording</p>
        </div>
        <div className="video-card-content">
          <div className="video-container">
            {recordedVideo ? (
              <video
                ref={videoRef}
                controls
                className="video-element-recorded"
                src={recordedVideo}
              />
            ) : (
              <div className="video-empty">
                <div className="video-empty-content">
                  <div className="video-empty-icon">
                    <VideoIcon />
                  </div>
                  <p className="video-empty-text">No recording available</p>
                  <p className="video-empty-subtext">Start recording to see your video here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
