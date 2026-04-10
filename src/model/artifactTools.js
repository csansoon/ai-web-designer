const ARTIFACT_TOOL_DEFINITIONS = [
  {
    type: 'function',
    name: 'setHtml',
    description: 'Replace the current page HTML with a complete new body fragment. Do not include <html>, <head>, or <body> tags.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        html: {
          type: 'string',
          description: 'The full replacement HTML for the contents of the <body> tag.',
        },
        reason: {
          type: 'string',
          description: 'Short explanation of why this update is needed.',
        },
      },
      required: ['html'],
    },
  },
  {
    type: 'function',
    name: 'setCss',
    description: 'Replace the current stylesheet with a complete new version.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        css: {
          type: 'string',
          description: 'The full replacement CSS for the page.',
        },
        reason: {
          type: 'string',
          description: 'Short explanation of why this update is needed.',
        },
      },
      required: ['css'],
    },
  },
  {
    type: 'function',
    name: 'setJs',
    description: 'Replace the current JavaScript with a complete new version.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        js: {
          type: 'string',
          description: 'The full replacement JavaScript for the page.',
        },
        reason: {
          type: 'string',
          description: 'Short explanation of why this update is needed.',
        },
      },
      required: ['js'],
    },
  },
];

const TOOL_TARGETS = {
  setHtml: 'html',
  setCss: 'css',
  setJs: 'js',
};

function createOperation(tool, value, reason) {
  const suffix = reason ? `: ${reason.trim()}` : '';

  return {
    tool,
    target: TOOL_TARGETS[tool],
    reason: typeof reason === 'string' ? reason.trim() : '',
    label: `${tool}${suffix}`,
    size: typeof value === 'string' ? value.length : 0,
  };
}

function applyArtifactToolCall(toolName, rawArguments, artifacts) {
  const target = TOOL_TARGETS[toolName];

  if (!target) {
    return {
      ok: false,
      operation: null,
      output: {
        ok: false,
        error: `Unsupported tool: ${toolName}`,
      },
    };
  }

  let parsedArguments;

  try {
    parsedArguments = typeof rawArguments === 'string' ? JSON.parse(rawArguments) : rawArguments;
  } catch (error) {
    return {
      ok: false,
      operation: null,
      output: {
        ok: false,
        error: `Invalid JSON arguments for ${toolName}.`,
      },
    };
  }

  const nextValue = parsedArguments?.[target];

  if (typeof nextValue !== 'string') {
    return {
      ok: false,
      operation: null,
      output: {
        ok: false,
        error: `${toolName} requires a string "${target}" field.`,
      },
    };
  }

  const reason = typeof parsedArguments.reason === 'string' ? parsedArguments.reason : '';

  artifacts[target] = nextValue;

  return {
    ok: true,
    operation: createOperation(toolName, nextValue, reason),
    output: {
      ok: true,
      target,
      size: nextValue.length,
    },
  };
}

export { ARTIFACT_TOOL_DEFINITIONS, applyArtifactToolCall };
