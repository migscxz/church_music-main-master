import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

class ChordTransposer {
  static const List<String> keys = [
    'A',
    'A#',
    'B',
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#'
  ];

  static const Map<String, String> _aliases = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
  };

  static String transposeChord(String chord, int steps) {
    if (steps == 0) return chord;
    final match = RegExp(r'^([A-G][#b]?)(.*)$').firstMatch(chord);
    if (match == null) return chord;

    String root = match.group(1)!;
    String suffix = match.group(2)!;

    if (_aliases.containsKey(root)) {
      root = _aliases[root]!;
    }

    int index = keys.indexOf(root);
    if (index == -1) return chord;

    int newIndex = (index + steps) % keys.length;
    if (newIndex < 0) {
      newIndex += keys.length;
    }

    return keys[newIndex] + suffix;
  }

  static String transposeText(String text, int steps) {
    if (text.isEmpty || steps == 0) return text;

    final lines = text.split('\n');
    // Regex looks for chords separated by word boundaries.
    // (?!\w) is used at the end to allow things like C# which don't end in a word character.
    final RegExp chordRegex =
        RegExp(r'\b([A-G][#b]?(?:m|maj|min|dim|aug|sus)?\d*(?:\/[A-G][#b]?)?)(?!\w)');

    final transposedLines = lines.map((line) {
      return line.replaceAllMapped(chordRegex, (match) {
        String chordStr = match.group(0)!;
        if (chordStr.contains('/')) {
          final parts = chordStr.split('/');
          if (parts.length == 2) {
            final transposedChord = transposeChord(parts[0], steps);
            final transposedBass = transposeChord(parts[1], steps);
            return '$transposedChord/$transposedBass';
          }
        }
        return transposeChord(chordStr, steps);
      });
    }).toList();

    return transposedLines.join('\n');
  }

  static int getStepDifference(String fromKey, String toKey) {
    String from = _aliases[fromKey] ?? fromKey;
    String to = _aliases[toKey] ?? toKey;

    int fromIndex = keys.indexOf(from);
    int toIndex = keys.indexOf(to);

    if (fromIndex == -1 || toIndex == -1) return 0;

    return toIndex - fromIndex;
  }

  static List<InlineSpan> getTransposedSpans(
    String text,
    int steps,
    TextStyle defaultStyle,
    TextStyle chordStyle,
    Function(String) onChordTap,
  ) {
    if (text.isEmpty) return [];

    final RegExp chordRegex =
        RegExp(r'\b([A-G][#b]?(?:m|maj|min|dim|aug|sus)?\d*(?:\/[A-G][#b]?)?)(?!\w)');
    final lines = text.split('\n');
    List<InlineSpan> spans = [];

    for (int i = 0; i < lines.length; i++) {
      String line = lines[i];
      int lastMatchEnd = 0;

      for (Match match in chordRegex.allMatches(line)) {
        if (match.start > lastMatchEnd) {
          spans.add(TextSpan(
              text: line.substring(lastMatchEnd, match.start),
              style: defaultStyle));
        }

        String chordStr = match.group(0)!;
        String transposedChoice = chordStr;
        if (steps != 0) {
          if (chordStr.contains('/')) {
            final parts = chordStr.split('/');
            if (parts.length == 2) {
              final tChord = transposeChord(parts[0], steps);
              final tBass = transposeChord(parts[1], steps);
              transposedChoice = '$tChord/$tBass';
            }
          } else {
            transposedChoice = transposeChord(chordStr, steps);
          }
        }

        spans.add(
          TextSpan(
            text: transposedChoice,
            style: chordStyle,
            recognizer: TapGestureRecognizer()
              ..onTap = () => onChordTap(transposedChoice),
          ),
        );

        lastMatchEnd = match.end;
      }

      if (lastMatchEnd < line.length) {
        spans.add(TextSpan(
            text: line.substring(lastMatchEnd), style: defaultStyle));
      }

      if (i < lines.length - 1) {
        spans.add(TextSpan(text: '\n', style: defaultStyle));
      }
    }

    return spans;
  }
}
