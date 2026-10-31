/**
 * Local 384-dimensional vector embedding generator using @xenova/transformers.
 * Runs completely in Node.js CPU without requiring external API keys or Python.
 */

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    try {
      const { pipeline } = await import('@xenova/transformers');
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
    } catch (err) {
      console.warn('[Embeddings] Fallback to deterministic pseudo-embedding engine:', (err as Error).message);
      extractor = 'fallback';
    }
  }
  return extractor;
}

/**
 * Generates a normalized 384-dimensional float vector formatted for pgvector: '[0.1, -0.2, ...]'
 */
export async function generateEmbedding(text: string): Promise<string> {
  const model = await getExtractor();

  if (model && model !== 'fallback') {
    try {
      const output = await model(text, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data as Float32Array).slice(0, 384);
      return `[${vector.join(',')}]`;
    } catch (err) {
      console.warn('[Embeddings] Model inference error, applying fallback vector:', err);
    }
  }

  // Deterministic 384-d fallback vector generator based on input text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const fallbackVec: number[] = [];
  let sumSq = 0;
  for (let i = 1; i <= 384; i++) {
    const val = Math.sin(hash * i * 0.001) * 0.1;
    fallbackVec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  const normalized = fallbackVec.map((v) => Number((v / norm).toFixed(6)));

  return `[${normalized.join(',')}]`;
}
