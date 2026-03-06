import React, { useRef, useState, useCallback, useEffect } from 'react'
import { CropRegion } from '../../types'

interface CropOverlayProps {
  enabled: boolean
  cropRegion: CropRegion | null
  videoElement: HTMLVideoElement | null
  onCropChange: (region: CropRegion | null) => void
}

function getVideoDisplayRect(video: HTMLVideoElement) {
  const containerWidth = video.clientWidth
  const containerHeight = video.clientHeight
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight

  if (!videoWidth || !videoHeight) {
    return { offsetX: 0, offsetY: 0, displayWidth: containerWidth, displayHeight: containerHeight }
  }

  const containerAspect = containerWidth / containerHeight
  const videoAspect = videoWidth / videoHeight

  let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number

  if (videoAspect > containerAspect) {
    displayWidth = containerWidth
    displayHeight = containerWidth / videoAspect
    offsetX = 0
    offsetY = (containerHeight - displayHeight) / 2
  } else {
    displayHeight = containerHeight
    displayWidth = containerHeight * videoAspect
    offsetX = (containerWidth - displayWidth) / 2
    offsetY = 0
  }

  return { offsetX, offsetY, displayWidth, displayHeight }
}

export const CropOverlay: React.FC<CropOverlayProps> = ({
  enabled,
  cropRegion,
  videoElement,
  onCropChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startNorm, setStartNorm] = useState<{ x: number; y: number } | null>(null)
  const [currentNorm, setCurrentNorm] = useState<{ x: number; y: number } | null>(null)

  const toNormalizedVideoCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas || !videoElement) return { x: 0, y: 0 }

      const canvasRect = canvas.getBoundingClientRect()
      const { offsetX, offsetY, displayWidth, displayHeight } =
        getVideoDisplayRect(videoElement)

      const mx = clientX - canvasRect.left
      const my = clientY - canvasRect.top

      const vx = (mx - offsetX) / displayWidth
      const vy = (my - offsetY) / displayHeight

      return {
        x: Math.max(0, Math.min(1, vx)),
        y: Math.max(0, Math.min(1, vy))
      }
    },
    [videoElement]
  )

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !videoElement) return

    canvas.width = videoElement.clientWidth
    canvas.height = videoElement.clientHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const region =
      isDragging && startNorm && currentNorm
        ? {
            x: Math.min(startNorm.x, currentNorm.x),
            y: Math.min(startNorm.y, currentNorm.y),
            width: Math.abs(currentNorm.x - startNorm.x),
            height: Math.abs(currentNorm.y - startNorm.y)
          }
        : cropRegion

    if (!region || region.width < 0.005 || region.height < 0.005) return

    const { offsetX, offsetY, displayWidth, displayHeight } =
      getVideoDisplayRect(videoElement)

    const rx = offsetX + region.x * displayWidth
    const ry = offsetY + region.y * displayHeight
    const rw = region.width * displayWidth
    const rh = region.height * displayHeight

    // Semi-transparent overlay outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(0, 0, canvas.width, ry)
    ctx.fillRect(0, ry + rh, canvas.width, canvas.height - ry - rh)
    ctx.fillRect(0, ry, rx, rh)
    ctx.fillRect(rx + rw, ry, canvas.width - rx - rw, rh)

    // Crop border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 3])
    ctx.strokeRect(rx, ry, rw, rh)

    // Corner handles
    const hs = 8
    ctx.fillStyle = '#3b82f6'
    ctx.setLineDash([])
    for (const [cx, cy] of [
      [rx, ry],
      [rx + rw, ry],
      [rx, ry + rh],
      [rx + rw, ry + rh]
    ]) {
      ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs)
    }

    // Dimension label
    if (videoElement.videoWidth && videoElement.videoHeight) {
      const cropW = Math.round(region.width * videoElement.videoWidth)
      const cropH = Math.round(region.height * videoElement.videoHeight)
      const label = `${cropW} × ${cropH}`
      ctx.font = '12px Inter, sans-serif'
      ctx.fillStyle = '#3b82f6'
      const tm = ctx.measureText(label)
      const lx = rx + rw / 2 - tm.width / 2
      const ly = ry - 6
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(lx - 4, ly - 12, tm.width + 8, 16)
      ctx.fillStyle = '#93c5fd'
      ctx.fillText(label, lx, ly)
    }
  }, [cropRegion, isDragging, startNorm, currentNorm, videoElement])

  useEffect(() => {
    drawOverlay()
  }, [drawOverlay])

  useEffect(() => {
    const video = videoElement
    if (!video) return

    const observer = new ResizeObserver(() => drawOverlay())
    observer.observe(video)
    return () => observer.disconnect()
  }, [videoElement, drawOverlay])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return
    const pos = toNormalizedVideoCoords(e.clientX, e.clientY)
    setStartNorm(pos)
    setCurrentNorm(pos)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !enabled) return
    setCurrentNorm(toNormalizedVideoCoords(e.clientX, e.clientY))
  }

  const handleMouseUp = () => {
    if (!isDragging || !startNorm || !currentNorm) return
    setIsDragging(false)

    const x = Math.min(startNorm.x, currentNorm.x)
    const y = Math.min(startNorm.y, currentNorm.y)
    const width = Math.abs(currentNorm.x - startNorm.x)
    const height = Math.abs(currentNorm.y - startNorm.y)

    if (width > 0.01 && height > 0.01) {
      onCropChange({ x, y, width, height })
    }

    setStartNorm(null)
    setCurrentNorm(null)
  }

  if (!enabled && !cropRegion) return null

  return (
    <canvas
      ref={canvasRef}
      className="crop-overlay-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: enabled ? 'crosshair' : 'default',
        pointerEvents: enabled ? 'auto' : 'none'
      }}
    />
  )
}
