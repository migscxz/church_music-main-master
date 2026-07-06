import 'package:flutter/material.dart';

class AppColors {
  // Brand
  static const Color primaryDark = Color(0xFF0F1117); // Dark card surface
  static const Color accentGold = Color(0xFFC9A84C); // Gold
  static const Color accentGoldLight = Color.fromRGBO(201, 168, 76, 0.15);

  // Backgrounds & Surface
  static const Color background = Color(0xFF050505); // Deep Black
  static const Color surface = Color(0xFF0F1117);
  static const Color surfaceWarm = Color(0xFF14171F);

  // Text
  static const Color textMain = Color(0xFFE8E4DF); // Off-white
  static const Color textSecondary = Color(0xFF8A8680);
  static const Color textMuted = Color(0xFF6B6862);

  // Borders
  static const Color borderLight = Color(0xFF222530);

  // Functional
  static const Color error = Color(0xFFDC3C3C);
  static const Color success = Color(0xFF0F9D58);
}

class ApiConstants {
  // Use 10.0.2.2 for Android Emulator connecting to localhost
  // Since you are using a physical device (TECNO LJ6), use your local IP:
  static const String baseUrl =
      'https://church-music-main-master-1.onrender.com/api';

  static const String login = '/login';
  static const String user = '/user'; // From sanctum
  static const String setlists = '/setlists';
  static const String songs = '/songs';
  static const String songVersions = '/song-versions';
  static const String songLeaders = '/song-leaders';
}
