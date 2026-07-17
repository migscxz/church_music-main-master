import 'package:flutter/material.dart';
import '../models/models.dart';
import '../utils/constants.dart';
import '../utils/chord_transposer.dart';
import 'pitch_detection_screen.dart';
import '../utils/chord_dictionary.dart';
import 'package:flutter_guitar_tabs/flutter_guitar_tabs.dart';

class ChordViewerScreen extends StatefulWidget {
  final SongVersion songVersion;
  final String listContext;

  const ChordViewerScreen({
    super.key,
    required this.songVersion,
    required this.listContext,
  });

  @override
  _ChordViewerScreenState createState() => _ChordViewerScreenState();
}

class _ChordViewerScreenState extends State<ChordViewerScreen> {
  double _fontSize = 16.0;
  bool _isStageMode = false; // Dark mode for live stage
  late String _targetKey;

  @override
  void initState() {
    super.initState();
    _targetKey = widget.songVersion.key;
  }

  void _showChordDiagram(String chordName) {
    String? tabStr = getChordTab(chordName);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          title: Text(
            'Chord: $chordName',
            style: const TextStyle(
                color: AppColors.textMain, fontWeight: FontWeight.bold),
          ),
          content: (tabStr != null && tabStr.isNotEmpty)
              ? SizedBox(
                  width: 250,
                  height: 250,
                  child: Center(
                    child: TabWidget(
                      name: chordName,
                      tabs: [tabStr],
                      showStartFretNumber: true,
                    ),
                  ),
                )
              : const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'Diagram not available for this chord.',
                    style: TextStyle(color: AppColors.textMain),
                  ),
                ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close',
                  style: TextStyle(color: AppColors.accentGold)),
            )
          ],
        );
      },
    );
  }

  void _increaseFontSize() {
    setState(() {
      if (_fontSize < 36.0) _fontSize += 2.0;
    });
  }

  void _decreaseFontSize() {
    setState(() {
      if (_fontSize > 10.0) _fontSize -= 2.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = _isStageMode ? Colors.black : AppColors.background;
    final textColor = _isStageMode ? Colors.white : AppColors.textMain;
    final appbarColor = _isStageMode ? Colors.grey[900] : AppColors.surface;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.songVersion.song?.title ?? 'Unknown Title',
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Original Key: ${widget.songVersion.key} • By: ${widget.songVersion.leader?.name ?? "Unknown"}',
              style: TextStyle(
                color: _isStageMode ? Colors.white70 : AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
        backgroundColor: appbarColor,
        elevation: 0,
        iconTheme: IconThemeData(color: textColor),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _targetKey,
                dropdownColor: appbarColor,
                style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16),
                icon: Icon(Icons.arrow_drop_down, color: textColor),
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _targetKey = newValue;
                    });
                  }
                },
                items: [
                  if (!ChordTransposer.keys.contains(_targetKey))
                    DropdownMenuItem<String>(
                      value: _targetKey,
                      child: Text(_targetKey),
                    ),
                  ...ChordTransposer.keys.map<DropdownMenuItem<String>>((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  })
                ],
              ),
            ),
          ),
          IconButton(
            icon: Icon(Icons.mic),
            onPressed: () async {
              final newKey = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => PitchDetectionScreen(
                    targetVersionId: widget.songVersion.id,
                    songTitle: widget.songVersion.song?.title,
                    leaderName: widget.songVersion.leader?.name,
                  ),
                ),
              );
              
              if (newKey != null && newKey is String && newKey.isNotEmpty) {
                setState(() {
                  _targetKey = newKey;
                });
              }
            },
            tooltip: 'Detect Key',
          ),
          IconButton(
            icon: Icon(Icons.remove_circle_outline),
            onPressed: _decreaseFontSize,
            tooltip: 'Decrease Font Size',
          ),
          IconButton(
            icon: Icon(Icons.add_circle_outline),
            onPressed: _increaseFontSize,
            tooltip: 'Increase Font Size',
          ),
          IconButton(
            icon: Icon(_isStageMode ? Icons.light_mode : Icons.dark_mode),
            onPressed: () {
              setState(() {
                _isStageMode = !_isStageMode;
              });
            },
            tooltip: 'Toggle Stage Mode',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.songVersion.notes != null &&
                widget.songVersion.notes!.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _isStageMode
                      ? Colors.grey[850]
                      : AppColors.accentGoldLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _isStageMode
                        ? Colors.grey[700]!
                        : AppColors.accentGold,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: _isStageMode
                          ? Colors.white54
                          : AppColors.accentGold,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.songVersion.notes!,
                        style: TextStyle(
                          color: textColor,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: RichText(
                text: TextSpan(
                  children: (widget.songVersion.chords == null ||
                          widget.songVersion.chords!.isEmpty)
                      ? [
                          TextSpan(
                            text: 'No chords available for this version.',
                            style: TextStyle(
                              fontFamily: 'Courier',
                              fontSize: _fontSize,
                              color: textColor,
                              height: 1.5,
                            ),
                          )
                        ]
                      : ChordTransposer.getTransposedSpans(
                          widget.songVersion.chords!,
                          ChordTransposer.getStepDifference(
                              widget.songVersion.key, _targetKey),
                          TextStyle(
                            fontFamily: 'Courier',
                            fontSize: _fontSize,
                            color: textColor,
                            height: 1.5,
                          ),
                          TextStyle(
                            fontFamily: 'Courier',
                            fontSize: _fontSize,
                            color: AppColors.accentGold,
                            fontWeight: FontWeight.bold,
                            height: 1.5,
                            decoration: TextDecoration.underline,
                          ),
                          _showChordDiagram,
                        ),
                ),
              ),
            ),
            SizedBox(
              height: 100,
            ), // Padding at bottom so user can scroll chords past their thumbs
          ],
        ),
      ),
    );
  }
}
