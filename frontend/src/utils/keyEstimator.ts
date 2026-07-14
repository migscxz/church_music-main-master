export interface KeyEstimate {
  keyName: string;
  rootNote: string;
  score: number;
}

const scales = [
  { root: 'C', name: 'C Major / A Minor', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  { root: 'C#', name: 'C# Major / A# Minor', notes: ['C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C'] },
  { root: 'D', name: 'D Major / B Minor', notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] },
  { root: 'D#', name: 'D# Major / C Minor', notes: ['D#', 'F', 'G', 'G#', 'A#', 'C', 'D'] },
  { root: 'E', name: 'E Major / C# Minor', notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] },
  { root: 'F', name: 'F Major / D Minor', notes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E'] },
  { root: 'F#', name: 'F# Major / D# Minor', notes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'] },
  { root: 'G', name: 'G Major / E Minor', notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
  { root: 'G#', name: 'G# Major / F Minor', notes: ['G#', 'A#', 'C', 'C#', 'D#', 'F', 'G'] },
  { root: 'A', name: 'A Major / F# Minor', notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] },
  { root: 'A#', name: 'A# Major / G Minor', notes: ['A#', 'C', 'D', 'D#', 'F', 'G', 'A'] },
  { root: 'B', name: 'B Major / G# Minor', notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'] },
];

export class KeyEstimator {
  static estimateKeys(histogram: Record<string, number>): KeyEstimate[] {
    const keys = Object.keys(histogram);
    if (keys.length === 0) return [];

    let totalNotes = 0;
    for (const key of keys) {
      totalNotes += histogram[key];
    }
    if (totalNotes === 0) return [];

    const estimates: KeyEstimate[] = [];

    for (const scale of scales) {
      const root = scale.root;
      const name = scale.name;
      const notesInScale = scale.notes;

      let score = 0;

      for (const [note, count] of Object.entries(histogram)) {
        if (notesInScale.includes(note)) {
          // Base score
          score += count;
          // Weight the tonic note heavier
          if (note === root) {
            score += count * 0.5;
          }
        } else {
          // Immediate harsh penalty for out-of-scale notes
          score -= count * 1.5;
        }
      }

      // Rough percentage normalization for display purposes
      const normalizedScore = score / totalNotes;
      estimates.push({ keyName: name, rootNote: root, score: normalizedScore });
    }

    estimates.sort((a, b) => b.score - a.score);
    return estimates.slice(0, 3);
  }
}
