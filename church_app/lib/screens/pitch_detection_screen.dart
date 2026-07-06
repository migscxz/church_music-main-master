import 'package:flutter/material.dart';
import '../services/pitch_detector_service.dart';
import '../utils/constants.dart';
import '../utils/key_estimator.dart';

class PitchDetectionScreen extends StatefulWidget {
  const PitchDetectionScreen({super.key});

  @override
  _PitchDetectionScreenState createState() => _PitchDetectionScreenState();
}

class _PitchDetectionScreenState extends State<PitchDetectionScreen> {
  final PitchDetectorService _pitchService = PitchDetectorService();
  String _currentNote = '--';
  bool _isListening = false;
  String _errorMessage = '';

  final Map<String, int> _noteHistogram = {};
  List<KeyEstimate> _topEstimates = [];

  @override
  void initState() {
    super.initState();
    _startDetection();
  }

  Future<void> _startDetection() async {
    setState(() {
      _isListening = true;
      _errorMessage = '';
    });
    
    _pitchService.noteStream.listen((note) {
      if (mounted) {
        setState(() {
          _currentNote = note;
          _noteHistogram[note] = (_noteHistogram[note] ?? 0) + 1;
          _topEstimates = KeyEstimator.estimateKeys(_noteHistogram);
        });
      }
    }, onError: (error) {
      if (mounted) {
        setState(() {
          _errorMessage = error.toString();
          _isListening = false;
        });
      }
    });

    try {
      await _pitchService.startListening();
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isListening = false;
        });
      }
    }
  }

  Future<void> _stopDetection() async {
    await _pitchService.stopListening();
    if (mounted) {
      setState(() {
        _isListening = false;
      });
    }
  }

  @override
  void dispose() {
    _pitchService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Pitch Detector'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        iconTheme: const IconThemeData(color: AppColors.textMain),
        centerTitle: true,
        titleTextStyle: const TextStyle(
            color: AppColors.textMain, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cormorant Garamond'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Sing or play an instrument to detect your key.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 40),
              
              // Glowing mic animation container
              GestureDetector(
                onTap: () {
                  if (_isListening) {
                    _stopDetection();
                  } else {
                    _startDetection();
                  }
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: _isListening ? 160 : 140,
                  height: _isListening ? 160 : 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primaryDark,
                    boxShadow: _isListening 
                      ? [
                          BoxShadow(
                            color: AppColors.accentGold.withOpacity(0.4),
                            blurRadius: 40,
                            spreadRadius: 10,
                          )
                        ]
                      : [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 20,
                            spreadRadius: 5,
                          )
                        ],
                    border: Border.all(
                      color: _isListening ? AppColors.accentGold : AppColors.borderLight,
                      width: _isListening ? 3 : 1,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _isListening ? Icons.mic : Icons.mic_none,
                        size: 40,
                        color: _isListening ? AppColors.accentGold : AppColors.textSecondary,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _currentNote,
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: _currentNote != '--'
                              ? AppColors.textMain
                              : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _isListening ? 'Listening...' : 'Tap to start',
                style: TextStyle(
                  color: _isListening ? AppColors.accentGold : AppColors.textSecondary, 
                  fontSize: 13,
                  fontWeight: _isListening ? FontWeight.bold : FontWeight.normal
                ),
              ),
              const SizedBox(height: 24),
              
              if (_errorMessage.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Text(
                    'Error: $_errorMessage',
                    style: TextStyle(color: AppColors.error, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ),
                
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _noteHistogram.clear();
                    _topEstimates.clear();
                    _currentNote = '--';
                  });
                },
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Reset Data'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              
              if (_topEstimates.isNotEmpty) ...[
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Detected Keys',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMain),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.builder(
                    itemCount: _topEstimates.length,
                    itemBuilder: (context, index) {
                      final est = _topEstimates[index];
                      int matchPct = ((est.score * 100).clamp(0, 100)).round();
                      
                      // Highest confidence gets gold highlight
                      final bool isTop = index == 0;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isTop ? AppColors.accentGoldLight : AppColors.primaryDark,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isTop ? AppColors.accentGold : AppColors.borderLight,
                            width: isTop ? 1.5 : 1,
                          )
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                          leading: CircleAvatar(
                            backgroundColor: isTop ? AppColors.accentGold : AppColors.borderLight,
                            radius: 18,
                            child: Icon(Icons.music_note, color: isTop ? AppColors.primaryDark : AppColors.textSecondary, size: 20),
                          ),
                          title: Text(
                            est.keyName,
                            style: TextStyle(
                                color: isTop ? AppColors.accentGold : AppColors.textMain,
                                fontSize: 18,
                                fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            'Confidence: $matchPct%',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ] else ...[
                Expanded(
                  child: Center(
                    child: Text(
                      'Play some notes to see key estimations here.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
