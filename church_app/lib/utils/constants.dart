import 'package:flutter/material.dart';

class AppColors {
  // Brand
  static const Color primaryDark = Color(0xFF0F1117); // Almost Black
  static const Color accentGold = Color(0xFFC9A84C); // Gold
  static const Color accentGoldLight = Color.fromRGBO(201, 168, 76, 0.18);

  // Backgrounds & Surface
  static const Color background = Color(0xFFF9F7F4); // Warm grayish white
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceWarm = Color(0xFFFAF8F5);

  // Text
  static const Color textMain = Color(0xFF1A1814); // Dark Warm Gray
  static const Color textSecondary = Color(0xFF8A8680);
  static const Color textMuted = Color(0xFFB0ABA5);

  // Borders
  static const Color borderLight = Color(0xFFEDE9E4);

  // Functional
  static const Color error = Color(0xFFDC3C3C);
  static const Color success = Color(0xFF0F9D58);
}

class ApiConstants {
  // Use 10.0.2.2 for Android Emulator connecting to localhost
  // Since you are using a physical device (TECNO LJ6), use your local IP:
  static const String baseUrl = 'http://192.168.100.254:8000/api';

  static const String login = '/login';
  static const String user = '/user'; // From sanctum
  static const String setlists = '/setlists';
  static const String songs = '/songs';
  static const String songVersions = '/song-versions';
  static const String songLeaders = '/song-leaders';
}
