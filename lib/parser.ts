import { ParsedConversation, Turn } from './types';

/**
 * 3-Step Hybrid Parser for ChatGPT & Gemini Shared Links or Raw Text
 */
export async function parseSharedLinkOrText(
  urlOrText: string
): Promise<ParsedConversation> {
  const trimmed = urlOrText.trim();

  // Check if raw text/markdown or URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return parseRawMarkdown(trimmed);
  }

  const url = trimmed;

  if (url.includes('chatgpt.com/share/') || url.includes('chat.openai.com/share/')) {
    return await parseChatGPTShareUrl(url);
  }

  if (url.includes('share.gemini.google') || url.includes('gemini.google.com/share/')) {
    return await parseGeminiShareUrl(url);
  }

  // Fallback for general URLs via Jina Reader API
  return await parseViaJinaReader(url);
}

/**
 * Step 1: ChatGPT __NEXT_DATA__ JSON Direct Extractor
 */
async function parseChatGPTShareUrl(url: string): Promise<ParsedConversation> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const html = await res.text();
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

    if (nextDataMatch && nextDataMatch[1]) {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const serverResponse = jsonData.props?.pageProps?.serverResponse;
      const shareData = serverResponse?.data || jsonData.props?.pageProps?.sharedData;

      if (shareData) {
        const title = shareData.title || 'ChatGPT Shared Conversation';
        const linearConversation = shareData.linear_conversation || [];
        const turns: Turn[] = [];

        for (const item of linearConversation) {
          const role = item.message?.author?.role;
          const parts = item.message?.content?.parts || [];
          const textContent = parts.filter((p: unknown) => typeof p === 'string').join('\n');

          if (textContent && (role === 'user' || role === 'assistant')) {
            turns.push({
              speaker: role,
              content: textContent,
            });
          }
        }

        if (turns.length > 0) {
          return buildParsedConversation(title, url, 'chatgpt', turns);
        }
      }
    }
  } catch (err) {
    console.warn('ChatGPT __NEXT_DATA__ Direct parsing failed, falling back to Jina Reader:', err);
  }

  // Fallback to Jina Reader if direct extraction was blocked
  return await parseViaJinaReader(url, 'chatgpt');
}

/**
 * Step 2: Gemini or Scraper Fallback via Jina Reader (https://r.jina.ai/)
 */
async function parseGeminiShareUrl(url: string): Promise<ParsedConversation> {
  return await parseViaJinaReader(url, 'gemini');
}

/**
 * Helper: Jina Reader API Parser
 */
async function parseViaJinaReader(
  url: string,
  sourceType: 'chatgpt' | 'gemini' | 'raw' = 'gemini'
): Promise<ParsedConversation> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  const res = await fetch(jinaUrl, {
    headers: {
      Accept: 'text/plain',
      'X-No-Cache': 'true',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to scrape link with status ${res.status}. Please try copying and pasting text directly.`);
  }

  const markdown = await res.text();
  return parseMarkdownContent(markdown, url, sourceType);
}

/**
 * Step 3: Raw Markdown / Text Parser
 */
function parseRawMarkdown(text: string): ParsedConversation {
  return parseMarkdownContent(text, undefined, 'raw');
}

function parseMarkdownContent(
  text: string,
  url?: string,
  sourceType: 'chatgpt' | 'gemini' | 'raw' = 'raw'
): ParsedConversation {
  const lines = text.split('\n');
  let title = 'Untitled AI Conversation';

  // Extract first title header if available
  const titleLine = lines.find((l) => l.startsWith('# '));
  if (titleLine) {
    title = titleLine.replace(/^#\s+/, '').trim();
  }

  // Simple heuristic split for turns (User / Assistant)
  const turns: Turn[] = [];
  const turnBlocks = text.split(/(?=(?:###?\s*(?:User|Prompt|Human|Assistant|Gemini|ChatGPT|Response):?))/i);

  for (const block of turnBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (/^(?:###?\s*(?:User|Prompt|Human):?)/i.test(trimmed)) {
      const content = trimmed.replace(/^(?:###?\s*(?:User|Prompt|Human):?)/i, '').trim();
      if (content) turns.push({ speaker: 'user', content });
    } else if (/^(?:###?\s*(?:Assistant|Gemini|ChatGPT|Response):?)/i.test(trimmed)) {
      const content = trimmed.replace(/^(?:###?\s*(?:Assistant|Gemini|ChatGPT|Response):?)/i, '').trim();
      if (content) turns.push({ speaker: 'assistant', content });
    } else {
      // General paragraph block
      const lastTurn = turns[turns.length - 1];
      if (lastTurn) {
        lastTurn.content += `\n\n${trimmed}`;
      } else {
        turns.push({ speaker: 'user', content: trimmed });
      }
    }
  }

  if (turns.length === 0) {
    turns.push({ speaker: 'user', content: text });
  }

  return buildParsedConversation(title, url, sourceType, turns);
}

function buildParsedConversation(
  title: string,
  url: string | undefined,
  sourceType: 'chatgpt' | 'gemini' | 'raw',
  turns: Turn[]
): ParsedConversation {
  const fullMarkdown = turns.map((t) => `### ${t.speaker === 'user' ? 'User' : 'Assistant'}\n${t.content}`).join('\n\n');

  return {
    title,
    sourceUrl: url,
    sourceType,
    turns,
    fullMarkdown,
  };
}
