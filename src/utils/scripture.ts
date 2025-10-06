type RawScriptureReference =
  | string
  | {
      book?: string;
      chapter?: string | number;
      reference?: string;
      verse?: string | number;
      verse_start?: string | number;
      verse_end?: string | number;
      verses?: Array<string>;
      text?: string;
      verse_text?: string;
    }
  | Record<string, unknown>;

const toStringSafe = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const formatScriptureReference = (reference: RawScriptureReference): string => {
  if (!reference) return '';

  if (typeof reference === 'string') {
    return reference.trim();
  }

  if (typeof reference === 'object') {
    const refObj = reference as Record<string, unknown>;

    const explicitReference = toStringSafe(refObj.reference);
    if (explicitReference) {
      return explicitReference;
    }

    const book = toStringSafe(refObj.book);
    if (!book) return '';

    let composed = book;
    const chapter = toStringSafe(refObj.chapter);
    if (chapter) {
      composed += ` ${chapter}`;

      const verseStart = toStringSafe(refObj.verse_start ?? refObj.verse);
      const verseEnd = toStringSafe(refObj.verse_end);

      if (verseStart) {
        composed += `:${verseStart}`;
        if (verseEnd && verseEnd !== verseStart) {
          composed += `-${verseEnd}`;
        }
      }
    }

    return composed;
  }

  return '';
};

export const extractScriptureText = (reference: RawScriptureReference): string | null => {
  if (!reference || typeof reference === 'string') {
    return null;
  }

  if (typeof reference === 'object') {
    const refObj = reference as Record<string, unknown>;

    const directText = toStringSafe(refObj.text);
    if (directText) return directText;

    const verseText = toStringSafe(refObj.verse_text);
    if (verseText) return verseText;

    const verses = refObj.verses;
    if (Array.isArray(verses) && verses.length) {
      return verses.map(toStringSafe).filter(Boolean).join('\n');
    }
  }

  return null;
};

export const summarizeScriptureReferences = (references?: RawScriptureReference[]): string => {
  if (!references || references.length === 0) {
    return '';
  }

  return references
    .map(reference => formatScriptureReference(reference))
    .filter(Boolean)
    .join(' • ');
};

export const normalizeScriptureReferences = (references?: RawScriptureReference[]) => {
  if (!references || references.length === 0) {
    return [] as Array<{ referenceLabel: string; referenceText: string | null }>;
  }

  return references
    .map(reference => {
      const referenceLabel = formatScriptureReference(reference);
      const referenceText = extractScriptureText(reference);

      if (!referenceLabel && !referenceText) {
        return null;
      }

      return { referenceLabel, referenceText };
    })
    .filter((item): item is { referenceLabel: string; referenceText: string | null } => Boolean(item));
};

export type { RawScriptureReference };
