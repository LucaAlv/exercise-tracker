import { useRef, useState } from 'react'
import {
  createBackupFilename,
  createBackupJson,
  parseBackup,
} from '../storage'
import type { Exercise, ImportMode, StoredData } from '../types'

type BackupPanelProps = {
  exercises: Exercise[]
  categories: string[]
  onBack: () => void
  onImport: (data: StoredData, mode: ImportMode) => void
}

type PendingBackup = {
  fileName: string
  data: StoredData
}

export function BackupPanel({
  exercises,
  categories,
  onBack,
  onImport,
}: BackupPanelProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingBackup | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearStatus = () => {
    setMessage(null)
    setError(null)
  }

  const downloadBackup = () => {
    clearStatus()
    const blob = new Blob([createBackupJson(exercises, categories)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = createBackupFilename()
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setMessage('Backup downloaded.')
  }

  const copyBackup = async () => {
    clearStatus()

    try {
      await navigator.clipboard.writeText(createBackupJson(exercises, categories))
      setMessage('Backup copied. You can paste it into Notes or a message to yourself.')
    } catch {
      setError('Clipboard access was unavailable. Try downloading the backup instead.')
    }
  }

  const readFile = async (file: File) => {
    clearStatus()

    try {
      const data = parseBackup(await file.text())
      setPending({ fileName: file.name, data })
    } catch (fileError) {
      setPending(null)
      setError(fileError instanceof Error ? fileError.message : 'That backup could not be read.')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const completeImport = (mode: ImportMode) => {
    if (!pending) return

    if (
      mode === 'replace' &&
      !window.confirm('Replace all library data on this device with this backup?')
    ) {
      return
    }

    onImport(pending.data, mode)
    setMessage(
      `${pending.data.exercises.length} exercise${pending.data.exercises.length === 1 ? '' : 's'} ${
        mode === 'replace' ? 'restored' : 'merged'
      }.`,
    )
    setPending(null)
  }

  return (
    <main className="page-shell backup-page">
      <header className="subpage-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Go back">
          ←
        </button>
        <div>
          <p className="eyebrow">On-device data</p>
          <h1>Backup & restore</h1>
        </div>
      </header>

      <section className="panel">
        <p className="panel-kicker">Export</p>
        <h2>Keep a copy somewhere safe</h2>
        <p>
          Your {exercises.length} exercise{exercises.length === 1 ? '' : 's'} live only on this
          device. Export after adding a batch or before removing this app from your home screen.
        </p>
        <div className="stacked-actions">
          <button className="button button-primary" type="button" onClick={downloadBackup}>
            Download JSON backup
          </button>
          <button className="button button-secondary" type="button" onClick={copyBackup}>
            Copy backup to clipboard
          </button>
        </div>
      </section>

      <section className="panel">
        <p className="panel-kicker">Import</p>
        <h2>Restore a JSON backup</h2>
        <p>Choose a file exported by Exercise Library, then merge it or replace this device's data.</p>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void readFile(file)
          }}
        />
        <button
          className="button button-secondary"
          type="button"
          onClick={() => fileInput.current?.click()}
        >
          Choose backup file
        </button>

        {pending && (
          <div className="import-choice">
            <strong>{pending.fileName}</strong>
            <p>
              Contains {pending.data.exercises.length} exercise
              {pending.data.exercises.length === 1 ? '' : 's'} and{' '}
              {pending.data.categories.length} categor
              {pending.data.categories.length === 1 ? 'y' : 'ies'}.
            </p>
            <button className="button button-primary" type="button" onClick={() => completeImport('merge')}>
              Merge with this device
            </button>
            <button className="button button-danger" type="button" onClick={() => completeImport('replace')}>
              Replace everything
            </button>
          </div>
        )}
      </section>

      {message && <p className="status-message" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </main>
  )
}
