
export default function VirtualPage({ html, css, js }) {
	/*
		Render an iframe with the given HTML, CSS and JS.
	*/

	const isHtmlValid = (html) => {
		/*
			Validate the given HTML.
		*/

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");

		return doc.body.innerHTML !== "";
	}
	
	const htmlWithCSSAndJS = `
		<html>
			<head>
				<style>${css}</style>
			</head>
			<body>
				${isHtmlValid(html) ? html : "<h1>Invalid HTML</h1>"}
				<script>${js}</script>
			</body>
		</html>
	`;

	return (
		<iframe
			srcDoc={htmlWithCSSAndJS}
			title="Virtual Page"
			sandbox="allow-scripts"
			frameBorder="0"
			width="100%"
			height="100%"
		/>
	);
}