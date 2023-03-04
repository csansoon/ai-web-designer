import ChatMessage from '../components/ChatMessage';

import { Configuration, OpenAIApi } from 'openai';

class AI {
    static _config = null;
    static _OpenAIClient = null;

    static _initOpenAIClient() {
        if (AI._config) return;

        if (!process.env.REACT_APP_OPENAI_API_KEY) {
            throw new Error("OpenAI API key not set");
        }

        AI._config = new Configuration({
			apiKey: process.env.REACT_APP_OPENAI_API_KEY,
		});
        
        AI._OpenAIClient = new OpenAIApi(AI._config);
    }

    static async getResponseMessage(messages) {
        try {
            AI._initOpenAIClient();

            const prompt_and_examples = [
                {
                    role: "system",
                    content: "You are talking to a bot that can generate HTML, CSS and JS code.\nYou will recieve messages from the user with a JSON object that contains the following fields:\n- text: The text message from the user\n- html: The full HTML code of the user's webpage\n- css: The full CSS code of the user's webpage\n- js: The full JavaScript code of the user's webpage\nTo any of these messages, you will reply with another JSON object with the same format as the messages you receive.\nYour response will **always** contain the 'text' field, and you will add the 'html', 'css' and 'js' fields only if you changed them. When adding any code field, format it in a readable way.\nRespond only with the JSON object, without any other text.\nRespond as a plain text, **do not** add a code block."
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        text: "Hello!",
                        html: "",
                        css: "",
                        js: ""
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
                        html: "",
                        css: "",
                        js: ""
                    })
                },
                {
                    role: "assistant",
                    content: JSON.stringify({
                        text: "Sure, I added the title",
                        html: "<h1>Hello world!</h1>",
                    })
                },
            ];

            let parsedMessages = [...prompt_and_examples];

            for (let message of messages) {
                if (message.role === "system") continue;

                let message_json = {};
                if (message.message) message_json.text = message.message;
                if (message.html) message_json.html = message.html;
                if (message.css) message_json.css = message.css;
                if (message.js) message_json.js = message.js;

                parsedMessages.push({
                    role: message.role,
                    content: JSON.stringify(message_json)
                });
            }

            let response = await AI._OpenAIClient.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: parsedMessages,
            });

            let response_role = response.data.choices[0].message.role;
            let response_content = response.data.choices[0].message.content;

            let response_json = JSON.parse(response_content);

            const newMessage = new ChatMessage(
                response_role,
                response_json.text,
                response_json.html,
                response_json.css,
                response_json.js
            );

            console.log("returning new message", newMessage);
            return newMessage;


        } catch (error) {
            console.error(error);
            return new ChatMessage("system", "Error:\n" + error.message);
        }
    }
}

export default AI;