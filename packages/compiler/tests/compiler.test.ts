import { describe, it, expect } from 'vitest';
import { UniversalParser, MarkdownGenerator, HtmlGenerator, ReactGenerator } from '../src';

describe('Universal Compiler', () => {
  const mockBlocks = [
    {
      type: 'heading_1',
      heading_1: { rich_text: [{ plain_text: 'Hello World' }] }
    },
    {
      type: 'paragraph',
      paragraph: { rich_text: [{ plain_text: 'This is a test.' }] }
    },
    {
      type: 'code',
      code: { language: 'typescript', rich_text: [{ plain_text: 'const x = 1;' }] }
    }
  ];

  it('should parse Notion JSON into Universal AST', () => {
    const parser = new UniversalParser();
    const ast = parser.parse(mockBlocks);

    expect(ast.type).toBe('root');
    expect(ast.children).toHaveLength(3);
    expect(ast.children![0].type).toBe('heading');
    expect(ast.children![0].metadata?.level).toBe(1);
    expect(ast.children![2].type).toBe('code');
  });

  it('should generate Markdown from AST', () => {
    const parser = new UniversalParser();
    const ast = parser.parse(mockBlocks);
    
    const mdGen = new MarkdownGenerator();
    const result = mdGen.generate(ast);

    expect(result).toContain('# Hello World');
    expect(result).toContain('This is a test.');
    expect(result).toContain('```typescript\nconst x = 1;\n```');
  });

  it('should generate HTML from AST', () => {
    const parser = new UniversalParser();
    const ast = parser.parse(mockBlocks);
    
    const htmlGen = new HtmlGenerator();
    const result = htmlGen.generate(ast);

    expect(result).toContain('<h1>Hello World</h1>');
    expect(result).toContain('<p>This is a test.</p>');
    expect(result).toContain('<code class="language-typescript">const x = 1;</code>');
  });
  it('should generate React JSX from AST', () => {
    const parser = new UniversalParser();
    const ast = parser.parse(mockBlocks);
    
    const reactGen = new ReactGenerator();
    const result = reactGen.generate(ast, 'MyComponent');

    expect(result).toContain('export const MyComponent = () => {');
    expect(result).toContain('<h1 key={0}>Hello World</h1>');
    expect(result).toContain('<p key={1}>This is a test.</p>');
    expect(result).toContain('<code className="language-typescript">const x = 1;</code>');
  });
});
