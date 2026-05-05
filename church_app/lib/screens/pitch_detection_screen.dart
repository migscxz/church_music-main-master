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
        title: const Text('Sing to Detect Key'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textMain),
        titleTextStyle: const TextStyle(
            color: AppColors.textMain, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Play or sing to build key profile:',
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _currentNote != '--'
                      ? AppColors.accentGold.withOpacity(0.2)
                      : Colors.grey.withOpacity(0.1),
                  border: Border.all(
                    color: _currentNote != '--'
                        ? AppColors.accentGold
                        : Colors.grey,
                    width: 4,
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  _currentNote,
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: _currentNote != '--'
                        ? AppColors.accentGold
                        : AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Live note',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 24),
              if (_errorMessage.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Text(
                    'Error: $_errorMessage\n(You likely need to fully restart the app via the terminal to load the new microphone plugin!)',
                    style: TextStyle(color: Colors.red, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton.icon(
                    onPressed: () {
                      if (_isListening) {
                        _stopDetection();
                      } else {
                        _startDetection();
                      }
                    },
                    icon: Icon(_isListening ? Icons.pause : Icons.play_arrow),
                    label: Text(_isListening ? 'Stop Listening' : 'Start Listening'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.textMain,
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
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reset'),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.grey,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              if (_topEstimates.isNotEmpty) ...[
                Text(
                  'Top Estimations',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMain),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.builder(
                    itemCount: _topEstimates.length,
                    itemBuilder: (context, index) {
                      final est = _topEstimates[index];
                      // Rough match percentage to show confidence simply (clamp 0-100)
                      int matchPct = ((est.score * 100).clamp(0, 100)).round();

                      return Card(
                        color: AppColors.surface,
                        child: ListTile(
                          title: Text(
                            est.keyName,
                            style: TextStyle(
                                color: AppColors.textMain,
                                fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            'Confidence Score: ~$matchPct',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                          trailing: ElevatedButton(
                            onPressed: () {
                              _stopDetection();
                              Navigator.pop(context, est.rootNote);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accentGold,
                              foregroundColor: Colors.white,
                            ),
                            child: const Text('Use Key'),
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
                      'Waiting for notes...',
                      style: TextStyle(color: AppColors.textSecondary),
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
