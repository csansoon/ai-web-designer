# AI Web Designer

AI Web Designer is a React app for iteratively building static web pages with OpenAI. It combines a live preview, editable HTML/CSS/JS panes, and a chat workflow that can rewrite the page based on natural-language instructions.

Live demo: https://csansoon.github.io/ai-web-designer/

## What's improved in this version

- Upgraded the AI integration from the legacy OpenAI SDK flow to a modern structured-output chat integration.
- Replaced the hardcoded `gpt-3.5-turbo` setup with selectable current models (`gpt-4.1-mini` and `gpt-4.1`).
- Added stronger prompting and strict JSON schema responses so code updates are more reliable.
- Improved error handling for invalid keys, rate limits, networking failures, and context-length issues.
- Added a better starter template, model picker, API key management UX, and more useful session usage tracking.
- Replaced the broken starter test with app- and utility-level coverage.

## How it works

The assistant receives the latest user request together with the current HTML, CSS, and JavaScript state of the page. It returns structured JSON containing:

- `text`: the assistant reply shown in chat
- `html`: optional replacement body markup
- `css`: optional replacement stylesheet
- `js`: optional replacement JavaScript

Only the changed parts need to be returned, which keeps iteration fast and makes the app feel more like an AI design copilot than a single-shot generator.

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

This app currently sends requests directly from the browser to OpenAI using a user-provided API key stored in local storage. For safety:

- prefer a project-scoped key
- set a spend limit
- do not use a high-privilege personal production key

A future backend proxy could further improve security and observability, but this repo intentionally keeps the product as a static client app.

## Limitations

- The app is optimized for a single static page rather than full multi-page apps.
- Very large HTML/CSS/JS payloads can still hit model context limits.
- Browser-side API usage is convenient for demos, but a server-side proxy is safer for production deployments.
