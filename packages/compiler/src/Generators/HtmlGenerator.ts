import { ASTNode } from '../Parser';

export class HtmlGenerator {
  public generate(ast: ASTNode): string {
    if (ast.type !== 'root' || !ast.children) {
      return '';
    }
    const innerHtml = ast.children.map(node => this.generateNode(node)).join('\n');
    return `<div class="notion-ast-root">\n${innerHtml}\n</div>`;
  }

  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.metadata?.level || 1;
        return `<h${level}>${this.escapeHtml(node.content)}</h${level}>`;
      case 'paragraph':
        return `<p>${this.escapeHtml(node.content)}</p>`;
      case 'bulleted_list_item':
        return `<ul><li>${this.escapeHtml(node.content)}</li></ul>`;
      case 'code':
        return `<pre><code class="language-${node.metadata?.language || 'text'}">${this.escapeHtml(node.content)}</code></pre>`;
      case 'quote':
        return `<blockquote>${this.escapeHtml(node.content)}</blockquote>`;
      default:
        return `<p>${this.escapeHtml(node.content)}</p>`;
    }
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
}
