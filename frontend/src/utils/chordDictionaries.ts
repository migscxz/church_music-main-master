// src/utils/chordDictionaries.ts

export const PIANO_ROOTS: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

export const PIANO_QUALITIES: Record<string, number[]> = {
    '': [0, 4, 7],           // Major
    'm': [0, 3, 7],          // Minor
    '7': [0, 4, 7, 10],      // Dominant 7th
    'm7': [0, 3, 7, 10],     // Minor 7th
    'maj7': [0, 4, 7, 11],   // Major 7th
    'sus4': [0, 5, 7],       // Sus 4
    'sus2': [0, 2, 7],       // Sus 2
    'dim': [0, 3, 6],        // Diminished
    'aug': [0, 4, 8],        // Augmented
    '6': [0, 4, 7, 9],       // Major 6th
    'm6': [0, 3, 7, 9],      // Minor 6th
    'add9': [0, 4, 7, 14],   // Add 9
    'madd9': [0, 3, 7, 14]   // Minor Add 9
};

/**
 * Given a chord like "C#m7" or "G/B", returns the keys to press on a 24-key piano (0-23).
 */
export function getPianoNotes(chordName: string): number[] | null {
    // Strip bass notes for now (e.g., G/B -> G)
    const baseChord = chordName.split('/')[0];
    
    // Parse root and quality
    const match = baseChord.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return null;
    
    const root = match[1];
    let quality = match[2];
    
    // Simplify some complex qualities if we don't have them
    if (!PIANO_QUALITIES[quality]) {
        if (quality.includes('m7')) quality = 'm7';
        else if (quality.includes('maj7')) quality = 'maj7';
        else if (quality.includes('m')) quality = 'm';
        else if (quality.includes('7')) quality = '7';
        else quality = ''; // fallback to Major
    }
    
    const rootIndex = PIANO_ROOTS[root];
    if (rootIndex === undefined) return null;
    
    const offsets = PIANO_QUALITIES[quality] || PIANO_QUALITIES[''];
    
    // Map offsets to absolute keys on a 24-key keyboard
    return offsets.map(offset => {
        let key = rootIndex + offset;
        // Shift octave down if it goes too high so it fits on 24 keys nicely
        if (key > 23) key -= 12;
        return key;
    });
}

/**
 * Array of 6 items for the strings: E, A, D, G, B, e.
 * Number = fret to press.
 * 'x' = do not play string.
 * 0 = open string.
 */
export type GuitarFret = number | 'x';

export const GUITAR_CHORDS: Record<string, GuitarFret[]> = {
    // A
    'A': ['x', 0, 2, 2, 2, 0],
    'Am': ['x', 0, 2, 2, 1, 0],
    'A7': ['x', 0, 2, 0, 2, 0],
    'Am7': ['x', 0, 2, 0, 1, 0],
    'Amaj7': ['x', 0, 2, 1, 2, 0],
    'Asus4': ['x', 0, 2, 2, 3, 0],
    
    // Bb / A#
    'Bb': ['x', 1, 3, 3, 3, 1],
    'Bbm': ['x', 1, 3, 3, 2, 1],
    'Bb7': ['x', 1, 3, 1, 3, 1],
    'Bbm7': ['x', 1, 3, 1, 2, 1],
    'Bbmaj7': ['x', 1, 3, 2, 3, 1],
    'A#': ['x', 1, 3, 3, 3, 1],
    'A#m': ['x', 1, 3, 3, 2, 1],
    
    // B
    'B': ['x', 2, 4, 4, 4, 2],
    'Bm': ['x', 2, 4, 4, 3, 2],
    'B7': ['x', 2, 1, 2, 0, 2],
    'Bm7': ['x', 2, 4, 2, 3, 2],
    'Bmaj7': ['x', 2, 4, 3, 4, 2],
    
    // C
    'C': ['x', 3, 2, 0, 1, 0],
    'Cm': ['x', 3, 5, 5, 4, 3],
    'C7': ['x', 3, 2, 3, 1, 0],
    'Cm7': ['x', 3, 5, 3, 4, 3],
    'Cmaj7': ['x', 3, 2, 0, 0, 0],
    'Csus4': ['x', 3, 3, 0, 1, 0],
    
    // C# / Db
    'C#': ['x', 4, 6, 6, 6, 4],
    'C#m': ['x', 4, 6, 6, 5, 4],
    'C#7': ['x', 4, 6, 4, 6, 4],
    'C#m7': ['x', 4, 6, 4, 5, 4],
    'Db': ['x', 4, 6, 6, 6, 4],
    'Dbm': ['x', 4, 6, 6, 5, 4],
    
    // D
    'D': ['x', 'x', 0, 2, 3, 2],
    'Dm': ['x', 'x', 0, 2, 3, 1],
    'D7': ['x', 'x', 0, 2, 1, 2],
    'Dm7': ['x', 'x', 0, 2, 1, 1],
    'Dmaj7': ['x', 'x', 0, 2, 2, 2],
    'Dsus4': ['x', 'x', 0, 2, 3, 3],
    'Dsus2': ['x', 'x', 0, 2, 3, 0],
    
    // Eb / D#
    'Eb': ['x', 6, 8, 8, 8, 6],
    'Ebm': ['x', 6, 8, 8, 7, 6],
    'Eb7': ['x', 6, 8, 6, 8, 6],
    'Ebm7': ['x', 6, 8, 6, 7, 6],
    'D#': ['x', 6, 8, 8, 8, 6],
    'D#m': ['x', 6, 8, 8, 7, 6],
    
    // E
    'E': [0, 2, 2, 1, 0, 0],
    'Em': [0, 2, 2, 0, 0, 0],
    'E7': [0, 2, 0, 1, 0, 0],
    'Em7': [0, 2, 2, 0, 3, 0],
    'Emaj7': [0, 2, 1, 1, 0, 0],
    'Esus4': [0, 2, 2, 2, 0, 0],
    
    // F
    'F': [1, 3, 3, 2, 1, 1],
    'Fm': [1, 3, 3, 1, 1, 1],
    'F7': [1, 3, 1, 2, 1, 1],
    'Fm7': [1, 3, 1, 1, 1, 1],
    'Fmaj7': ['x', 'x', 3, 2, 1, 0],
    
    // F# / Gb
    'F#': [2, 4, 4, 3, 2, 2],
    'F#m': [2, 4, 4, 2, 2, 2],
    'F#7': [2, 4, 2, 3, 2, 2],
    'F#m7': [2, 4, 2, 2, 2, 2],
    'Gb': [2, 4, 4, 3, 2, 2],
    'Gbm': [2, 4, 4, 2, 2, 2],
    
    // G
    'G': [3, 2, 0, 0, 0, 3],
    'Gm': [3, 5, 5, 3, 3, 3],
    'G7': [3, 2, 0, 0, 0, 1],
    'Gm7': [3, 5, 3, 3, 3, 3],
    'Gmaj7': [3, 2, 0, 0, 0, 2],
    'Gsus4': [3, 3, 0, 0, 1, 3],
    
    // Ab / G#
    'Ab': [4, 6, 6, 5, 4, 4],
    'Abm': [4, 6, 6, 4, 4, 4],
    'Ab7': [4, 6, 4, 5, 4, 4],
    'Abm7': [4, 6, 4, 4, 4, 4],
    'G#': [4, 6, 6, 5, 4, 4],
    'G#m': [4, 6, 6, 4, 4, 4],
};

export function getGuitarFingering(chordName: string): GuitarFret[] | null {
    // Exact match
    if (GUITAR_CHORDS[chordName]) return GUITAR_CHORDS[chordName];
    
    // Try stripping bass note
    const base = chordName.split('/')[0];
    if (GUITAR_CHORDS[base]) return GUITAR_CHORDS[base];
    
    // Fallbacks to simpler chords if not found
    if (base.includes('m7')) return GUITAR_CHORDS[base.replace('m7', 'm')] || null;
    if (base.includes('maj7')) return GUITAR_CHORDS[base.replace('maj7', '')] || null;
    if (base.includes('sus')) return GUITAR_CHORDS[base.replace(/sus./, '')] || null;
    if (base.includes('7')) return GUITAR_CHORDS[base.replace('7', '')] || null;
    
    return null;
}
