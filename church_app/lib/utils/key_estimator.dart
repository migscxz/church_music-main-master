class KeyEstimate {
  final String keyName;
  final String rootNote;
  final double score;

  KeyEstimate(this.keyName, this.rootNote, this.score);
}

class KeyEstimator {
  static final List<Map<String, dynamic>> _scales = [
    {'root': 'C', 'name': 'C Major / A Minor', 'notes': ['C', 'D', 'E', 'F', 'G', 'A', 'B']},
    {'root': 'C#', 'name': 'C# Major / A# Minor', 'notes': ['C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C']},
    {'root': 'D', 'name': 'D Major / B Minor', 'notes': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#']},
    {'root': 'D#', 'name': 'D# Major / C Minor', 'notes': ['D#', 'F', 'G', 'G#', 'A#', 'C', 'D']},
    {'root': 'E', 'name': 'E Major / C# Minor', 'notes': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#']},
    {'root': 'F', 'name': 'F Major / D Minor', 'notes': ['F', 'G', 'A', 'A#', 'C', 'D', 'E']},
    {'root': 'F#', 'name': 'F# Major / D# Minor', 'notes': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F']},
    {'root': 'G', 'name': 'G Major / E Minor', 'notes': ['G', 'A', 'B', 'C', 'D', 'E', 'F#']},
    {'root': 'G#', 'name': 'G# Major / F Minor', 'notes': ['G#', 'A#', 'C', 'C#', 'D#', 'F', 'G']},
    {'root': 'A', 'name': 'A Major / F# Minor', 'notes': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#']},
    {'root': 'A#', 'name': 'A# Major / G Minor', 'notes': ['A#', 'C', 'D', 'D#', 'F', 'G', 'A']},
    {'root': 'B', 'name': 'B Major / G# Minor', 'notes': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']},
  ];

  static List<KeyEstimate> estimateKeys(Map<String, int> histogram) {
    if (histogram.isEmpty) return [];

    int totalNotes = histogram.values.fold(0, (a, b) => a + b);
    if (totalNotes == 0) return [];

    List<KeyEstimate> estimates = [];

    for (var scale in _scales) {
      String root = scale['root'] as String;
      String name = scale['name'] as String;
      List<String> notesInScale = scale['notes'] as List<String>;

      double score = 0;

      histogram.forEach((note, count) {
        if (notesInScale.contains(note)) {
          // Base score
          score += count;
          // Weight the tonic note heavier
          if (note == root) {
            score += count * 0.5;
          }
        } else {
          // Immediate harsh penalty for out-of-scale notes
          score -= count * 1.5;
        }
      });

      // Rough percentage normalization for display purposes
      double normalizedScore = (score / totalNotes);
      estimates.add(KeyEstimate(name, root, normalizedScore));
    }

    estimates.sort((a, b) => b.score.compareTo(a.score));
    return estimates.take(3).toList();
  }
}
