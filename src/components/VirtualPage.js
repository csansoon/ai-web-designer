function buildPreviewDocument(html, css, js) {
  const safeHtml = typeof html === 'string' && html.trim() ? html : '<main><h1>Your page preview will appear here.</h1></main>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${css || ''}</style>
  </head>
  <body>
    ${safeHtml}
    <script>${js || ''}</script>
  </body>
</html>`;
}

export { buildPreviewDocument };

export default function VirtualPage({ html, css, js }) {
  return (
    <iframe
      srcDoc={buildPreviewDocument(html, css, js)}
      title="Virtual Page"
      sandbox="allow-scripts"
      frameBorder="0"
      width="100%"
      height="100%"
    />
  );
}
