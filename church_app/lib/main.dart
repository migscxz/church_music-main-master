import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => AuthProvider())],
      child: const ChurchMusicApp(),
    ),
  );
}

class ChurchMusicApp extends StatelessWidget {
  const ChurchMusicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Church Music',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'DM Sans',
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF050505),
        primaryColor: const Color(0xFF0F1117),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFC9A84C),
          surface: Color(0xFF0F1117),
        ),
      ),
      home: _AuthWrapper(),
      routes: {
        '/login': (context) => LoginScreen(),
        '/home': (context) => const MainScreen(),
      },
    );
  }
}

class _AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFFC9A84C)),
            ),
          );
        }

        if (auth.isAuthenticated) {
          return const MainScreen();
        } else {
          return LoginScreen();
        }
      },
    );
  }
}
