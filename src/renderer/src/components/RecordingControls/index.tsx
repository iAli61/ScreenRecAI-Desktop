import React from 'react'
import { RecordingType, DesktopSource } from '../../types'
import { getRecordingTypeIcon, getRecordingTypeLabel } from '../../utils/recording.utils'
import { getButtonClasses } from '../../utils/ui.utils'
import { PlayIcon, SquareIcon, DownloadIcon, FileTextIcon, LoaderIcon, VideoIcon } from '../icons'

interface RecordingControlsProps {
  isRecording: boolean
  isSaving: boolean
  isProcessingTranscript: boolean
  hasVideo: boolean
  recordingType: RecordingType
  selectedScreen: DesktopSource | null
  timerDuration: number
  timeRemaining: number | null
  onTimerDurationChange: (minutes: number) => void
  onRecordingTypeChange: (type: RecordingType) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onDownloadVideo: () => void
  onProcessTranscript: () => void
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isSaving,
  isProcessingTranscript,
  hasVideo,
  recordingType,
  selectedScreen,
  timerDuration,
  timeRemaining,
  onTimerDurationChange,
  onRecordingTypeChange,
  onStartRecording,
  onStopRecording,
  onDownloadVideo,
  onProcessTranscript
}) => {
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="controls-card">
      <div className="controls-header">
        <div className="controls-title">
          <div className="controls-icon">
            <VideoIcon />
          </div>
          <h2 className="controls-heading">Recording Controls</h2>
        </div>
        <p className="controls-description">Start and manage your screen recording session</p>
      </div>
      <div className="controls-content">
        <div className="controls-section">
          <label className="controls-label">Recording Type</label>
          <div className="controls-options">
            {Object.values(RecordingType).map((type) => (
              <label key={type} className="controls-option">
                <input
                  type="radio"
                  name="recordingType"
                  value={type}
                  checked={recordingType === type}
                  onChange={(e) => onRecordingTypeChange(e.target.value as RecordingType)}
                  className="controls-radio"
                />
                <div className="controls-option-content">
                  {getRecordingTypeIcon(type)}
                  {getRecordingTypeLabel(type)}
                </div>
              </label>
            ))}
          </div>
        </div>

        <hr className="controls-divider" />

        <div className="controls-section">
          <label className="controls-label">Recording Timer (optional)</label>
          <div className="timer-input-group">
            <input
              type="number"
              min="0"
              max="480"
              value={timerDuration || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                onTimerDurationChange(isNaN(val) || val < 0 ? 0 : Math.min(val, 480))
              }}
              disabled={isRecording}
              placeholder="0"
              className="timer-input"
            />
            <span className="timer-unit">minutes</span>
            {timerDuration > 0 && !isRecording && (
              <span className="timer-hint">
                Recording will auto-stop after {timerDuration} min and save video + transcript
              </span>
            )}
            {timeRemaining !== null && isRecording && (
              <span className="timer-countdown">
                ⏱ {formatTime(timeRemaining)} remaining
              </span>
            )}
          </div>
        </div>

        <hr className="controls-divider" />

        <div className="controls-buttons">
          <button
            onClick={onStartRecording}
            disabled={isRecording || !selectedScreen}
            className={getButtonClasses('danger', isRecording || !selectedScreen)}
            title={!selectedScreen ? 'Please select a screen to record' : undefined}
          >
            {isRecording ? (
              <>
                <LoaderIcon />
                <span className="btn-icon">Recording...</span>
              </>
            ) : (
              <>
                <PlayIcon />
                <span className="btn-icon">Start Recording</span>
              </>
            )}
          </button>

          <button
            onClick={onStopRecording}
            disabled={!isRecording}
            className={getButtonClasses('secondary', !isRecording)}
          >
            <SquareIcon />
            <span className="btn-icon">Stop Recording</span>
          </button>

          <button
            onClick={onDownloadVideo}
            disabled={!hasVideo || isSaving}
            className={getButtonClasses('secondary', !hasVideo || isSaving)}
          >
            {isSaving ? (
              <>
                <LoaderIcon />
                <span className="btn-icon">Saving...</span>
              </>
            ) : (
              <>
                <DownloadIcon />
                <span className="btn-icon">Download Video</span>
              </>
            )}
          </button>

          <button
            onClick={onProcessTranscript}
            disabled={!hasVideo || isProcessingTranscript}
            className={getButtonClasses('success', !hasVideo || isProcessingTranscript)}
          >
            {isProcessingTranscript ? (
              <>
                <LoaderIcon />
                <span className="btn-icon">Processing...</span>
              </>
            ) : (
              <>
                <FileTextIcon />
                <span className="btn-icon">Extract Transcript</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
