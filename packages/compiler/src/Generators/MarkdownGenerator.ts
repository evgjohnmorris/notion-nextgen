import { ASTNode } from '../Parser';

export class MarkdownGenerator {
  public generate(ast: ASTNode): string {
    if (ast.type !== 'root' || !ast.children) {
      return '';
    }
    return ast.children.map(node => this.generateNode(node)).join('\n\n');
  }

  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.metadata?.level || 1;
        return `${'#'.repeat(level)} ${node.content}`;
      case 'paragraph':
        return node.content;
      case 'bulleted_list_item':
        return `- ${node.content}`;
      case 'code':
        const lang = node.metadata?.language || '';
        return `\`\`\`${lang}\n${node.content}\n\`\`\``;
      case 'quote':
        return `> ${node.content}`;
      default:
        return node.content;
    }
  }
}
