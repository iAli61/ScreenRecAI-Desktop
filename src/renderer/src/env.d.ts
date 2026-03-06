/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      getDesktopSources: () => Promise<DesktopSource[]>
      saveVideo: (blob: Blob, filename: string) => Promise<SaveVideoResponse>
      processTranscript: (
        blob: Blob,
        filename: string,
        type: RecordingType
      ) => Promise<ProcessTranscriptResponse>
      getStoragePath: () => Promise<string>
      selectStoragePath: () => Promise<string | null>
    }
  }
}

export {}
