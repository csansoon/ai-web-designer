import ChatMessage from '../components/ChatMessage';

import { Configuration, OpenAIApi } from 'openai';

class AI {
    static _config = null;
    static _OpenAIClient = null;
    static _totalUsedTokens = 0;

    static initWithKey(key) {
        AI._config = new Configuration({
            apiKey: key,
        });
        AI._OpenAIClient = new OpenAIApi(AI._config);
        AI._totalUsedTokens = 0;
    }

    static get isInitialized() {
        return AI._config && AI._OpenAIClient;
    }

    static async checkAPIKey(key) {
        const config = new Configuration({
            apiKey: key,
        });
        try {
            const OpenAIClient = new OpenAIApi(config);
            await OpenAIClient.listModels();
            return true;
        }
        catch (e) {
            return false;
        }
    }

    static get totalUsedTokens() {
        return AI._totalUsedTokens;
    }

    static get totalUsedTokensUSD() {
        return (AI._totalUsedTokens * 0.002) / 1000;
    }

    static async getResponseMessage(messages) {
        if (!AI._config || !AI._OpenAIClient) {
            console.error("AI not initialized");
            return new ChatMessage("system", "The API key is not valid.");
        }

        const guidelines = [
            "You are a bot that can generate HTML, CSS and JS code.",
            "You will receive messages from the user containing a JSON object. This object will contain the following fields:",
            "- text: The text message from the user",
            "- html: The HTML code of the user's webpage inside the <body> tag",
            "- css: The full CSS code of the user's webpage",
            "- js: The full JavaScript code of the user's webpage",
            "You will reply to the user with another JSON object **and nothing more**.",
            "You will add the 'html', 'css' and 'js' fields only if you changed them. When adding any code field, format it in a readable way.",
            "You can only edit the <body> tag of the HTML code, so everything else should be left as it is.",
            "Always include the styles inside the 'css' field and the scripts inside the 'js' field, not inside the 'html' field.",
            "Your response will **always** contain the 'text' field, which will be the response you send to the user.",
            "Your response will **never** contain just a text message, it will always contain a JSON object and nothing more.",
            "**Do not** add any notes or additional text to your response other than the JSON itself, not even before or after the JSON.",
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
                    html: "<h1>\n\tHello world!\n</h1>",
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

            if (message.role === "user" && message !== messages[messages.length - 1]) {
                message_json = {
                    text: message.message
                };
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

        let response_text = response.data.choices[0].message.content.trim();
        let response_json = {};
        try {
            // Remove notes before and after the JSON object
            if (response_text.includes("{") && response_text.includes("}")) {
                response_text = response_text.substring(response_text.indexOf("{"), response_text.lastIndexOf("}") + 1);
            }

            response_json = JSON.parse(response_text);

        } catch (error) {
            
            console.warn("The response message is not a valid JSON object. The message will be sent as a text message.")

            response_json = {
                text: response_text,
			};
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
