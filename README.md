# Gödel Judge

A tool that uses one LLM as a "judge" to evaluate and synthesize responses from multiple "worker" LLMs, inspired by Gödel's concepts of soundness and completeness in mathematical logic.

## Overview

This tool allows a judge LLM to coordinate multiple worker LLMs. The workers are specific LLMs that take a prompt (from the judge) and create independent responses. The judge then analyzes these responses and identifies:

- **Soundness (Agreement)**: Where workers agree, especially unanimous and majority opinions
- **Completeness**: Complementary insights from different perspectives
- **Minority Reports**: Valid but divergent viewpoints

A final synthesized report is presented in markdown format to the user.

## Requirements

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **OpenRouter API Key** - Get one at [openrouter.ai](https://openrouter.ai)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/metaphorz/godel-judge.git
   cd godel-judge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `godel-judge` directory with your OpenRouter API key:
   ```bash
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```
   Note: The variable must be prefixed with `VITE_` for Vite to load it.

4. Start the application:
   ```bash
   ./start          # macOS/Linux
   start.bat        # Windows
   ```

## Running the Application

### macOS/Linux
```bash
./start     # Start the server (automatically handles cleanup)
./stop      # Stop the server (optional - start handles this automatically)
```

### Windows
```cmd
start.bat   # Start the server (automatically handles cleanup)
stop.bat    # Stop the server (optional - start.bat handles this automatically)
```

The start script will:
- Automatically detect and clean up any existing server on port 5173
- Start the development server
- Open your default browser to http://localhost:5173/

## Using the Interface

The application features a two-pane interface:

### Left Pane: Configuration

1. **Select Judge** - Choose which LLM will serve as the judge
   - Options: GPT-5.1, Gemini 3 Pro Preview, Claude 4.5 Sonnet, Grok 4, Kimi K2, Qwen3 VL

2. **Worker Count** - Select how many workers to use
   - 3 Workers (default)
   - 5 Workers

3. **Select Workers** - Choose specific workers via checkboxes
   - The judge is automatically excluded from the worker list
   - Must select exactly the number specified in Worker Count
   - Defaults: Claude, Grok, Kimi (when using 3 workers)

4. **Extended Report** - Optional checkbox
   - When enabled, includes a PRELUDE section with:
     - Original prompt (verbatim)
     - Enhanced prompt sent to workers
     - Individual worker reports (verbatim)

5. **Prompt** - Enter your question or prompt
   - Multi-line text area
   - **"+" Button** - Click to attach one or more files
   - Attached files are displayed below with remove (×) buttons
   - File contents are automatically included in the prompt

6. **Submit Button** - Send prompt to workers and judge

7. **History** - Previous queries are saved locally
   - Click any entry to reload that prompt and output
   - Clear History button to remove all entries

8. **Save Report** - Download the current output as a .md file

### Right Pane: Output

The judge's analysis is displayed in markdown format with these sections:

#### I. Areas of Agreement – SOUNDNESS
- Majority agreements (2+ models for 3 workers, 3-4 for 5 workers)
- Unanimous agreements (all models)
- Each point labeled with contributing models (e.g., [gpt,gemini,claude])

#### II. Complementary Insights – COMPLETENESS
- Valid but different perspectives from different models
- Unique contributions that don't overlap

#### III. Minority Report / Divergent Views
- Points made by fewer models but still potentially valuable
- Alternative viewpoints worth considering

#### IV. Final Synthesis
- Integrated conclusion drawing from soundness and completeness
- Holistic perspective combining all insights

## Available Models

| Key | Model Name | Provider |
|-----|------------|----------|
| gpt | ChatGPT 5.1 | OpenAI |
| gemini | Gemini 3 Pro Preview | Google |
| claude | Claude 4.5 Sonnet | Anthropic |
| grok | Grok 4 | X.AI |
| kimi | Kimi K2 Thinking | Moonshot AI |
| qwen | Qwen3 VL 235B A22B Thinking | Alibaba |

## Features

- ✅ Choose judge from 6 top-tier LLMs
- ✅ Select 3 or 5 worker LLMs
- ✅ Custom worker selection via checkboxes
- ✅ File attachment support (multiple files)
- ✅ Extended report mode with full worker responses
- ✅ Markdown-formatted output
- ✅ Local history persistence
- ✅ Export reports as .md files
- ✅ Automatic port conflict handling
- ✅ Cross-platform support (macOS, Linux, Windows)

## How It Works

1. **User submits a prompt** (optionally with attached files)
2. **Workers process independently** - Each selected worker LLM receives the enhanced prompt
3. **Parallel execution** - All workers process simultaneously for speed
4. **Judge analyzes** - The judge receives all worker responses and analyzes them
5. **Synthesis** - Judge identifies agreements, complementary insights, and minority views
6. **Report generated** - Final markdown report displayed to user

## Tips

- **Extended Report**: Enable this to see exactly what each worker said (useful for debugging or deep analysis)
- **File Attachments**: Attach code files, data, or documentation to provide context
- **History**: Use history to compare how different judge/worker combinations handle the same prompt
- **Worker Selection**: Try different combinations to see how model diversity affects insights

## Troubleshooting

**Port already in use?**
- Just run `./start` (or `start.bat`) - it automatically handles cleanup

**API errors?**
- Verify your `.env` file contains a valid `VITE_OPENROUTER_API_KEY`
- Make sure the variable name starts with `VITE_` prefix
- Check your OpenRouter account has sufficient credits

**Workers not responding?**
- Some models may be temporarily unavailable on OpenRouter
- Try selecting different workers

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

**Co-Created by Paul Fishwick and Claude Code**
