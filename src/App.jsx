import { useMemo, useRef, useState } from 'react'
import './App.css'
import { buildTree, renderTreeLines } from './ingest/buildTree'
import { formatDigest, estimateTokens } from './ingest/digestText'
import { filterFilesByGlob } from './ingest/matchGlobs'
import { pickDirectoryAndWalk } from './ingest/walkDirectory'

const DEFAULT_MAX_KB = 50
const MAX_TOTAL_BYTES = 25 * 1024 * 1024
const MAX_FILES = 2000

function App() {
  const inputRef = useRef(null)
  const [fileEntries, setFileEntries] = useState([])
  const [excludeRaw, setExcludeRaw] = useState('*.md, node_modules/**, .git/**')
  const [maxKb, setMaxKb] = useState(DEFAULT_MAX_KB)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processed, setProcessed] = useState(null)

  const handlePickFolderFallback = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleFilesChange = (event) => {
    const list = Array.from(event.target.files || [])
    if (!list.length) return

    const mapped = list.map((file) => ({
      file,
      relativePath: file.webkitRelativePath || file.name,
      size: file.size,
    }))

    setFileEntries(mapped)
    setProcessed(null)
    setError('')
  }

  const handleBrowserPicker = async () => {
    setError('')
    setProcessed(null)
    try {
      setLoading(true)
      const entries = await pickDirectoryAndWalk()
      setFileEntries(entries)
    } catch (err) {
      if (err?.name === 'AbortError') {
        setError('Directory selection was cancelled.')
      } else if (err?.message) {
        setError(err.message)
      } else {
        setError('Browser directory picker is not available.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleIngest = async () => {
    if (!fileEntries.length) {
      setError('Please choose a folder first.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const excludePatterns = excludeRaw
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

      const filtered = filterFilesByGlob(fileEntries, excludePatterns)

      if (!filtered.length) {
        setError('All files were excluded by your patterns.')
        setProcessed(null)
        setLoading(false)
        return
      }

      if (filtered.length > MAX_FILES) {
        setError(
          `Too many files selected (${filtered.length}). Limit is ${MAX_FILES}.`,
        )
        setProcessed(null)
        setLoading(false)
        return
      }

      const includeLimit = (Number(maxKb) || DEFAULT_MAX_KB) * 1024
      let totalBytesRead = 0
      let totalChars = 0

      const processedFiles = []

      for (const entry of filtered) {
        const relPath = entry.relativePath.replace(/\\/g, '/')
        const willFitBytes =
          entry.size <= includeLimit &&
          totalBytesRead + entry.size <= MAX_TOTAL_BYTES

        if (willFitBytes) {
          // eslint-disable-next-line no-await-in-loop
          const text = await entry.file.text()
          totalBytesRead += entry.size
          totalChars += text.length

          processedFiles.push({
            relativePath: relPath,
            size: entry.size,
            included: true,
            content: text,
          })
        } else {
          processedFiles.push({
            relativePath: relPath,
            size: entry.size,
            included: false,
            content: null,
          })
        }
      }

      const snapshotId =
        (window.crypto &&
          window.crypto.randomUUID &&
          window.crypto.randomUUID()) ||
        Math.random().toString(36).slice(2, 10)

      setProcessed({
        files: processedFiles,
        totalChars,
        snapshotId,
        filesAnalyzed: filtered.length,
      })
    } catch (err) {
      console.error(err)
      setError('Something went wrong while ingesting this folder.')
      setProcessed(null)
    } finally {
      setLoading(false)
    }
  }

  const directoryTree = useMemo(() => {
    if (!processed?.files?.length) return ''
    const paths = processed.files.map((f) => f.relativePath)
    const tree = buildTree(paths)
    const lines = renderTreeLines(tree)
    return lines.join('\n')
  }, [processed])

  const digestText = useMemo(() => {
    if (!processed?.files?.length) return ''
    return formatDigest(processed.files)
  }, [processed])

  const tokens = processed ? estimateTokens(processed.totalChars) : 0

  const handleCopyAll = async () => {
    if (!digestText) return
    try {
      await navigator.clipboard.writeText(digestText)
    } catch {
      setError('Unable to copy to clipboard.')
    }
  }

  const handleDownload = () => {
    if (!digestText) return
    const blob = new Blob([digestText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'folder-digest.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-root">
      <header className="hero-header">
        <h1>Folder Ingest</h1>
        <p>Turn any local folder into a simple text digest.</p>
      </header>

      <section className="controls">
        <div className="controls-row">
          <button
            type="button"
            className="primary-btn"
            onClick={handlePickFolderFallback}
          >
            Choose folder
          </button>
          <input
            ref={inputRef}
            type="file"
            style={{ display: 'none' }}
            webkitdirectory="true"
            directory=""
            multiple
            onChange={handleFilesChange}
          />

          <button
            type="button"
            className="secondary-btn"
            onClick={handleBrowserPicker}
          >
            Use browser picker
          </button>

          <div className="control-group">
            <label htmlFor="exclude-input">Exclude</label>
            <input
              id="exclude-input"
              type="text"
              value={excludeRaw}
              onChange={(event) => setExcludeRaw(event.target.value)}
              placeholder="*.md, node_modules/**"
            />
          </div>

          <div className="control-group small">
            <label htmlFor="max-kb-input">Include files under</label>
            <div className="inline-input">
              <input
                id="max-kb-input"
                type="number"
                min="1"
                value={maxKb}
                onChange={(event) => setMaxKb(event.target.value)}
              />
              <span>KB</span>
            </div>
          </div>

          <button
            type="button"
            className="ingest-btn"
            onClick={handleIngest}
            disabled={loading}
          >
            {loading ? 'Ingesting…' : 'Ingest'}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="cards">
        <div className="card summary-card">
          <h2>Summary</h2>
          {processed ? (
            <pre className="summary-pre">
{`Files analyzed: ${processed.filesAnalyzed}
Estimated tokens: ${tokens}
Snapshot Id: ${processed.snapshotId}`}
            </pre>
          ) : (
            <p className="muted">Ingest a folder to see the summary.</p>
          )}
        </div>

        <div className="card structure-card">
          <h2>Directory Structure</h2>
          {directoryTree ? (
            <pre className="mono-scroll">{directoryTree}</pre>
          ) : (
            <p className="muted">Directory tree will appear here.</p>
          )}
        </div>
      </section>

      <section className="card files-card">
        <div className="files-card-header">
          <h2>Files Content</h2>
          <div className="files-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={handleCopyAll}
              disabled={!digestText}
            >
              Copy all
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleDownload}
              disabled={!digestText}
            >
              Download
            </button>
          </div>
        </div>

        {digestText ? (
          <pre className="mono-scroll files-pre">{digestText}</pre>
        ) : (
          <p className="muted">Ingested file contents will appear here.</p>
        )}
      </section>
    </div>
  )
}

export default App
