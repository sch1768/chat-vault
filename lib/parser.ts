import { ParsedConversation, Turn } from './types';

/**
 * 3-Step Hybrid Parser for ChatGPT & Gemini Shared Links
 */
export async function parseSharedLinkOrText(
  urlOrText: string
): Promise<ParsedConversation> {
  const trimmed = urlOrText.trim();

  // If raw text/markdown
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return parseRawMarkdown(trimmed);
  }

  // Resolve short URLs (e.g. https://g.co/gemini/share/...)
  let url = trimmed;
  if (url.includes('g.co/gemini/share/')) {
    try {
      const redirectRes = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (redirectRes.url) url = redirectRes.url;
    } catch {
      // keep original URL if HEAD redirect check fails
    }
  }

  if (url.includes('chatgpt.com/share/') || url.includes('chat.openai.com/share/')) {
    return await parseChatGPTShareUrl(url);
  }

  if (url.includes('gemini.google.com/share/') || url.includes('g.co/gemini/share/')) {
    return await parseGeminiShareUrl(url);
  }

  // General Jina Reader fallback
  return await parseViaJinaReader(url, 'gemini');
}

/**
 * Step 1: ChatGPT __NEXT_DATA__ JSON Direct Extractor
 */
async function parseChatGPTShareUrl(url: string): Promise<ParsedConversation> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    });

    if (res.ok) {
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
    }
  } catch (err) {
    console.warn('ChatGPT direct parsing failed, falling back to Jina Reader:', err);
  }

  return await parseViaJinaReader(url, 'chatgpt');
}

/**
 * Step 2: Gemini Shared Link Direct HTML & Jina Headless Parser
 */
async function parseGeminiShareUrl(url: string): Promise<ParsedConversation> {
  return await parseViaJinaReader(url, 'gemini');
}

/**
 * Helper: Jina Reader API Parser with Clean-up Filter
 */
async function parseViaJinaReader(
  url: string,
  sourceType: 'chatgpt' | 'gemini' | 'raw' = 'gemini'
): Promise<ParsedConversation> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  const res = await fetch(jinaUrl, {
    headers: {
      Accept: 'text/plain',
    },
  });

  if (!res.ok) {
    throw new Error(`링크 파싱 실패 (상태 코드: ${res.status}). 공유 링크가 올바른지 확인해 주세요.`);
  }

  const rawMarkdown = await res.text();

  // Extract original web page title header from Jina output (e.g. "Title: Gemini - 알파벳 2분기 실적...")
  let extractedTitle = '';
  const titleLineMatch = rawMarkdown.match(/^Title:\s*(.+)$/m);
  if (titleLineMatch && titleLineMatch[1]) {
    const rawTitle = titleLineMatch[1].trim();
    // Filter out generic site tagline "Gemini - direct access to Google AI" or similar
    if (!/direct access to Google AI/i.test(rawTitle) && !/^Gemini$/i.test(rawTitle)) {
      extractedTitle = rawTitle
        .replace(/^Gemini\s*[-–—]\s*/i, '')
        .replace(/^ChatGPT\s*[-–—]\s*/i, '')
        .trim();
    }
  }

  const cleanedMarkdown = cleanScrapedMarkdown(rawMarkdown);

  const parsed = parseMarkdownContent(cleanedMarkdown, url, sourceType);

  if (extractedTitle && (parsed.title === 'Untitled AI Conversation' || parsed.title === 'Gemini Shared Conversation')) {
    parsed.title = extractedTitle;
  }

  // Fallback: If title is still generic, use first user question as title (max 25 chars)
  if (!parsed.title || parsed.title === 'Untitled AI Conversation' || /direct access to Google AI/i.test(parsed.title)) {
    const firstUserTurn = parsed.turns.find((t) => t.speaker === 'user');
    if (firstUserTurn && firstUserTurn.content) {
      const firstLine = firstUserTurn.content.split('\n')[0].trim();
      parsed.title = firstLine.length > 25 ? `${firstLine.slice(0, 25)}...` : firstLine;
    }
  }

  return parsed;
}

/**
 * Filter out Google/ChatGPT boilerplate header & footer noise
 */
function cleanScrapedMarkdown(markdown: string): string {
  let cleaned = markdown;

  // Remove Jina Header metadata & system warnings
  cleaned = cleaned.replace(/^Title:\s*.*$/gm, '');
  cleaned = cleaned.replace(/^Description:\s*.*$/gm, '');
  cleaned = cleaned.replace(/^URL Source:\s*.*$/gm, '');
  cleaned = cleaned.replace(/^Markdown Content:\s*/gm, '');
  cleaned = cleaned.replace(/Warning:\s*This page maybe not yet fully loaded.*$/gm, '');

  // Remove Google Sign-in & Footer navigation links
  cleaned = cleaned.replace(/\[\s*\]\(https:\/\/www\.google\.com.*?\)/gi, '');
  cleaned = cleaned.replace(/\[\s*\]\(https:\/\/gemini\.google\.com.*?\)/gi, '');
  cleaned = cleaned.replace(/\[Sign in\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/!\[Image \d+\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/\[About Gemini Opens in a new window\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/\[Get Gemini App Opens in a new window\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/\[Subscriptions Opens in a new window\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/\[For Business Opens in a new window\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/\[Google Privacy Policy Opens in a new window\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/\[Google Terms of Service Opens in a new window\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/\[Your privacy & Gemini Apps Opens in a new window\]\(.*?\)/gi, '');
  cleaned = cleaned.replace(/Gemini may display inaccurate info, including about people, so double-check its responses\./gi, '');
  cleaned = cleaned.replace(/Created with \*\*Flash\*\*.*$/gm, '');
  cleaned = cleaned.replace(/Published August.*$/gm, '');
  cleaned = cleaned.replace(/^Sign in$/gm, '');
  cleaned = cleaned.replace(/^Google apps$/gm, '');
  cleaned = cleaned.replace(/^Copy public link$/gm, '');
  cleaned = cleaned.replace(/^Report$/gm, '');
  cleaned = cleaned.replace(/👤 User/g, '');

  return cleaned.trim();
}

/**
 * Step 3: Parse Markdown Content with "You said" & Multi-turn Detection
 */
function parseRawMarkdown(text: string): ParsedConversation {
  return parseMarkdownContent(text, undefined, 'raw');
}

function parseMarkdownContent(
  text: string,
  url?: string,
  sourceType: 'chatgpt' | 'gemini' | 'raw' = 'raw'
): ParsedConversation {
  let title = 'Untitled AI Conversation';

  // Extract page title from H1 (# Title) if explicitly present
  const titleMatch = text.match(/^#\s+\*?\*?([^\n*]+)\*?\*?/m);
  if (titleMatch && titleMatch[1]) {
    const rawMatch = titleMatch[1].trim();
    if (!/direct access to Google AI/i.test(rawMatch) && !/^\d+\./.test(rawMatch)) {
      title = rawMatch;
    }
  }

  const turns: Turn[] = [];

  // Split by "You said" (Gemini pattern) or "### User" / "### Assistant"
  const turnBlocks = text.split(/(?=(?:You said|###?\s*(?:User|Prompt|Human|Assistant|Gemini|ChatGPT|Response):?))/i);

  for (const block of turnBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (/^You said/i.test(trimmed)) {
      // Gemini User Turn: split user question and AI response
      const rawText = trimmed.replace(/^You said/i, '').trim();
      const lines = rawText.split('\n');

      // User question lasts until empty line or section header / AI response
      let userLines: string[] = [];
      let aiLines: string[] = [];
      let isAiPart = false;

      for (const line of lines) {
        const lineTrim = line.trim();
        if (!isAiPart) {
          if (lineTrim === '' && userLines.length > 0) {
            isAiPart = true;
          } else {
            userLines.push(line);
          }
        } else {
          aiLines.push(line);
        }
      }

      const userQuestion = userLines.join('\n').trim();
      const aiResponse = aiLines.join('\n').trim();

      if (userQuestion) {
        turns.push({ speaker: 'user', content: userQuestion });
      }
      if (aiResponse) {
        turns.push({ speaker: 'assistant', content: aiResponse });
      }
    } else if (/^(?:###?\s*(?:User|Prompt|Human):?)/i.test(trimmed)) {
      const content = trimmed.replace(/^(?:###?\s*(?:User|Prompt|Human):?)/i, '').trim();
      if (content) turns.push({ speaker: 'user', content });
    } else if (/^(?:###?\s*(?:Assistant|Gemini|ChatGPT|Response):?)/i.test(trimmed)) {
      const content = trimmed.replace(/^(?:###?\s*(?:Assistant|Gemini|ChatGPT|Response):?)/i, '').trim();
      if (content) turns.push({ speaker: 'assistant', content });
    } else {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn) {
        lastTurn.content += `\n\n${trimmed}`;
      } else {
        // If shared Gemini markdown starts directly with AI response (no 'You said' header),
        // we create a placeholder user question that Gemma AI will restore from context.
        turns.push({ speaker: 'assistant', content: trimmed });
      }
    }
  }

  if (turns.length === 0) {
    turns.push({ speaker: 'assistant', content: text });
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
