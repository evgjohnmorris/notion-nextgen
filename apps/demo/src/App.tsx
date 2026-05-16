import { useState, useMemo, useEffect } from 'react';
import { UniversalParser, HtmlGenerator, ReactGenerator } from '@notion-nextgen/compiler';
import './App.css';

const defaultBlocks = [
  {
    type: 'heading_1',
    heading_1: { rich_text: [{ plain_text: '🚀 Next-Gen Notion Toolkit' }] }
  },
  {
    type: 'paragraph',
    paragraph: { rich_text: [{ plain_text: 'Welcome to the interactive demo of the Notion Next-Gen Compiler. This content is generated from a mock Notion AST!' }] }
  },
  {
    type: 'quote',
    quote: { rich_text: [{ plain_text: 'Building seamless integrations is easier than ever.' }] }
  },
  {
    type: 'code',
    code: { language: 'typescript', rich_text: [{ plain_text: 'const compiler = new UniversalParser();\nconst ast = compiler.parse(blocks);' }] }
  }
];

function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'react' | 'ast'>('preview');
  const [jsonInput, setJsonInput] = useState(JSON.stringify(defaultBlocks, null, 2));
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setBlocks(Array.isArray(parsed) ? parsed : [parsed]);
      setError(null);
    } catch (e) {
      setError('Invalid JSON');
    }
  }, [jsonInput]);

  const { htmlContent, reactContent, astJson } = useMemo(() => {
    try {
      const parser = new UniversalParser();
      const ast = parser.parse(blocks);
      
      const htmlGen = new HtmlGenerator();
      const htmlContent = htmlGen.generate(ast);
      
      const reactGen = new ReactGenerator();
      const reactContent = reactGen.generate(ast, 'NotionPage');

      return { htmlContent, reactContent, astJson: JSON.stringify(ast, null, 2) };
    } catch (e: any) {
      return { htmlContent: `<div style="color: #ef4444">Error generating output: ${e.message}</div>`, reactContent: '', astJson: '' };
    }
  }, [blocks]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-bg"></div>
        <h1>Notion Next-Gen Demo</h1>
        <p>Interactive compiler visualization</p>
      </header>
      
      <main className="main-content editor-layout">
        <div className="editor-pane">
          <h2>Input Blocks (JSON)</h2>
          {error && <div className="error-message" style={{color: '#ef4444', marginBottom: '1rem'}}>{error}</div>}
          <textarea 
            className="json-input glass-panel" 
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="output-pane">
          <div className="tabs">
            <button className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>HTML Preview</button>
            <button className={activeTab === 'react' ? 'active' : ''} onClick={() => setActiveTab('react')}>React JSX Output</button>
            <button className={activeTab === 'ast' ? 'active' : ''} onClick={() => setActiveTab('ast')}>AST Output</button>
          </div>

          <div className="tab-content">
            {activeTab === 'preview' && (
              <div className="preview-pane glass-panel notion-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            )}
            {activeTab === 'react' && (
              <pre className="code-pane glass-panel"><code>{reactContent}</code></pre>
            )}
            {activeTab === 'ast' && (
              <pre className="code-pane glass-panel"><code>{astJson}</code></pre>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App;
