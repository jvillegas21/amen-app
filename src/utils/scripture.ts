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
    explanation?: string;
  }
  | Record<string, unknown>;

export const toStringSafe = (value: unknown): string => {
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

export const extractScriptureExplanation = (reference: RawScriptureReference): string | null => {
  if (!reference || typeof reference === 'string') {
    return null;
  }

  if (typeof reference === 'object') {
    const refObj = reference as Record<string, unknown>;
    return toStringSafe(refObj.explanation) || null;
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
    return [] as Array<{ referenceLabel: string; referenceText: string | null; explanation: string | null }>;
  }

  return references
    .map(ref => ({
      referenceLabel: formatScriptureReference(ref),
      referenceText: extractScriptureText(ref),
      explanation: extractScriptureExplanation(ref),
    }))
    .filter(item => Boolean(item.referenceLabel));
};

export const extractStudySections = (contentMd?: string) => {
  if (!contentMd) return [] as Array<{ heading: string; body: string; type?: 'reflection' | 'questions' | 'prayer' | 'application' | 'other' }>;

  const normalizedContent = contentMd.replace(/\r\n/g, '\n');

  // Common headers used in AI generation
  const headerPatterns = [
    { type: 'reflection', pattern: /^(?:##\s*)?(?:Reflection|Devotional|Study Notes)(?:\s*:)?$/im },
    { type: 'questions', pattern: /^(?:##\s*)?(?:Discussion Questions|Questions for Reflection|Think About It)(?:\s*:)?$/im },
    { type: 'prayer', pattern: /^(?:##\s*)?(?:Prayer Focus|Prayer|Let's Pray)(?:\s*:)?$/im },
    { type: 'application', pattern: /^(?:##\s*)?(?:Application|Live It Out|Action Steps)(?:\s*:)?$/im },
  ];

  const lines = normalizedContent.split('\n');
  const sections: Array<{ heading: string; body: string; type?: string }> = [];
  let currentSection: { heading: string; body: string[]; type?: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentSection) currentSection.body.push('');
      continue;
    }

    // Check if line matches a known header
    let matchedType: string | undefined;
    let matchedHeading = line;

    for (const { type, pattern } of headerPatterns) {
      if (pattern.test(line)) {
        matchedType = type;
        matchedHeading = line.replace(/^(?:##\s*)/, '').replace(/:$/, '');
        break;
      }
    }

    // Also check for standard markdown headers if not matched yet
    if (!matchedType && line.startsWith('##')) {
      matchedType = 'other';
      matchedHeading = line.replace(/^##\s*/, '').trim();
    }

    if (matchedType) {
      // Save previous section
      if (currentSection) {
        sections.push({
          heading: currentSection.heading,
          body: currentSection.body.join('\n').trim(),
          type: currentSection.type
        });
      }
      // Start new section
      currentSection = {
        heading: matchedHeading,
        body: [],
        type: matchedType
      };
    } else {
      // Content line
      if (currentSection) {
        currentSection.body.push(lines[i]); // Keep original indentation/formatting
      } else {
        // Implicit first section (usually Reflection)
        currentSection = {
          heading: 'Reflection',
          body: [lines[i]],
          type: 'reflection'
        };
      }
    }
  }

  // Push last section
  if (currentSection) {
    sections.push({
      heading: currentSection.heading,
      body: currentSection.body.join('\n').trim(),
      type: currentSection.type
    });
  }

  return sections.filter(s => s.body.length > 0);
};

export type { RawScriptureReference };
