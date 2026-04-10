# AI Web Designer

AI Web Designer is a React app for iteratively building static web pages with OpenAI. It combines a live preview, editable HTML/CSS/JS panes, and a chat workflow that can rewrite the page based on natural-language instructions.

Live demo: https://csansoon.github.io/ai-web-designer/

## What's improved in this version

- Replaced the old single-shot JSON schema flow with a tool-driven OpenAI Responses API loop.
- Introduced explicit code-editing tools: `setHtml`, `setCss`, and `setJs`.
- Kept the app frontend-only while making the AI editing flow more agentic and iterative.
- Preserved model selection, API key management, and usage tracking from the previous branch, while preferring explicit modern model IDs when a key exposes them.
- Improved error handling for invalid keys, rate limits, networking failures, and context-length issues.
- Added tests for the new orchestration helpers and multi-step tool loop.

## How it works

The app sends the current conversation plus the latest HTML, CSS, and JavaScript artifacts to the OpenAI Responses API. Instead of returning one giant JSON blob, the model works through a local tool loop:

1. The model reads the current page state and the latest user request.
2. It calls browser-defined tools such as `setHtml`, `setCss`, and `setJs` whenever it wants to update an artifact.
3. The app applies each tool call locally, records the operation in chat history, and sends the tool results back to the model.
4. The loop continues until the model stops calling tools and returns a final assistant summary for the user.

This architecture makes edits more explainable, better matches modern agent/tool workflows, and keeps the code generation logic understandable in a static client-side app.

## Local development

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Testing

```bash
npm test
npm run build
```

## API key model

This app currently sends requests directly from the browser to OpenAI using a user-provided API key stored in local storage. The model picker uses a curated preferred list of explicit model IDs (for example `gpt-5.4` and `gpt-5.3-codex`) but only shows entries that the current key can actually access via `/v1/models`, with a generic `gpt-5` fallback retained for compatibility.

For safety:

- prefer a project-scoped key
- set a spend limit
- do not use a high-privilege personal production key

A future backend proxy could further improve security and observability, but this repo intentionally keeps the product as a static client app.

## Limitations

- The app is optimized for a single static page rather than full multi-page apps.
- Very large HTML/CSS/JS payloads can still hit model context limits.
- Tool calls currently replace entire artifacts rather than patching subsections in place.
- Browser-side API usage is convenient for demos, but a server-side proxy is safer for production deployments.
