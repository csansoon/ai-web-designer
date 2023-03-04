import ChatMessage from '../components/ChatMessage';

class AI {
	
    static _initOpenAIClient() {
        // ...
    }

    static getResponseMessage(messages) {
        AI._initOpenAIClient();

        let fakeResponse = {
            role: "bot",
            message: "Hello, I'm a bot!",
            html: "<h1>Hello world!</h1>",
            css: "h1 { color: red; }",
            js: "console.log('Hello world!');"
        }
        
        const newMessage = new ChatMessage(fakeResponse.role, fakeResponse.message, fakeResponse.html, fakeResponse.css, fakeResponse.js);
        return newMessage;
    }
}

export default AI;