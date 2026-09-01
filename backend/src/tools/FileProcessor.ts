// @ts-ignore
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Handle ESModule default export variance for pdf-parse
const pdfParse = (pdf as any).default || pdf;

export interface DocumentChunk {
  text: string;
  index: number;
}

export interface ParsedFile {
  filename: string;
  mimeType: string;
  rawText: string;
  chunks: DocumentChunk[];
}

export async function parseFile(buffer: Buffer, filename: string, mimeType: string): Promise<ParsedFile> {
  let rawText = '';
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'txt' || mimeType.startsWith('text/')) {
    rawText = buffer.toString('utf-8');
  } else if (ext === 'json' || mimeType === 'application/json') {
    try {
      const obj = JSON.parse(buffer.toString('utf-8'));
      rawText = JSON.stringify(obj, null, 2);
    } catch {
      rawText = buffer.toString('utf-8');
    }
  } else if (ext === 'csv' || mimeType === 'text/csv') {
    rawText = buffer.toString('utf-8');
  } else if (ext === 'pdf' || mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    rawText = data.text || '';
  } else if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value || '';
  } else {
    // Treat as plain text fallback
    rawText = buffer.toString('utf-8');
  }

  const chunks = chunkText(rawText);

  return {
    filename,
    mimeType,
    rawText,
    chunks
  };
}

export function chunkText(text: string, chunkSize = 1200, overlap = 200): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let i = 0;
  let chunkIdx = 0;
  
  if (!text || text.trim().length === 0) {
    return [];
  }

  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push({
      text: text.slice(i, end),
      index: chunkIdx++
    });
    if (end === text.length) break;
    i += chunkSize - overlap;
  }
  
  return chunks;
}

export function searchChunks(chunks: DocumentChunk[], query: string, topK = 4): DocumentChunk[] {
  if (!chunks || chunks.length === 0) return [];
  
  // Extract search terms (ignore short terms/stop words)
  const queryTerms = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (queryTerms.length === 0) {
    return chunks.slice(0, topK); // Fallback to first chunks
  }

  const scored = chunks.map(chunk => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Find term matches (allow simple substring matching for robustness)
      let pos = textLower.indexOf(term);
      while (pos !== -1) {
        score += 1;
        pos = textLower.indexOf(term, pos + 1);
      }
    }

    return { chunk, score };
  });

  const matched = scored.filter(s => s.score > 0);
  if (matched.length === 0) {
    return chunks.slice(0, topK); // Fallback if no term hits
  }

  return matched
    .sort((a, b) => b.score - a.score)
    .map(s => s.chunk)
    .slice(0, topK);
}
