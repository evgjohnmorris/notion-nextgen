import { ASTNode } from '../Parser';

export class ReactGenerator {
  public generate(ast: ASTNode, componentName = 'NotionPage'): string {
    if (ast.type !== 'root' || !ast.children) {
      return `import React from 'react';\n\nexport const ${componentName} = () => <></>;\n`;
    }
    const innerJsx = ast.children.map((node, i) => this.generateNode(node, i)).join('\n      ');
    return `import React from 'react';\n\nexport const ${componentName} = () => {\n  return (\n    <div className="notion-ast-root">\n      ${innerJsx}\n    </div>\n  );\n};\n`;
  }

  private generateNode(node: ASTNode, keyIndex?: number): string {
    const keyAttr = keyIndex !== undefined ? ` key={${keyIndex}}` : '';
    switch (node.type) {
      case 'heading':
        const level = node.metadata?.level || 1;
        return `<h${level}${keyAttr}>${this.escapeJsx(node.content)}</h${level}>`;
      case 'paragraph':
        return `<p${keyAttr}>${this.escapeJsx(node.content)}</p>`;
      case 'bulleted_list_item':
        return `<ul${keyAttr}><li>${this.escapeJsx(node.content)}</li></ul>`;
      case 'code':
        return `<pre${keyAttr}><code className="language-${node.metadata?.language || 'text'}">${this.escapeJsx(node.content)}</code></pre>`;
      case 'quote':
        return `<blockquote${keyAttr}>${this.escapeJsx(node.content)}</blockquote>`;
      default:
        return `<p${keyAttr}>${this.escapeJsx(node.content)}</p>`;
    }
  }

  private escapeJsx(unsafe: string): string {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\{/g, "&#123;")
         .replace(/\}/g, "&#125;");
  }
}
