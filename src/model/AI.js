import ChatMessage from '../components/ChatMessage';

const STORAGE_KEYS = {
    apiKey: 'api_key',
    selectedModel: 'selected_model',
};

const MODELS = {
    'gpt-4.1-mini': {
        label: 'gpt-4.1-mini',
        inputCostPerMillion: 0.4,
        outputCostPerMillion: 1.6,
        description: 'Fast default for iterative web design edits.',
    },
    'gpt-4.1': {
        label: 'gpt-4.1',
        inputCostPerMillion: 2,
        outputCostPerMillion: 8,
        description: 'Higher quality for larger or trickier page rewrites.',
    },
};

const RESPONSE_SCHEMA = {
    name: 'web_designer_response',
    schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            text: {
                type: 'string',
                description: 'A concise explanation of what changed or what is needed from the user.',
            },
            html: {
                type: 'string',
                description: 'Replacement HTML for the body content only.',
            },
            css: {
                type: 'string',
                description: 'Replacement CSS for the page.',
            },
            js: {
                type: 'string',
                description: 'Replacement JavaScript for the page.',
            },
        },
        required: ['text'],
    },
    strict: true,
};

function extractJsonObject(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Missing response text');
    }

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end < start) {
        throw new Error('Response did not contain JSON');
    }

    return JSON.parse(text.slice(start, end + 1));
}

function sanitizeResponsePayload(payload) {
    const parsed = payload || {};

    return {
        text: typeof parsed.text === 'string' && parsed.text.trim() ? parsed.text.trim() : 'Done.',
        html: typeof parsed.html === 'string' ? parsed.html : undefined,
        css: typeof parsed.css === 'string' ? parsed.css : undefined,
        js: typeof parsed.js === 'string' ? parsed.js : undefined,
    };
}

function buildSystemPrompt() {
    return [
        'You are an expert AI web designer embedded inside a browser-based HTML/CSS/JS editor.',
        'Your job is to help users iteratively design a single static web page.',
        'You will receive JSON from the user with these fields when available: text, html, css, js.',
        'The html field always represents the contents of the <body> tag only. Never add <html>, <head>, or <body> wrappers.',
        'Return valid JSON that matches the required schema.',
        'Always include the text field.',
        'Only include html, css, or js when you want to replace that part of the current page.',
        'Keep code readable and production-like. Prefer semantic HTML, modern CSS, and unobtrusive JavaScript.',
        'If the user asks for something unsafe or impossible in a static page, explain that in text and provide the closest safe alternative.',
        'When updating code, preserve existing good work unless the user asked for a redesign.',
    ].join('\n');
}

function buildMessages(messages) {
    return messages
        .filter((message) => message.role !== 'system')
        .map((message, index) => {
            let payload = {};

            if (message.role === 'user') {
                if (index === messages.length - 1) {
                    payload = {
                        text: message.message,
                        html: message.html || '',
                        css: message.css || '',
                        js: message.js || '',
                    };
                } else {
                    payload = {
                        text: message.message,
                    };
                }
            } else {
                payload = sanitizeResponsePayload({
                    text: message.message,
                    html: message.html,
                    css: message.css,
                    js: message.js,
                });
            }

            return {
                role: message.role,
                content: JSON.stringify(payload),
            };
        });
}

class AI {
    static _apiKey = null;
    static _totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    static initWithKey(key) {
        AI._apiKey = key;
        AI._totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    }

    static clear() {
        AI._apiKey = null;
        AI._totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    }

    static get isInitialized() {
        return Boolean(AI._apiKey);
    }

    static get availableModels() {
        return MODELS;
    }

    static getSelectedModel() {
        return localStorage.getItem(STORAGE_KEYS.selectedModel) || 'gpt-4.1-mini';
    }

    static setSelectedModel(model) {
        if (!MODELS[model]) {
            throw new Error(`Unsupported model: ${model}`);
        }

        localStorage.setItem(STORAGE_KEYS.selectedModel, model);
    }

    static async checkAPIKey(key) {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    Authorization: `Bearer ${key}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    static get totalUsedTokens() {
        return AI._totalUsage.totalTokens;
    }

    static get totalUsedTokensUSD() {
        const pricing = MODELS[AI.getSelectedModel()] || MODELS['gpt-4.1-mini'];
        const inputCost = (AI._totalUsage.inputTokens / 1_000_000) * pricing.inputCostPerMillion;
        const outputCost = (AI._totalUsage.outputTokens / 1_000_000) * pricing.outputCostPerMillion;
        return inputCost + outputCost;
    }

    static async getResponseMessage(messages) {
        if (!AI.isInitialized) {
            return new ChatMessage('system', 'Add a valid OpenAI API key to start generating pages.');
        }

        const model = AI.getSelectedModel();
        const requestBody = {
            model,
            temperature: 0.3,
            response_format: {
                type: 'json_schema',
                json_schema: RESPONSE_SCHEMA,
            },
            messages: [
                {
                    role: 'system',
                    content: buildSystemPrompt(),
                },
                ...buildMessages(messages),
            ],
        };

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${AI._apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorCode = data?.error?.code;
                const errorMessage = data?.error?.message;

                if (response.status === 401) {
                    return new ChatMessage('system', 'That API key was rejected. Please re-enter it and try again.');
                }

                if (response.status === 429) {
                    return new ChatMessage('system', 'OpenAI rate-limited this request. Please wait a moment and try again.');
                }

                if (errorCode === 'context_length_exceeded' || response.status === 400) {
                    return new ChatMessage('system', 'This request exceeded the model context window. Try a smaller request or trim the page content.');
                }

                return new ChatMessage('system', errorMessage || 'OpenAI returned an error. Please try again.');
            }

            const usage = data?.usage || {};
            AI._totalUsage = {
                inputTokens: AI._totalUsage.inputTokens + (usage.prompt_tokens || 0),
                outputTokens: AI._totalUsage.outputTokens + (usage.completion_tokens || 0),
                totalTokens: AI._totalUsage.totalTokens + (usage.total_tokens || 0),
            };

            const responseText = data?.choices?.[0]?.message?.content || '';
            const responsePayload = sanitizeResponsePayload(extractJsonObject(responseText));

            return new ChatMessage(
                'assistant',
                responsePayload.text,
                responsePayload.html,
                responsePayload.css,
                responsePayload.js,
            );
        } catch (error) {
            console.error(error);
            return new ChatMessage('system', 'Something went wrong while contacting OpenAI. Check your network connection and try again.');
        }
    }
}

export { extractJsonObject, sanitizeResponsePayload, MODELS, STORAGE_KEYS };
export default AI;
