import AI, {
  buildAssistantHistoryPayload,
  buildResponsesInput,
  extractAssistantText,
  extractFunctionCalls,
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
    expect(responseMessage.role).toBe('assistant');
    expect(responseMessage.message).toBe('Updated the hero markup and styling.');
    expect(responseMessage.html).toBe('<main><h1>New hero</h1></main>');
    expect(responseMessage.css).toBe('body { color: red; }');
    expect(responseMessage.js).toBeUndefined();
    expect(responseMessage.operations).toHaveLength(2);
    expect(AI.totalUsedTokens).toBe(250);
  });
});
