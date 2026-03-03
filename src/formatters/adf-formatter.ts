/**
 * ADF (Atlassian Document Format) Formatter
 * Handles conversion between plain text/markdown and ADF format used by Jira API v3
 */

/**
 * Jira/Confluence ADF supported languages mapped from common LLM output aliases
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  tsx: 'javascript',
  jsx: 'javascript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  dockerfile: 'bash',
  tf: 'plaintext',
  hcl: 'plaintext',
  mdx: 'markdown',
  yml: 'yaml',
};

function normalizeCodeLanguage(lang: string): string {
  if (!lang) return '';
  const lower = lang.toLowerCase();
  return LANGUAGE_ALIASES[lower] ?? lower;
}

/**
 * Extracts plain text from ADF (Atlassian Document Format) body
 */
export function extractTextFromADF(body: any): string {
  if (!body) return '';

  // If body is already a string (wiki markup), return it directly
  if (typeof body === 'string') {
    return formatWikiMarkup(body);
  }

  // If body doesn't have content property, it might be wiki markup in another format
  if (!body.content) {
    return formatWikiMarkup(String(body));
  }

  let text = '';
  const extractFromContent = (content: any[]): void => {
    for (const item of content) {
      if (item.type === 'text' && item.text) {
        text += item.text;
      } else if (item.type === 'hardBreak') {
        text += '\n';
      } else if (item.type === 'paragraph') {
        if (item.content) {
          extractFromContent(item.content);
        }
      } else if (item.type === 'heading') {
        const level = item.attrs?.level || 1;
        const prefix = '#'.repeat(level);
        text += `${prefix} `;
        if (item.content) {
          extractFromContent(item.content);
        }
      } else if (item.type === 'bulletList' || item.type === 'orderedList') {
        if (item.content) {
          extractFromContent(item.content);
        }
      } else if (item.type === 'listItem') {
        text += '- ';
        if (item.content) {
          extractFromContent(item.content);
        }
      } else if (item.type === 'codeBlock') {
        text += '```';
        if (item.content) {
          extractFromContent(item.content);
        }
        text += '```';
      } else if (item.type === 'table') {
        // Extract table as markdown
        if (item.content) {
          const rows: string[][] = [];
          item.content.forEach((row: any) => {
            if (row.type === 'tableRow' && row.content) {
              const cells: string[] = [];
              row.content.forEach((cell: any) => {
                if ((cell.type === 'tableCell' || cell.type === 'tableHeader') && cell.content) {
                  let cellText = '';
                  const extractCellText = (cellContent: any[]) => {
                    cellContent.forEach((cellItem: any) => {
                      if (cellItem.type === 'paragraph' && cellItem.content) {
                        cellItem.content.forEach((textItem: any) => {
                          if (textItem.type === 'text' && textItem.text) {
                            cellText += textItem.text;
                          }
                        });
                      }
                    });
                  };
                  extractCellText(cell.content);
                  cells.push(cellText.trim());
                }
              });
              if (cells.length > 0) {
                rows.push(cells);
              }
            }
          });

          // Format as markdown table
          if (rows.length > 0) {
            const [headerRow, ...dataRows] = rows;

            // Header row
            text += '\n| ' + headerRow.join(' | ') + ' |\n';

            // Separator row
            text += '|' + headerRow.map(() => '--------').join('|') + '|\n';

            // Data rows
            dataRows.forEach(row => {
              text += '| ' + row.join(' | ') + ' |\n';
            });
          }
        }
      } else if (item.content) {
        extractFromContent(item.content);
      }
    }
  };

  extractFromContent(body.content);
  return formatWikiMarkup(text.trim());
}

/**
 * Formats wiki markup to cleaner text
 */
export function formatWikiMarkup(text: string): string {
  if (!text) return '';

  return text
    // Convert Confluence headers to markdown headers
    .replace(/^h([1-6])\.\s*/gm, (match, level) => '#'.repeat(parseInt(level)) + ' ')
    // Convert horizontal rules
    .replace(/^----+$/gm, '---')
    // Handle panels - convert to blockquotes for better readability
    .replace(/\{panel:title=([^|]*)[^}]*\}/g, '\n> **$1**\n>')
    .replace(/\{panel\}/g, '\n')
    // Handle colored text/backgrounds - keep the text but remove styling
    .replace(/\{color:[^}]*\}([^{]*)\{color\}/g, '$1')
    // Convert checkboxes
    .replace(/☐/g, '- [ ]')
    .replace(/☑/g, '- [x]')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headers
    .replace(/\n(#{1,6}\s)/g, '\n\n$1')
    .trim();
}

/**
 * Parses inline formatting like **bold**, *italic*, `code`, {{code}}
 */
export function parseInlineFormatting(text: string): any[] {
  const result: any[] = [];
  let currentPos = 0;

  // Process patterns in order of precedence to avoid conflicts
  // **bold** should be processed before *italic* to handle **text** correctly
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, type: 'strong' },    // **bold** (process first)
    { regex: /~~(.*?)~~/g, type: 'strike' },         // ~~strikethrough~~
    { regex: /`([^`]+?)`/g, type: 'code' },         // `code` (markdown style)
    { regex: /\{\{(.+?)\}\}/g, type: 'code' },      // {{code}} (Confluence/Jira wiki style)
  ];

  let matches: any[] = [];

  // Find all formatting matches
  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex.source, 'g');
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        type: pattern.type,
        fullMatch: match[0]
      });
    }
  });

  // Sort matches by position and remove overlapping matches
  matches.sort((a, b) => a.start - b.start);

  // After processing bold and code, handle italic patterns that don't overlap
  let tempText = text;
  // Remove already matched bold and code patterns from consideration
  matches.forEach(match => {
    tempText = tempText.substring(0, match.start) + ' '.repeat(match.end - match.start) + tempText.substring(match.end);
  });

  // Now find italic patterns in the remaining text
  const italicRegex = /\*([^*]+?)\*/g;
  let italicMatch;
  while ((italicMatch = italicRegex.exec(tempText)) !== null) {
    matches.push({
      start: italicMatch.index,
      end: italicMatch.index + italicMatch[0].length,
      text: italicMatch[1],
      type: 'em',
      fullMatch: italicMatch[0]
    });
  }

  // Sort matches by position and remove overlapping matches
  matches.sort((a, b) => a.start - b.start);

  // Filter out overlapping matches (keep the first one in case of conflict)
  const filteredMatches: any[] = [];
  for (const match of matches) {
    const isOverlapping = filteredMatches.some(existing =>
      (match.start >= existing.start && match.start < existing.end) ||
      (match.end > existing.start && match.end <= existing.end) ||
      (match.start <= existing.start && match.end >= existing.end)
    );

    if (!isOverlapping) {
      filteredMatches.push(match);
    }
  }

  // Sort filtered matches by position for proper processing
  filteredMatches.sort((a, b) => a.start - b.start);

  // Process text with formatting
  filteredMatches.forEach(match => {
    // Add text before the match
    if (match.start > currentPos) {
      const beforeText = text.substring(currentPos, match.start);
      if (beforeText) {
        result.push({
          type: 'text',
          text: beforeText
        });
      }
    }

    // Add formatted text
    result.push({
      type: 'text',
      text: match.text,
      marks: [{ type: match.type }]
    });

    currentPos = match.end;
  });

  // Add remaining text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) {
      result.push({
        type: 'text',
        text: remainingText
      });
    }
  }

  // If no formatting was found, return simple text
  if (result.length === 0) {
    result.push({
      type: 'text',
      text: text
    });
  }

  return result;
}

/**
 * Enhanced description parser that converts text to proper ADF format
 */
export function parseDescriptionToADF(description: string): any {
  const lines = description.split('\n');
  const content: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      // Skip empty lines - let Claude handle spacing naturally
      continue;
    }

    // Handle Confluence wiki markup headers (h1., h2., h3., etc.)
    const confluenceHeaderMatch = line.match(/^h([1-6])\.\s*(.*)$/);
    if (confluenceHeaderMatch) {
      const level = parseInt(confluenceHeaderMatch[1]);
      const headerText = confluenceHeaderMatch[2];
      content.push({
        type: 'heading',
        attrs: { level },
        content: [{
          type: 'text',
          text: headerText
        }]
      });
      continue;
    }

    // Handle markdown headers (## Header, ### Header)
    if (line.startsWith('###')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{
          type: 'text',
          text: line.substring(3).trim()
        }]
      });
    } else if (line.startsWith('##')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{
          type: 'text',
          text: line.substring(2).trim()
        }]
      });
    } else if (line.startsWith('#')) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{
          type: 'text',
          text: line.substring(1).trim()
        }]
      });
    }
    // Handle horizontal rules (---- or ----)
    else if (/^-{4,}$/.test(line)) {
      content.push({
        type: 'rule'
      });
    }
    // Handle Confluence panels
    else if (line.match(/^\{panel:/)) {
      const panelMatch = line.match(/^\{panel:title=([^|]*)[^}]*\}$/);
      if (panelMatch) {
        const title = panelMatch[1];
        // Start collecting panel content
        const panelContent: any[] = [];
        i++; // Move to next line

        // Collect content until we hit {panel}
        while (i < lines.length && !lines[i].trim().match(/^\{panel\}$/)) {
          const panelLine = lines[i].trim();
          if (panelLine) {
            panelContent.push({
              type: 'paragraph',
              content: parseInlineFormatting(panelLine)
            });
          }
          i++;
        }

        // Create panel as an info panel (closest ADF equivalent)
        content.push({
          type: 'panel',
          attrs: { panelType: 'info' },
          content: [
            {
              type: 'paragraph',
              content: [{
                type: 'text',
                text: title,
                marks: [{ type: 'strong' }]
              }]
            },
            ...panelContent
          ]
        });
      }
    }
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Check if we need to start a new bullet list or continue existing one
      const lastItem = content[content.length - 1];
      const bulletText = line.substring(2).trim();

      if (lastItem && lastItem.type === 'bulletList') {
        lastItem.content.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: parseInlineFormatting(bulletText)
          }]
        });
      } else {
        content.push({
          type: 'bulletList',
          content: [{
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: parseInlineFormatting(bulletText)
            }]
          }]
        });
      }
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^\d+\.\s(.+)$/);
      if (match) {
        const listText = match[1];
        const lastItem = content[content.length - 1];

        if (lastItem && lastItem.type === 'orderedList') {
          lastItem.content.push({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: parseInlineFormatting(listText)
            }]
          });
        } else {
          content.push({
            type: 'orderedList',
            content: [{
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: parseInlineFormatting(listText)
              }]
            }]
          });
        }
      }
    }
    // Handle code blocks (```)
    else if (line.startsWith('```')) {
      const rawLang = line.substring(3).trim();
      const lang = normalizeCodeLanguage(rawLang);
      const codeLines: string[] = [];
      i++; // Skip the opening ```

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      const codeBlock: any = {
        type: 'codeBlock',
        attrs: lang ? { language: lang } : {},
        content: [{
          type: 'text',
          text: codeLines.join('\n')
        }]
      };

      content.push(codeBlock);
    }
    // Handle markdown tables - convert to proper ADF table structure
    else if (line.includes('|') && line.trim() !== '|') {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');

      if (cells.length >= 2) {
        // Collect all table rows from current position
        const allTableRows: string[][] = [];

        // Start from current line and collect consecutive table rows
        let tableEndIndex = i;
        for (let tableIdx = i; tableIdx < lines.length; tableIdx++) {
          const tableLine = lines[tableIdx].trim();

          // Skip empty lines
          if (tableLine === '') {
            tableEndIndex = tableIdx;
            continue;
          }

          // Stop if no pipes (end of table)
          if (!tableLine.includes('|')) {
            tableEndIndex = tableIdx - 1;
            break;
          }

          // Skip separator lines like |-|-|
          if (tableLine.match(/^\|?[\s\-:|]+\|?$/)) {
            tableEndIndex = tableIdx;
            continue;
          }

          // Parse row cells
          const rowCells = tableLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
          if (rowCells.length >= 2) {
            allTableRows.push(rowCells);
            tableEndIndex = tableIdx;
          } else {
            tableEndIndex = tableIdx - 1;
            break; // End of table
          }
        }

        // Convert to proper ADF table structure if we have table rows
        if (allTableRows.length > 0) {
          // Create proper ADF table structure
          const tableRows: any[] = [];

          // Header row (first row)
          if (allTableRows.length > 0) {
            const headerCells = allTableRows[0].map(cellText => ({
              type: 'tableHeader',
              attrs: {},
              content: [{
                type: 'paragraph',
                content: parseInlineFormatting(cellText)
              }]
            }));

            tableRows.push({
              type: 'tableRow',
              content: headerCells
            });
          }

          // Data rows (remaining rows)
          for (let rowIdx = 1; rowIdx < allTableRows.length; rowIdx++) {
            const dataCells = allTableRows[rowIdx].map(cellText => ({
              type: 'tableCell',
              attrs: {},
              content: [{
                type: 'paragraph',
                content: parseInlineFormatting(cellText)
              }]
            }));

            tableRows.push({
              type: 'tableRow',
              content: dataCells
            });
          }

          // Create the complete table structure
          content.push({
            type: 'table',
            attrs: {
              isNumberColumnEnabled: false,
              layout: 'default'
            },
            content: tableRows
          });

          // Skip the lines we've processed
          i = tableEndIndex; // Skip the table rows we just processed
          continue;
        }
      }

      // If we reach here, it's not a valid table, treat as regular paragraph
      content.push({
        type: 'paragraph',
        content: parseInlineFormatting(line)
      });
    }
    // Regular paragraph
    else {
      content.push({
        type: 'paragraph',
        content: parseInlineFormatting(line)
      });
    }
  }

  // If no content was parsed, add a simple paragraph
  if (content.length === 0) {
    content.push({
      type: 'paragraph',
      content: [{
        type: 'text',
        text: description || ''
      }]
    });
  }

  return {
    type: 'doc',
    version: 1,
    content
  };
}

/**
 * Convert description to wiki markup text format
 */
export function parseDescriptionToWikiMarkup(description: string): string {
  // Extract code blocks before any line-by-line processing so their
  // contents are never transformed by heading/table/list logic.
  const codeBlockStore: string[] = [];
  const protected_ = description.replace(/```(\w*)\n?([\s\S]*?)```/g, (_full, lang, code) => {
    const idx = codeBlockStore.length;
    const normalizedLang = normalizeCodeLanguage(lang);
    const langSuffix = normalizedLang ? `:language=${normalizedLang}` : '';
    codeBlockStore.push(`{code${langSuffix}}\n${code.replace(/^\n/, '').replace(/\n$/, '')}\n{code}`);
    return `\x00CODEBLOCK_${idx}\x00`;
  });

  const lines = protected_.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Restore code blocks
    if (line.match(/^\x00CODEBLOCK_(\d+)\x00$/)) {
      const idx = parseInt(line.match(/\x00CODEBLOCK_(\d+)\x00/)![1]);
      result.push(codeBlockStore[idx]);
      continue;
    }

    if (line === '') {
      result.push('');
      continue;
    }

    // Handle markdown headers
    if (line.startsWith('###')) {
      result.push('h3. ' + line.substring(3).trim());
    } else if (line.startsWith('##')) {
      result.push('h2. ' + line.substring(2).trim());
    } else if (line.startsWith('#')) {
      result.push('h1. ' + line.substring(1).trim());
    }
    // Handle markdown tables
    else if (line.includes('|') && line.trim() !== '|') {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');

      if (cells.length >= 2) {
        // Collect table rows
        const allTableRows: string[][] = [];
        let currentLine = i;

        while (currentLine < lines.length) {
          const tableLine = lines[currentLine].trim();

          if (tableLine === '') {
            currentLine++;
            continue;
          }

          if (!tableLine.includes('|')) {
            break;
          }

          // Skip separator lines
          if (tableLine.match(/^\|?[\s\-:|]+\|?$/)) {
            currentLine++;
            continue;
          }

          const rowCells = tableLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
          if (rowCells.length >= 2) {
            allTableRows.push(rowCells);
          } else {
            break;
          }
          currentLine++;
        }

        // Convert to Confluence wiki markup
        if (allTableRows.length > 0) {
          // Header row
          if (allTableRows.length > 0) {
            result.push('||*' + allTableRows[0].join('*||*') + '*||');

            // Add separator line based on number of columns
            const numColumns = allTableRows[0].length;
            const separator = '|' + '-|'.repeat(numColumns);
            result.push(separator);
          }

          // Data rows
          for (let rowIdx = 1; rowIdx < allTableRows.length; rowIdx++) {
            result.push('|' + allTableRows[rowIdx].join('|') + '|');
          }

          // Skip processed lines
          i = currentLine - 1;
          continue;
        }
      }

      // If not a valid table, treat as regular text
      result.push(line);
    }
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push('* ' + line.substring(2).trim());
    }
    // Regular text
    else {
      result.push(line);
    }
  }

  return result.join('\n');
}

// ---------------------------------------------------------------------------
// Confluence Storage Format Converter
// ---------------------------------------------------------------------------

/**
 * Escapes special HTML characters for use inside storage-format text nodes.
 */
function escapeStorageHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Applies inline markdown formatting and converts it to Confluence storage
 * format HTML (strong, em, strike, code, links).
 * Code spans are protected from further transformation.
 */
function applyInlineStorageFormat(text: string): string {
  // Protect inline code spans first
  const spans: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_full, code) => {
    const idx = spans.length;
    spans.push(`<code>${escapeStorageHtml(code)}</code>`);
    return `\x00SPAN_${idx}\x00`;
  });

  out = out
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Restore code spans
  spans.forEach((span, idx) => {
    out = out.replace(`\x00SPAN_${idx}\x00`, span);
  });

  return out;
}

/**
 * Returns true when the string already contains Confluence storage-format
 * markup so that it can be passed through as-is.
 */
function isAlreadyStorageFormat(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.startsWith('<') &&
    (trimmed.includes('<ac:') ||
      trimmed.includes('<ri:') ||
      /^<(p|h[1-6]|ul|ol|table|blockquote|hr)\b/i.test(trimmed))
  );
}

/**
 * Converts LLM-produced markdown to Confluence storage format (XHTML).
 * If the input already looks like storage format it is returned unchanged.
 *
 * Supported elements:
 *  - ATX headings (#–######)
 *  - Fenced code blocks (``` lang … ```) → ac:structured-macro "code"
 *  - Blockquotes (> …)
 *  - Unordered lists (- / * / +)
 *  - Ordered lists (1. …)
 *  - Markdown tables
 *  - Horizontal rules (---, ***, ___)
 *  - Inline: **bold**, *italic*, ~~strike~~, `code`, [text](url)
 */
export function markdownToConfluenceStorage(markdown: string): string {
  if (isAlreadyStorageFormat(markdown)) {
    return markdown;
  }

  // --- Phase 1: extract fenced code blocks into placeholders ---
  const codeBlocks: string[] = [];
  const withoutCode = markdown.replace(/```(\w*)\n?([\s\S]*?)```/g, (_full, rawLang, code) => {
    const idx = codeBlocks.length;
    const lang = normalizeCodeLanguage(rawLang);
    const langParam = lang
      ? `<ac:parameter ac:name="language">${lang}</ac:parameter>`
      : '';
    const body = code.replace(/^\n/, '').replace(/\n$/, '');
    codeBlocks.push(
      `<ac:structured-macro ac:name="code">${langParam}` +
      `<ac:plain-text-body><![CDATA[${body}]]></ac:plain-text-body>` +
      `</ac:structured-macro>`
    );
    return `\x00CODE_${idx}\x00`;
  });

  // --- Phase 2: line-by-line conversion ---
  const lines = withoutCode.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Code block placeholder
    const codeMatch = line.match(/^\x00CODE_(\d+)\x00$/);
    if (codeMatch) {
      result.push(codeBlocks[parseInt(codeMatch[1])]);
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      result.push(`<h${level}>${applyInlineStorageFormat(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^([-*_])\1{2,}$/.test(line)) {
      result.push('<hr/>');
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      result.push(`<blockquote><p>${applyInlineStorageFormat(line.substring(2))}</p></blockquote>`);
      i++;
      continue;
    }

    // Table — collect all consecutive table lines
    if (line.startsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim();
        // Skip separator lines (e.g. |---|---|)
        if (!/^\|[\s\-:|]+\|?$/.test(row)) {
          const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
          if (cells.length > 0) tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        let html = '<table><tbody>';
        html += '<tr>' + tableRows[0].map(c => `<th>${applyInlineStorageFormat(c)}</th>`).join('') + '</tr>';
        for (let r = 1; r < tableRows.length; r++) {
          html += '<tr>' + tableRows[r].map(c => `<td>${applyInlineStorageFormat(c)}</td>`).join('') + '</tr>';
        }
        html += '</tbody></table>';
        result.push(html);
      }
      continue;
    }

    // Unordered list — collect consecutive items
    if (/^[-*+]\s/.test(line)) {
      let html = '<ul>';
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        html += `<li>${applyInlineStorageFormat(lines[i].trim().substring(2).trim())}</li>`;
        i++;
      }
      html += '</ul>';
      result.push(html);
      continue;
    }

    // Ordered list — collect consecutive items
    if (/^\d+\.\s/.test(line)) {
      let html = '<ol>';
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^\d+\.\s/, '');
        html += `<li>${applyInlineStorageFormat(text)}</li>`;
        i++;
      }
      html += '</ol>';
      result.push(html);
      continue;
    }

    // Empty line — skip (Confluence doesn't need explicit paragraph breaks between block elements)
    if (line === '') {
      i++;
      continue;
    }

    // Regular paragraph
    result.push(`<p>${applyInlineStorageFormat(line)}</p>`);
    i++;
  }

  return result.join('\n');
}
