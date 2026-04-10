# AI Web Designer

AI Web Designer is a React-based web building tool powered by OpenAI models. It helps you prototype static web pages quickly with AI-assisted generation, live previewing, and an in-browser editing workflow.

You can try it live at https://csansoon.github.io/ai-web-designer/.

## Features

- Real-time preview of HTML, CSS, and JS code
- AI-powered page generation and refinement
- Token and price tracking while you iterate

## Limitations

Because the app runs fully in the browser, it cannot safely hide API keys and it inherits the token/request limits of the OpenAI APIs it calls. Large documents may exceed model context limits or become expensive to regenerate in a single request.

## Local development

1. Clone the project from GitHub.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000` in your browser.

## Production build

Run `npm run build` to create a production bundle in `build/`.

## GitHub Pages deployment

This repository deploys to GitHub Pages with the workflow in `.github/workflows/deploy-pages.yml`.

### How it works

- Every push to `master` triggers a production build in GitHub Actions.
- The workflow uploads the generated `build/` directory as a Pages artifact.
- GitHub Pages then publishes that artifact to the live site.

### Required repository settings

In the GitHub repository settings:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Save the setting if GitHub has not already auto-detected the workflow.

The app keeps `homepage` set to `https://csansoon.github.io/ai-web-designer` so the Create React App build emits asset URLs that work from the project Pages subpath.
