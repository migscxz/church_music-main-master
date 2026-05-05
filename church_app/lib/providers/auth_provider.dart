import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  User? _user;
  bool _isLoading = true;
  String? _error;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AuthProvider() {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/auth/user');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _user = User.fromJson(data);
      } else {
        await logout();
      }
    } catch (e) {
      // If fetching fails entirely, could be offline. Don't strictly logout,
      // just assume unauthenticated for now until network returns, or handle offline auth later.
      _error = 'Failed to check authentication status.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(ApiConstants.login, {
        'email': email,
        'password': password,
        'device_name': 'mobile_app',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['access_token'];
        if (token != null) {
          await _apiService.setToken(token);
          await checkAuthStatus();
          return true;
        }
      } else {
        final data = jsonDecode(response.body);
        _error = data['message'] ?? 'Login failed';
      }
    } catch (e) {
      _error = 'Network error. Please try again.';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    try {
      if (isAuthenticated) {
        await _apiService.post('/logout', {});
      }
    } catch (e) {
      // Ignore network errors on logout
    }

    await _apiService.clearToken();
    _user = null;
    notifyListeners();
  }
}
