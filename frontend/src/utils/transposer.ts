// Utility functions for transposing chords

const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ALIASES: Record<string, string> = {
    'Db': 'C#',
    'D#': 'Eb',
    'Gb': 'F#',
    'G#': 'Ab',
    'A#': 'Bb'
};

/**
 * Transposes a single chord by a given number of half steps.
 * Examples: 
 * transposeChord('C', 2) -> 'D'
 * transposeChord('G#m7', -1) -> 'Gm7'
 */
const transposeChord = (chord: string, steps: number): string => {
    // Regex to match the root note (A-G followed optionally by # or b)
    const match = chord.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return chord; // Not a recognized chord, return as is

    let root = match[1];
    const suffix = match[2];

    // Convert alias if necessary
    if (ALIASES[root]) {
        root = ALIASES[root];
    }

    const index = KEYS.indexOf(root);
    if (index === -1) return chord; // Root not found in our list (shouldn't happen with regex)

    // Calculate new index with wrap-around
    // steps can be negative, so add KEYS.length and modulo
    let newIndex = (index + steps) % KEYS.length;
    if (newIndex < 0) {
        newIndex += KEYS.length;
    }

    return KEYS[newIndex] + suffix;
};

/**
 * Transposes an entire text block containing lyrics and chords.
 * It uses a regex to find occurrences that look like chords.
 */
export const transposeText = (text: string, steps: number): string => {
    if (!text) return '';
    if (steps === 0) return text;

    // Split by line to preserve formatting
    const lines = text.split('\n');

    const transposedLines = lines.map(line => {
        // Regex for grabbing words that look like chords.
        // It looks for A-G, optionally # or b, then optional suffixes like m, maj, dim, min, 7, 9, etc...
        // Also matching slash chords like C/E
        const chordRegex = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus)?\d*(?:\/[A-G][#b]?)?)\b/g;

        return line.replace(chordRegex, (match) => {
            // Handle slash chords, e.g., "C/E"
            if (match.includes('/')) {
                const parts = match.split('/');
                const transposedChord = transposeChord(parts[0], steps);
                const transposedBass = transposeChord(parts[1], steps);
                return `${transposedChord}/${transposedBass}`;
            }
            return transposeChord(match, steps);
        });
    });

    return transposedLines.join('\n');
};

/**
 * Get difference in half-steps between two keys.
 */
export const getStepDifference = (fromKey: string, toKey: string): number => {
    let from = ALIASES[fromKey] || fromKey;
    let to = ALIASES[toKey] || toKey;

    const fromIndex = KEYS.indexOf(from);
    const toIndex = KEYS.indexOf(to);

    if (fromIndex === -1 || toIndex === -1) return 0;

    return toIndex - fromIndex;
};

export const ALL_KEYS = KEYS;
