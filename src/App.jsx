import { useState, useEffect } from 'react'
import './App.css'
import { callOpenRouter } from './api/openrouter'
import ReactMarkdown from 'react-markdown'

const MODELS = {
  gpt: { name: 'OpenAI', fullName: 'ChatGPT 5.1', id: 'openai/gpt-5.1' },
  gemini: { name: 'Google', fullName: 'Gemini 3 Pro Preview', id: 'google/gemini-3-pro-preview' },
  claude: { name: 'Anthropic', fullName: 'Claude 4.5 Sonnet', id: 'anthropic/claude-sonnet-4.5' },
  grok: { name: 'Grok', fullName: 'Grok 4', id: 'x-ai/grok-4' },
  kimi: { name: 'Kimi', fullName: 'Kimi K2 Thinking', id: 'moonshotai/kimi-k2-thinking' },
  qwen: { name: 'Qwen', fullName: 'Qwen3 VL 235B A22B Thinking', id: 'qwen/qwen3-vl-235b-a22b-thinking' }
}

function App() {
  const [judge, setJudge] = useState('gpt')
  const [workerCount, setWorkerCount] = useState(3)
  const [selectedWorkers, setSelectedWorkers] = useState(['claude', 'grok', 'kimi'])
  const [extendedReport, setExtendedReport] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [attachedFiles, setAttachedFiles] = useState([])

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('godel-judge-history')
    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('godel-judge-history', JSON.stringify(history))
  }, [history])

  const getAvailableWorkers = () => {
    return Object.keys(MODELS).filter(key => key !== judge)
  }

  const handleWorkerToggle = (workerKey) => {
    if (selectedWorkers.includes(workerKey)) {
      setSelectedWorkers(selectedWorkers.filter(k => k !== workerKey))
    } else {
      setSelectedWorkers([...selectedWorkers, workerKey])
    }
  }

  // Update selected workers when judge changes (but preserve count)
  useEffect(() => {
    // Skip if workerCount is 5 - let the workerCount useEffect handle it
    if (workerCount === 5) {
      const available = Object.keys(MODELS).filter(key => key !== judge)
      setSelectedWorkers(available)
      return
    }

    const available = getAvailableWorkers()
    // Remove judge from selected workers if present
    const filtered = selectedWorkers.filter(w => w !== judge)

    if (filtered.length < workerCount) {
      // If we lost workers, add some from available to maintain count
      const toAdd = available.filter(w => !filtered.includes(w)).slice(0, workerCount - filtered.length)
      setSelectedWorkers([...filtered, ...toAdd])
    } else if (filtered.length > workerCount) {
      // If we have too many, trim to the count
      setSelectedWorkers(filtered.slice(0, workerCount))
    } else {
      setSelectedWorkers(filtered)
    }
  }, [judge, workerCount])

  // Update selected workers when worker count changes
  useEffect(() => {
    // Compute available workers inline to avoid stale closure
    const available = Object.keys(MODELS).filter(key => key !== judge)

    if (workerCount === 5) {
      // Select all 5 available workers
      setSelectedWorkers(available)
    } else if (workerCount === 3) {
      // Return to default 3 workers
      const defaults = ['claude', 'grok', 'kimi'].filter(w => w !== judge)
      // If judge is one of the defaults, add another available worker
      if (defaults.length < 3) {
        const additional = available.filter(w => !defaults.includes(w))[0]
        setSelectedWorkers([...defaults, additional])
      } else {
        setSelectedWorkers(defaults)
      }
    }
  }, [workerCount, judge])

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    // Validate worker count
    if (selectedWorkers.length !== workerCount) {
      setOutput(`Error: Please select exactly ${workerCount} workers. Currently selected: ${selectedWorkers.length}`)
      return
    }

    setLoading(true)
    setOutput('Processing...\n\n')

    try {
      // Build the full prompt with file contents if any
      let fullPrompt = prompt
      if (attachedFiles.length > 0) {
        fullPrompt += '\n\n--- Attached Files ---\n\n'
        attachedFiles.forEach(file => {
          fullPrompt += `File: ${file.name}\n\`\`\`\n${file.content}\n\`\`\`\n\n`
        })
      }

      // Call all workers in parallel
      setOutput('Sending prompt to workers...\n\n')
      const workerPromises = selectedWorkers.map(async (workerKey) => {
        const model = MODELS[workerKey]
        const enhancedPrompt = `Use your deep thinking-based response to this prompt and avoid submitting an analysis from elsewhere. In legal language, you are not to use hearsay.\n\n${fullPrompt}`
        const response = await callOpenRouter(
          model.id,
          enhancedPrompt
        )
        return {
          key: workerKey,
          name: model.fullName,
          response: response
        }
      })

      const workerResults = await Promise.all(workerPromises)

      setOutput(`Workers completed. Sending to judge for analysis...\n\n`)

      // Prepare judge prompt with dynamic majority logic
      const majorityCount = workerCount === 3 ? 2 : workerCount === 5 ? '3 or 4' : Math.ceil(workerCount / 2)

      const judgePrompt = `You are a judge evaluating responses from ${workerCount} AI models based on two criteria inspired by Gödel's work in mathematical logic:

1. SOUNDNESS (Correctness): Analyze where models agree. When ${majorityCount} or more models make similar points, assume soundness and mark as majority agreement. When all models agree, that is especially sound.
2. COMPLETENESS: Identify where responses complement each other with valid but different perspectives.

Original Prompt: "${fullPrompt}"

Worker Responses:
${workerResults.map(r => `
[${r.key}] ${r.name}:
${r.response}
`).join('\n---\n')}

Please provide a synthesized report with the following sections:

## I. Areas of Agreement – SOUNDNESS
Label each point with [X] where X is the model acronym(s) that made this point (e.g., [gpt], [gemini,claude], [gpt,gemini,claude,grok,kimi,qwen])
- Majority agreements (${majorityCount}+ models)
- Unanimous agreements (all ${workerCount} models)

## II. Complementary Insights – COMPLETENESS
Valid but different perspectives from different models

## III. Minority Report / Divergent Views
Points made by fewer than ${majorityCount} models but still potentially valuable

## IV. Final Synthesis
Integrated conclusion drawing from soundness and completeness

Format your response clearly with these section headers.`

      // Call judge
      const judgeModel = MODELS[judge]
      const judgeResponse = await callOpenRouter(judgeModel.id, judgePrompt)

      // Build PRELUDE section with exact content if extended report is enabled
      const enhancedPromptForDisplay = `Use your deep thinking-based response to this prompt and avoid submitting an analysis from elsewhere. In legal language, you are not to use hearsay.\n\n${fullPrompt}`
      const preludeSection = extendedReport ? `## PRELUDE

### Original Prompt
${fullPrompt}

### Judge Prompt (sent to each worker)
${enhancedPromptForDisplay}

### Individual Worker Reports
${workerResults.map((r, idx) => `
#### Worker ${idx + 1}: [${r.key}] ${r.name}

${r.response || '[No response received]'}
`).join('\n\n---\n\n')}

---

` : ''

      // Display final output
      const finalOutput = `=== GÖDEL JUDGE ANALYSIS ===
Judge: ${judgeModel.fullName} (${judge})
Workers: ${workerResults.map(r => `${r.name} (${r.key})`).join(', ')}

${preludeSection}${judgeResponse}`

      setOutput(finalOutput)

      // Add to history
      const newEntry = {
        timestamp: new Date().toISOString(),
        prompt,
        judge: judgeModel.fullName,
        workers: workerResults.map(r => r.name),
        output: finalOutput
      }
      setHistory([newEntry, ...history])

    } catch (error) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    if (confirm('Clear all history?')) {
      setHistory([])
      localStorage.removeItem('godel-judge-history')
    }
  }

  const saveReport = () => {
    if (!output) return

    // Create markdown content
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `godel-judge-report-${timestamp}.md`

    // Create blob and download
    const blob = new Blob([output], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)

    const filePromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            name: file.name,
            content: e.target.result
          })
        }
        reader.onerror = reject
        reader.readAsText(file)
      })
    })

    try {
      const newFiles = await Promise.all(filePromises)
      setAttachedFiles([...attachedFiles, ...newFiles])
    } catch (error) {
      console.error('Error reading files:', error)
    }

    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  const removeFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index))
  }

  return (
    <div className="app">
      <div className="left-pane">
        <h1>Gödel Judge</h1>
        <p className="credit">Co-Created by Paul Fishwick and Claude Code</p>

        <div className="section">
          <h3>Select Judge</h3>
          <div className="model-selector">
            {Object.entries(MODELS).map(([key, model]) => (
              <label key={key} className="model-option">
                <input
                  type="radio"
                  name="judge"
                  value={key}
                  checked={judge === key}
                  onChange={(e) => setJudge(e.target.value)}
                />
                <span>({key}) {model.fullName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Worker Count</h3>
          <div className="model-selector">
            <label className="model-option">
              <input
                type="radio"
                name="workerCount"
                value="3"
                checked={workerCount === 3}
                onChange={() => setWorkerCount(3)}
              />
              <span>3 Workers</span>
            </label>
            <label className="model-option">
              <input
                type="radio"
                name="workerCount"
                value="5"
                checked={workerCount === 5}
                onChange={() => setWorkerCount(5)}
              />
              <span>5 Workers</span>
            </label>
          </div>
        </div>

        <div className="section">
          <h3>Select Workers ({selectedWorkers.length}/{workerCount} selected)</h3>
          <div className="workers-list">
            {getAvailableWorkers().map(key => (
              <label key={key} className="worker-checkbox">
                <input
                  type="checkbox"
                  checked={selectedWorkers.includes(key)}
                  onChange={() => handleWorkerToggle(key)}
                />
                <span>({key}) {MODELS[key].fullName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Extended Report</h3>
          <label className="worker-checkbox">
            <input
              type="checkbox"
              checked={extendedReport}
              onChange={(e) => setExtendedReport(e.target.checked)}
            />
            <span>Include prelude (original prompt, judge prompt, and individual worker reports)</span>
          </label>
        </div>

        <div className="section">
          <h3>Prompt</h3>
          <div className="prompt-container">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows="8"
            />
            <input
              type="file"
              id="file-input"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              className="attach-file-btn"
              onClick={() => document.getElementById('file-input').click()}
              title="Attach files"
            >
              +
            </button>
          </div>
          {attachedFiles.length > 0 && (
            <div className="attached-files">
              <h4>Attached Files:</h4>
              {attachedFiles.map((file, index) => (
                <div key={index} className="attached-file">
                  <span className="file-name">{file.name}</span>
                  <button
                    className="remove-file-btn"
                    onClick={() => removeFile(index)}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="submit-btn"
          >
            {loading ? 'Processing...' : 'Submit to Workers & Judge'}
          </button>
        </div>

        <div className="section">
          <h3>History</h3>
          <div className="history-controls">
            <button onClick={clearHistory} disabled={history.length === 0}>
              Clear History
            </button>
            <span className="history-count">{history.length} entries</span>
          </div>
          <div className="history-list">
            {history.map((entry, idx) => (
              <div
                key={idx}
                className="history-entry"
                onClick={() => {
                  setPrompt(entry.prompt)
                  setOutput(entry.output)
                }}
              >
                <div className="history-time">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="history-prompt">
                  {entry.prompt.substring(0, 100)}
                  {entry.prompt.length > 100 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <button
            onClick={saveReport}
            disabled={!output || output === 'No output yet. Submit a prompt to begin.'}
            className="save-report-btn"
          >
            Save Report as .md
          </button>
        </div>
      </div>

      <div className="right-pane">
        <h2>Output</h2>
        <div className="output-area">
          {output ? (
            <ReactMarkdown>{output}</ReactMarkdown>
          ) : (
            <p>No output yet. Submit a prompt to begin.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
