const Map<String, String> chordDictionary = {
  // --- MAJOR CHORDS ---
  'A': 'x 0 2 2 2 0',
  'A#': 'x 1 3 3 3 1',
  'B': 'x 2 4 4 4 2',
  'C': 'x 3 2 0 1 0',
  'C#': 'x 4 6 6 6 4',
  'D': 'x x 0 2 3 2',
  'D#': 'x x 1 3 4 3',
  'E': '0 2 2 1 0 0',
  'F': '1 3 3 2 1 1',
  'F#': '2 4 4 3 2 2',
  'G': '3 2 0 0 0 3',
  'G#': '4 6 6 5 4 4',

  // Flat Aliases
  'Bb': 'x 1 3 3 3 1',
  'Db': 'x 4 6 6 6 4',
  'Eb': 'x x 1 3 4 3',
  'Gb': '2 4 4 3 2 2',
  'Ab': '4 6 6 5 4 4',

  // --- MINOR CHORDS ---
  'Am': 'x 0 2 2 1 0',
  'A#m': 'x 1 3 3 2 1',
  'Bm': 'x 2 4 4 3 2',
  'Cm': 'x 3 5 5 4 3',
  'C#m': 'x 4 6 6 5 4',
  'Dm': 'x x 0 2 3 1',
  'D#m': 'x x 1 3 4 2',
  'Em': '0 2 2 0 0 0',
  'Fm': '1 3 3 1 1 1',
  'F#m': '2 4 4 2 2 2',
  'Gm': '3 5 5 3 3 3',
  'G#m': '4 6 6 4 4 4',

  'Bbm': 'x 1 3 3 2 1',
  'Dbm': 'x 4 6 6 5 4',
  'Ebm': 'x x 1 3 4 2',
  'Gbm': '2 4 4 2 2 2',
  'Abm': '4 6 6 4 4 4',

  // --- DOMINANT 7THS ---
  'A7': 'x 0 2 0 2 0',
  'A#7': 'x 1 3 1 3 1',
  'B7': 'x 2 1 2 0 2',
  'C7': 'x 3 2 3 1 0',
  'C#7': 'x 4 6 4 6 4',
  'D7': 'x x 0 2 1 2',
  'D#7': 'x x 1 3 2 3',
  'E7': '0 2 0 1 0 0',
  'F7': '1 3 1 2 1 1',
  'F#7': '2 4 2 3 2 2',
  'G7': '3 2 0 0 0 1',
  'G#7': '4 6 4 5 4 4',

  'Bb7': 'x 1 3 1 3 1',
  'Db7': 'x 4 6 4 6 4',
  'Eb7': 'x x 1 3 2 3',
  'Gb7': '2 4 2 3 2 2',
  'Ab7': '4 6 4 5 4 4',

  // --- MINOR 7THS ---
  'Am7': 'x 0 2 0 1 0',
  'A#m7': 'x 1 3 1 2 1',
  'Bm7': 'x 2 4 2 3 2',
  'Cm7': 'x 3 5 3 4 3',
  'C#m7': 'x 4 6 4 5 4',
  'Dm7': 'x x 0 2 1 1',
  'D#m7': 'x x 1 3 2 2',
  'Em7': '0 2 2 0 3 0',
  'Fm7': '1 3 1 1 1 1',
  'F#m7': '2 4 2 2 2 2',
  'Gm7': '3 5 3 3 3 3',
  'G#m7': '4 6 4 4 4 4',

  'Bbm7': 'x 1 3 1 2 1',
  'Dbm7': 'x 4 6 4 5 4',
  'Ebm7': 'x x 1 3 2 2',
  'Gbm7': '2 4 2 2 2 2',
  'Abm7': '4 6 4 4 4 4',

  // --- MAJOR 7THS ---
  'Amaj7': 'x 0 2 1 2 0',
  'A#maj7': 'x 1 3 2 3 1',
  'Bmaj7': 'x 2 4 3 4 2',
  'Cmaj7': 'x 3 2 0 0 0',
  'C#maj7': 'x 4 6 5 6 4',
  'Dmaj7': 'x x 0 2 2 2',
  'D#maj7': 'x x 1 3 3 3',
  'Emaj7': '0 2 1 1 0 0',
  'Fmaj7': 'x x 3 2 1 0',
  'F#maj7': '2 4 3 3 2 2',
  'Gmaj7': '3 2 0 0 0 2',
  'G#maj7': '4 6 5 5 4 4',

  'Bbmaj7': 'x 1 3 2 3 1',
  'Dbmaj7': 'x 4 6 5 6 4',
  'Ebmaj7': 'x x 1 3 3 3',
  'Gbmaj7': '2 4 3 3 2 2',
  'Abmaj7': '4 6 5 5 4 4',

  // --- SUS4 CHORDS ---
  'Asus4': 'x 0 2 2 3 0',
  'A#sus4': 'x 1 3 3 4 1',
  'Bsus4': 'x 2 4 4 5 2',
  'Csus4': 'x 3 5 5 6 3',
  'C#sus4': 'x 4 6 6 7 4',
  'Dsus4': 'x x 0 2 3 3',
  'D#sus4': 'x x 1 3 4 4',
  'Esus4': '0 2 2 2 0 0',
  'Fsus4': '1 3 3 3 1 1',
  'F#sus4': '2 4 4 4 2 2',
  'Gsus4': '3 3 0 0 1 3',
  'G#sus4': '4 6 6 6 4 4',

  'Bbsus4': 'x 1 3 3 4 1',
  'Dbsus4': 'x 4 6 6 7 4',
  'Ebsus4': 'x x 1 3 4 4',
  'Gbsus4': '2 4 4 4 2 2',
  'Absus4': '4 6 6 6 4 4',
};

String? getChordTab(String chordName) {
  if (chordName.contains('/')) {
    chordName = chordName.split('/')[0]; // Simplify slashed bass notes for diagram logic
  }
  return chordDictionary[chordName];
}
