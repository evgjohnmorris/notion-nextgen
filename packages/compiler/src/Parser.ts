export type ASTNodeType = 'root' | 'heading' | 'paragraph' | 'bulleted_list_item' | 'code' | 'quote';

export interface ASTNode {
  type: ASTNodeType;
  content: string;
  children?: ASTNode[];
  metadata?: Record<string, any>;
}

export class UniversalParser {
  /**
   * Converts an array of Notion blocks into a Universal AST
   */
  public parse(blocks: any[]): ASTNode {
    const root: ASTNode = {
      type: 'root',
      content: '',
      children: []
    };

    for (const block of blocks) {
      const node = this.parseBlock(block);
      if (node) {
        root.children!.push(node);
      }
    }

    return root;
  }

  private parseBlock(block: any): ASTNode | null {
    const type = block.type;
    const contentData = block[type];
    
    if (!contentData) return null;

    const textContent = contentData.rich_text
      ? contentData.rich_text.map((t: any) => t.plain_text).join('')
      : '';

    switch (type) {
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        return {
          type: 'heading',
          content: textContent,
          metadata: { level: parseInt(type.split('_')[1], 10) }
        };
      case 'paragraph':
        return {
          type: 'paragraph',
          content: textContent
        };
      case 'bulleted_list_item':
        return {
          type: 'bulleted_list_item',
          content: textContent
        };
      case 'code':
        return {
          type: 'code',
          content: textContent,
          metadata: { language: contentData.language }
        };
      case 'quote':
        return {
          type: 'quote',
          content: textContent
        };
      default:
        // Graceful fallback for unsupported blocks
        return {
          type: 'paragraph',
          content: `[Unsupported Block Type: ${type}]`,
          metadata: { originalType: type }
        };
    }
  }
}
