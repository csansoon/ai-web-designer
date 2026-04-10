import ChatMessage from '../components/ChatMessage';
import { ARTIFACT_TOOL_DEFINITIONS, applyArtifactToolCall } from './artifactTools';

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

const MAX_TOOL_ROUNDS = 8;

function buildSystemPrompt() {
  return [
    'You are an expert AI web designer embedded inside a browser-based HTML/CSS/JS editor.',
    'Your job is to iteratively design a single static web page.',
    'The latest user message includes the current page state as JSON with text, html, css, and js fields.',
    'Use the available tools to update code. Do not paste large HTML, CSS, or JavaScript directly into assistant messages.',
    'When you need to change markup, styles, or behavior, call setHtml, setCss, and setJs with complete replacement code for that artifact.',
    'You may call multiple tools in a single turn. Keep running until the page is updated, then send a concise user-facing summary.',
    'The html artifact always represents the contents of the <body> tag only. Never add <html>, <head>, or <body> wrappers.',
    'Keep code readable and production-like. Prefer semantic HTML, modern CSS, and unobtrusive JavaScript.',
    'If the user asks for something unsafe or impossible in a static page, explain that in the final summary and provide the closest safe alternative.',
    'Preserve existing good work unless the user asked for a redesign.',
  ].join('\n');
}

function buildAssistantHistoryPayload(message) {
  return {
    text: message.message,
    operations: (message.operations || []).map((operation) => ({
      tool: operation.tool,
      target: operation.target,
      reason: operation.reason,
    })),
  };
}

function buildResponsesInput(messages) {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message, index) => {
      const isLatest = index === messages.length - 1;
      let payload;

      if (message.role === 'user') {
        payload = isLatest
          ? {
              text: message.message,
              html: message.html || '',
              css: message.css || '',
              js: message.js || '',
            }
          : {
              text: message.message,
            };
      } else {
        payload = buildAssistantHistoryPayload(message);
      }

      return {
        role: message.role,
        content: [
          {
            type: 'input_text',
            text: JSON.stringify(payload),
          },
        ],
      };
    });
}

function getLatestArtifacts(messages) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

  return {
    html: latestUserMessage?.html || '',
    css: latestUserMessage?.css || '',
    js: latestUserMessage?.js || '',
  };
}

function extractAssistantText(responsePayload) {
  if (typeof responsePayload?.output_text === 'string' && responsePayload.output_text.trim()) {
    return responsePayload.output_text.trim();
  }

  const messageTexts = [];

  for (const item of responsePayload?.output || []) {
    if (item.type !== 'message' || !Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem.type === 'output_text' && typeof contentItem.text === 'string' && contentItem.text.trim()) {
        messageTexts.push(contentItem.text.trim());
      }
    }
  }

  return messageTexts.join('\n\n').trim();
}

function extractFunctionCalls(responsePayload) {
  return (responsePayload?.output || []).filter((item) => item.type === 'function_call');
}

function buildFunctionCallOutput(callId, output) {
  return {
    type: 'function_call_output',
    call_id: callId,
    output: JSON.stringify(output),
  };
}

function updateUsage(usage) {
  AI._totalUsage = {
    inputTokens: AI._totalUsage.inputTokens + (usage?.input_tokens || 0),
    outputTokens: AI._totalUsage.outputTokens + (usage?.output_tokens || 0),
    totalTokens: AI._totalUsage.totalTokens + (usage?.total_tokens || 0),
  };
}

function buildSummaryFallback(operations) {
  if (operations.length === 0) {
    return 'Done.';
  }

  const toolNames = operations.map((operation) => operation.tool).join(', ');
  return `Applied updates with ${toolNames}.`;
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
    const startingArtifacts = getLatestArtifacts(messages);
    const nextArtifacts = { ...startingArtifacts };
    const operations = [];
    const input = buildResponsesInput(messages);

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${AI._apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.3,
            store: false,
            instructions: buildSystemPrompt(),
            tools: ARTIFACT_TOOL_DEFINITIONS,
            input,
          }),
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

        updateUsage(data?.usage);
        input.push(...(data?.output || []));

        const functionCalls = extractFunctionCalls(data);

        if (functionCalls.length === 0) {
          const summary = extractAssistantText(data) || buildSummaryFallback(operations);

          return new ChatMessage(
            'assistant',
            summary,
            nextArtifacts.html !== startingArtifacts.html ? nextArtifacts.html : undefined,
            nextArtifacts.css !== startingArtifacts.css ? nextArtifacts.css : undefined,
            nextArtifacts.js !== startingArtifacts.js ? nextArtifacts.js : undefined,
            operations,
          );
        }

        for (const functionCall of functionCalls) {
          const result = applyArtifactToolCall(functionCall.name, functionCall.arguments, nextArtifacts);

          if (result.operation) {
            operations.push(result.operation);
          }

          input.push(buildFunctionCallOutput(functionCall.call_id || functionCall.id, result.output));
        }
      }

      return new ChatMessage('system', 'The AI editor exceeded the tool-call limit for this request. Try a smaller change.');
    } catch (error) {
      console.error(error);
      return new ChatMessage('system', 'Something went wrong while contacting OpenAI. Check your network connection and try again.');
    }
  }
}

export {
  buildResponsesInput,
  buildAssistantHistoryPayload,
  extractAssistantText,
  extractFunctionCalls,
  MODELS,
  STORAGE_KEYS,
};
export default AI;
