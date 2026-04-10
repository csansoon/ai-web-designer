import AI, {
  MODEL_METADATA,
  buildAssistantHistoryPayload,
  buildResponsesInput,
  extractAssistantText,
  extractFunctionCalls,
  normalizeModelListResponse,
} from './AI';
import ChatMessage from '../components/ChatMessage';
import { applyArtifactToolCall } from './artifactTools';

describe('AI helpers', () => {
  afterEach(() => {
    AI.clear();
    jest.restoreAllMocks();
    localStorage.clear();
  });

  test('buildAssistantHistoryPayload preserves operation summaries', () => {
    const payload = buildAssistantHistoryPayload(
      new ChatMessage('assistant', 'Updated the layout.', undefined, undefined, undefined, [
        { tool: 'setHtml', target: 'html', reason: 'Add a hero section' },
      ]),
    );

    expect(payload).toEqual({
      text: 'Updated the layout.',
      operations: [
        { tool: 'setHtml', target: 'html', reason: 'Add a hero section' },
      ],
    });
  });

  test('buildResponsesInput includes the latest artifact state for the newest user message', () => {
    const input = buildResponsesInput([
      new ChatMessage('user', 'Create a page'),
      new ChatMessage('assistant', 'Done.', undefined, undefined, undefined, [
        { tool: 'setHtml', target: 'html', reason: 'Initial structure' },
      ]),
      new ChatMessage('user', 'Refine it', '<main>Current</main>', '.page{}', 'console.log("x")'),
    ]);

    expect(input).toEqual([
      {
        role: 'user',
        content: [{ type: 'input_text', text: JSON.stringify({ text: 'Create a page' }) }],
      },
      {
        role: 'assistant',
        content: [{ type: 'input_text', text: JSON.stringify({
          text: 'Done.',
          operations: [{ tool: 'setHtml', target: 'html', reason: 'Initial structure' }],
        }) }],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: JSON.stringify({
          text: 'Refine it',
          html: '<main>Current</main>',
          css: '.page{}',
          js: 'console.log("x")',
        }) }],
      },
    ]);
  });

  test('extractAssistantText reads message output text', () => {
    expect(extractAssistantText({
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'Applied the redesign.' },
          ],
        },
      ],
    })).toBe('Applied the redesign.');
  });

  test('extractFunctionCalls finds tool invocations', () => {
    expect(extractFunctionCalls({
      output: [
        { type: 'function_call', name: 'setHtml' },
        { type: 'message' },
      ],
    })).toEqual([{ type: 'function_call', name: 'setHtml' }]);
  });

  test('applyArtifactToolCall updates artifacts and returns an operation summary', () => {
    const artifacts = { html: '<main>Old</main>', css: '', js: '' };
    const result = applyArtifactToolCall('setHtml', JSON.stringify({
      html: '<main>New</main>',
      reason: 'Swap in the updated layout',
    }), artifacts);

    expect(result.ok).toBe(true);
    expect(artifacts.html).toBe('<main>New</main>');
    expect(result.operation).toEqual(expect.objectContaining({
      tool: 'setHtml',
      target: 'html',
      reason: 'Swap in the updated layout',
    }));
  });

  test('normalizeModelListResponse keeps explicit preferred models first and compatibility fallbacks later', () => {
    expect(normalizeModelListResponse({
      data: [
        { id: 'gpt-5' },
        { id: 'gpt-4.1' },
        { id: 'gpt-5.4' },
        { id: 'gpt-5.3-codex' },
        { id: 'not-supported-here' },
      ],
    })).toEqual(['gpt-5.4', 'gpt-5.3-codex', 'gpt-4.1', 'gpt-5']);
  });

  test('normalizeModelListResponse falls back to the curated default order when no known models are returned', () => {
    expect(normalizeModelListResponse({
      data: [{ id: 'totally-unknown-model' }],
    })).toEqual(['gpt-5.4', 'gpt-5.3-codex', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-5']);
  });
});

describe('AI tool loop', () => {
  afterEach(() => {
    AI.clear();
    jest.restoreAllMocks();
    localStorage.clear();
  });

  test('getResponseMessage applies tool calls until the assistant returns a summary', async () => {
    AI.initWithKey('test-key');
    localStorage.setItem('selected_model', 'gpt-4.1-mini');

    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'resp_1',
          usage: { input_tokens: 120, output_tokens: 30, total_tokens: 150 },
          output: [
            {
              type: 'function_call',
              id: 'fc_1',
              call_id: 'call_1',
              name: 'setHtml',
              arguments: JSON.stringify({
                html: '<main><h1>New hero</h1></main>',
                reason: 'Replace the old hero section',
              }),
            },
            {
              type: 'function_call',
              id: 'fc_2',
              call_id: 'call_2',
              name: 'setCss',
              arguments: JSON.stringify({
                css: 'body { color: red; }',
                reason: 'Match the new hero styling',
              }),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'resp_2',
          usage: { input_tokens: 80, output_tokens: 20, total_tokens: 100 },
          output_text: 'Updated the hero markup and styling.',
          output: [
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'Updated the hero markup and styling.' }],
            },
          ],
        }),
      });

    const responseMessage = await AI.getResponseMessage([
      new ChatMessage('user', 'Refresh the hero section.', '<main>Old</main>', 'body { color: blue; }', ''),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const firstRequest = JSON.parse(fetchSpy.mock.calls[0][1].body);
    const secondRequest = JSON.parse(fetchSpy.mock.calls[1][1].body);

    expect(firstRequest.previous_response_id).toBeUndefined();
    expect(secondRequest.previous_response_id).toBe('resp_1');
    expect(secondRequest.input).toEqual([
      {
        type: 'function_call_output',
        call_id: 'call_1',
        output: JSON.stringify({ ok: true, target: 'html', size: '<main><h1>New hero</h1></main>'.length }),
      },
      {
        type: 'function_call_output',
        call_id: 'call_2',
        output: JSON.stringify({ ok: true, target: 'css', size: 'body { color: red; }'.length }),
      },
    ]);

    expect(responseMessage.role).toBe('assistant');
    expect(responseMessage.message).toBe('Updated the hero markup and styling.');
    expect(responseMessage.html).toBe('<main><h1>New hero</h1></main>');
    expect(responseMessage.css).toBe('body { color: red; }');
    expect(responseMessage.js).toBeUndefined();
    expect(responseMessage.operations).toHaveLength(2);
    expect(AI.totalUsedTokens).toBe(250);
  });

  test('checkAPIKey updates available models from the API response using the explicit preference order', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-5' }, { id: 'gpt-5.3-codex' }, { id: 'gpt-4.1' }],
      }),
    });

    await expect(AI.checkAPIKey('test-key')).resolves.toBe(true);
    expect(Object.keys(AI.availableModels)).toEqual(['gpt-5.3-codex', 'gpt-4.1', 'gpt-5']);
    expect(AI.availableModels['gpt-5.3-codex']).toEqual(MODEL_METADATA['gpt-5.3-codex']);
  });
});
