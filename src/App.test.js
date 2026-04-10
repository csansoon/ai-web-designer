import { render, screen } from '@testing-library/react';
import App from './App';
import { extractJsonObject, sanitizeResponsePayload } from './model/AI';
import { buildPreviewDocument } from './components/VirtualPage';

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders model selector and starter guidance', () => {
  render(<App />);

  expect(screen.getByText(/describe the page you want to build/i)).toBeInTheDocument();
  expect(screen.getAllByText(/gpt-4.1-mini/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/reset starter/i)).toBeInTheDocument();
});

test('extractJsonObject trims wrapper text', () => {
  expect(extractJsonObject('note {"text":"hello"} thanks')).toEqual({ text: 'hello' });
});

test('sanitizeResponsePayload ensures text exists', () => {
  expect(sanitizeResponsePayload({ html: '<h1>Hi</h1>' })).toEqual({
    text: 'Done.',
    html: '<h1>Hi</h1>',
    css: undefined,
    js: undefined,
  });
});

test('buildPreviewDocument creates complete HTML document', () => {
  const doc = buildPreviewDocument('<h1>Hello</h1>', 'body{color:red;}', 'console.log("hi")');

  expect(doc).toContain('<!doctype html>');
  expect(doc).toContain('<h1>Hello</h1>');
  expect(doc).toContain('body{color:red;}');
  expect(doc).toContain('console.log("hi")');
});
