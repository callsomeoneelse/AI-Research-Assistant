# AI Research Assistant

A Chrome extension that proactively surfaces relevant research papers while you browse academic websites, reducing the time spent on manual literature discovery.

## The problem

Finding relevant research papers is time-consuming, especially for niche topics. Researchers spend a significant portion of their time on discovery alone; searching, cross-referencing, and manually following citation trails before they can do any actual research.

## What it does

The extension monitors what you're reading on academic websites and automatically suggests related papers in a floating sidebar, ranked by relevance. No manual searching required — it works in the background as you read.

- Detects research context from the current page
- Fetches related papers via the arXiv API
- Displays suggestions in a floating popup with relevance scores and clickable links
- Lets you hide suggestions or save them for later

**Supported platforms:** arXiv, Google Scholar, IEEE

## What it looks like

<img width="1879" height="758" alt="image" src="https://github.com/user-attachments/assets/b50d235a-b312-4ad8-8469-3440a77d9e33" />

## How it works

```
Page content → Content script extracts research context
                        ↓
              Background script queries arXiv API
              (background script used to bypass CORS)
                        ↓
              OpenAI API performs deeper paper analysis
              and improves suggestion accuracy
                        ↓
              Floating popup displays ranked suggestions
```

The extension uses a content script to read the current page and extract research context. API calls are handled in a background script to bypass CORS restrictions. OpenAI's API is integrated for deeper semantic analysis, improving the relevance of suggestions beyond simple keyword matching.

## Tech stack

- **Extension:** Chrome Extensions API (Manifest V3), JavaScript
- **Paper discovery:** arXiv API
- **AI analysis:** OpenAI API
- **Context detection:** DOM content scripts

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the project folder
5. Navigate to any supported academic site — the assistant will activate automatically

## Key challenges solved

**CORS restrictions** — API calls from content scripts are blocked by browser security policy. Routing requests through a background service worker resolved this without compromising extension security.

**Context accuracy** — Ensuring the extension only triggers on genuine research content (not generic search results) required building detection logic that reads page structure and metadata, not just URL patterns.

## Built at

Built as a functional prototype over 3 days at a hackathon, demonstrating proactive contextual paper suggestions with AI-powered relevance ranking.
