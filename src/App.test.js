import { render, screen } from '@testing-library/react';
import App from './App';
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
  expect(screen.getAllByText(/gpt-5-mini/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/reset starter/i)).toBeInTheDocument();
});

test('buildPreviewDocument creates complete HTML document', () => {
  const doc = buildPreviewDocument('<h1>Hello</h1>', 'body{color:red;}', 'console.log("hi")');

  expect(doc).toContain('<!doctype html>');
  expect(doc).toContain('<h1>Hello</h1>');
  expect(doc).toContain('body{color:red;}');
  expect(doc).toContain('console.log("hi")');
});
