import { useState, useEffect } from 'react'
import { getButtonClasses } from '../../utils/ui.utils'

export const StoragePath: React.FC = (): React.JSX.Element => {
  const [storagePath, setStoragePath] = useState<string>('')

  useEffect(() => {
    window.electronAPI.getStoragePath().then(setStoragePath)
  }, [])

  const handleChangePath = async (): Promise<void> => {
    const newPath = await window.electronAPI.selectStoragePath()
    if (newPath) {
      setStoragePath(newPath)
    }
  }

  return (
    <div className="screen-selector-card">
      <div className="screen-selector-header">
        <div className="screen-selector-title">
          <div className="screen-selector-icon">📁</div>
          <h3 className="screen-selector-heading">Storage Location</h3>
        </div>
        <button
          onClick={handleChangePath}
          className={getButtonClasses('secondary')}
          title="Change storage folder"
        >
          Change
        </button>
      </div>
      <div className="screen-selector-content">
        <p className="screen-selector-empty-text" style={{ wordBreak: 'break-all' }}>
          {storagePath}
        </p>
      </div>
    </div>
  )
}
