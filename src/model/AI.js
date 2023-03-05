import ChatMessage from '../components/ChatMessage';

import { Configuration, OpenAIApi } from 'openai';

class AI {
    static _config = null;
    static _OpenAIClient = null;
    static _totalUsedTokens = 0;

    static _initOpenAIClient() {
        if (AI._config) return;

        if (!process.env.REACT_APP_OPENAI_API_KEY) {
            throw new Error("OpenAI API key not set");
        }

        AI._config = new Configuration({
			apiKey: process.env.REACT_APP_OPENAI_API_KEY,
		});
        
        AI._OpenAIClient = new OpenAIApi(AI._config);

        AI._totalUsedTokens = 0;
    }

    static get totalUsedTokens() {
        return AI._totalUsedTokens;
    }

    static get totalUsedTokensUSD() {
        return (AI._totalUsedTokens * 0.002) / 1000;
    }

    static async getResponseMessage(messages) {
        AI._initOpenAIClient();

        const guidelines = [
            "You are a bot that can generate HTML, CSS and JS code.",
            "You will recieve messages from the user containing a JSON object. This object will contain the following fields:",
            "- text: The text message from the user",
            "- html: The full HTML code of the user's webpage",
            "- css: The full CSS code of the user's webpage",
            "- js: The full JavaScript code of the user's webpage",
            "You will reply to the user with another JSON object **and nothing more**.",
            "You will add the 'html', 'css' and 'js' fields only if you changed them. When adding any code field, format it in a readable way.",
            "Your response will **always** contain the 'text' field, which will be the response you send to the user.",
            "Your response will **never** contain just a text message, it will always contain a JSON object.",
            "If the latest message is from the assistant with an incomplete JSON object, you will **only** reply with the rest of the JSON object and nothing more.",
        ];

        const prompt_and_examples = [
            {
                role: "system",
                content: guidelines.join("\n")
            },
            {
                role: "user",
                content: JSON.stringify({
                    text: "Hello!"
                })
            },
            {
                role: "assistant",
                content: JSON.stringify({
                    text: "Hi, how can I help you?"
                })
            },
            {
                role: "user",
                content: JSON.stringify({
                    text: "Please add a title that says \"Hello world!\"",
                })
            },
            {
                role: "assistant",
                content: JSON.stringify({
                    html: "<h1>Hello world!</h1>",
                    text: "Sure, I added the title for you. Do you want to add anything else?",
                })
            },
            {
                role: "user",
                content: JSON.stringify({
                    text: "Now make the title red and bold",
                })
            },
            {
                role: "assistant",
                content: JSON.stringify({
                    css: "h1 {\n\tcolor: red;\n\tfont-weight: bold;\n}",
                    text: "Done! Now the title is red and bold.",
                })
            }
        ];


        let sent_messages = [];
        for (let message of messages) {

            let message_json = {};
            if (message.message) message_json.text = message.message;
            if (message.html) message_json.html = message.html;
            if (message.css) message_json.css = message.css;
            if (message.js) message_json.js = message.js;

            if (message.role === "system") continue;

            if (message.role === "user") {
                message_json = {
                    text: message.message,
                }
            }

            if (message.role === "assistant") {
            }

            sent_messages.push({
                role: message.role,
                content: JSON.stringify(message_json)
            });
        }

        let response = null;
        try {
            response = await AI._OpenAIClient.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [...prompt_and_examples, ...sent_messages],
            });

            AI._totalUsedTokens += response.data.usage.total_tokens;

            if (response.data.choices[0].finish_reason === "length") {
                return new ChatMessage("system", "The response message is incomplete due to the API's limitations. Please try again later.");
            }

            sent_messages.push({
                role: "assistant",
                content: response.data.choices[0].message.content,
            });

        } catch (error) {
            console.error(error);

            if (error.response.status === 400) {
                return new ChatMessage("system", "The response message is incomplete due to the API's limitations. Please try again later.");
            }

            else {
                return new ChatMessage("system", "The API returned an error. Please try again later.");
            }
        }

        let response_json = {};
        try {
            response_json = JSON.parse(response.data.choices[0].message.content);
        } catch (error) {
            console.error(error);
            return new ChatMessage("system", "The API returned an invalid response. Please try again later.");
        }

        const newMessage = new ChatMessage(
            "assistant",
            response_json.text,
            response_json.html,
            response_json.css,
            response_json.js
        );

        return newMessage;
    }
}

export default AI;