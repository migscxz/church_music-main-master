import 'dart:async';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter_audio_capture/flutter_audio_capture.dart';
import 'package:pitch_detector_dart/pitch_detector.dart';
import 'package:pitch_detector_dart/pitch_detector_result.dart';
import 'package:permission_handler/permission_handler.dart';

class PitchComputePayload {
  final List<double> audioSamples;
  final double sampleRate;
  final int bufferSize;
  
  PitchComputePayload(this.audioSamples, this.sampleRate, this.bufferSize);
}

Future<String?> _processAudioInIsolate(PitchComputePayload payload) async {
  final detector = PitchDetector(audioSampleRate: payload.sampleRate, bufferSize: payload.bufferSize);
  final result = await detector.getPitchFromFloatBuffer(payload.audioSamples);
  
  if (result.pitched && result.probability > 0.8) {
    return PitchDetectorService.getNoteFromFrequency(result.pitch);
  }
  return null;
}

class PitchDetectorService {
  final FlutterAudioCapture _audioCapture = FlutterAudioCapture();
  
  bool _isRecording = false;
  final StreamController<String> _noteStreamController = StreamController<String>.broadcast();
  Stream<String> get noteStream => _noteStreamController.stream;

  Future<bool> requestPermission() async {
    var status = await Permission.microphone.request();
    return status == PermissionStatus.granted;
  }

  Future<void> startListening() async {
    if (_isRecording) return;
    
    bool hasPermission = await requestPermission();
    if (!hasPermission) {
      _noteStreamController.addError("Microphone permission denied");
      return;
    }

    await _audioCapture.init();

    _isRecording = true;
    await _audioCapture.start(
      _audioListener,
      _audioError,
      sampleRate: 44100,
      bufferSize: 2048,
    );
  }

  Future<void> stopListening() async {
    if (!_isRecording) return;
    await _audioCapture.stop();
    _isRecording = false;
  }

  void _audioListener(Float32List obj) async {
    List<double> audioSamples = obj.toList();
    
    final payload = PitchComputePayload(audioSamples, 44100.0, 2048);
    final String? note = await compute(_processAudioInIsolate, payload);
    
    if (note != null && note.isNotEmpty) {
      _noteStreamController.add(note);
    }
  }

  void _audioError(dynamic error) {
    _noteStreamController.addError(error);
    stopListening();
  }

  void dispose() {
    stopListening();
    _noteStreamController.close();
  }

  static String getNoteFromFrequency(double frequency) {
    if (frequency < 50 || frequency > 3000) return ""; 
    
    // A4 is 440 Hz
    double c0 = 440.0 * pow(2.0, -4.75); // ~16.35 Hz
    int halfStepsFromC0 = (12 * log(frequency / c0) / ln2).round();
    
    List<String> notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    if (halfStepsFromC0 < 0) return "";
    
    int noteIndex = halfStepsFromC0 % 12;
    return notes[noteIndex];
  }
}
