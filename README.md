# AI Web Designer
AI Web Designer is a web building tool powered by OpenAI's GPT API. It allows you to create and design static web pages with ease. The tool is programmed using ReactJS and is designed to help individuals and teams build web pages faster.

## Features
- Real-time preview of HTML, CSS, and JS code
- AI-powered auto-complete for faster coding
- Token and price tracker

## Limitations
Due to the limitations of OpenAI's API, AI Web Designer cannot handle large documents with too much content. The API has a maximum token limit of 4,000 per request, which means that the AI cannot generate large sections of code, or respond to the user when the document is too big.

## How to Use
To use AI Web Designer, follow the steps below:

1. Clone the project from the GitHub repository.
2. Add a `.env` file with your OpenAI API key as a `REACT_APP_OPENAI_API_KEY` variable.
3. Run `npm install` to install the dependencies.
4. Run `npm start` to start the development server.
5. Access `http://localhost:3000` in your web browser.

Once you have the tool up and running, you can start building your web page by askin the AI using the sidebar's chat. You can then customize the HTML, CSS, and JS code using the integrated code editor.
