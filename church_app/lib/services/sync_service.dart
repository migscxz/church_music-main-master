import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/api_service.dart';
import '../services/database_helper.dart';

List<dynamic> _decodeList(String body) {
  return jsonDecode(body) as List<dynamic>;
}

class SyncService {
  final ApiService _apiService = ApiService();

  Future<bool> hasInternet() async {
    var connectivityResult = await (Connectivity().checkConnectivity());
    return !connectivityResult.contains(ConnectivityResult.none) && connectivityResult.isNotEmpty;
  }

  Future<void> syncEverything() async {
    try {
      if (!await hasInternet()) return;

      final db = DatabaseHelper.instance;
      await db.clearAll();

      // 1. Sync Tags
      final tagsRes = await _apiService.get('/tags');
      if (tagsRes.statusCode == 200) {
        final List<dynamic> data = await compute(_decodeList, tagsRes.body);
        final cleanData = data.where((e) => e != null).cast<Map<String, dynamic>>().toList();
        await db.insertTags(cleanData);
      }

      // 2. Sync Leaders
      final leadersRes = await _apiService.get('/song-leaders');
      if (leadersRes.statusCode == 200) {
        final List<dynamic> data = await compute(_decodeList, leadersRes.body);
        final cleanData = data.where((e) => e != null).cast<Map<String, dynamic>>().toList();
        await db.insertSongLeaders(cleanData);
      }

      // 3. Sync Master Songs (and their Tags)
      final songsRes = await _apiService.get('/songs');
      if (songsRes.statusCode == 200) {
        final List<dynamic> data = await compute(_decodeList, songsRes.body);
        List<Map<String, dynamic>> songsToInsert = [];
        List<Map<String, dynamic>> songTagsToInsert = [];

        for (var s in data) {
          if (s == null) continue;
          songsToInsert.add({
            'id': s['id'],
            'title': s['title'],
            'original_key': s['original_key'],
          });

          if (s['tags'] != null) {
            for (var t in s['tags']) {
              songTagsToInsert.add({'song_id': s['id'], 'tag_id': t['id']});
            }
          }
        }
        await db.insertSongs(songsToInsert);
        await db.insertSongTags(songTagsToInsert);
      }

      // 4. Sync Song Versions
      final versionsRes = await _apiService.get('/song-versions');
      if (versionsRes.statusCode == 200) {
        final List<dynamic> data = await compute(_decodeList, versionsRes.body);
        List<Map<String, dynamic>> versionsToInsert = [];

        for (var v in data) {
          if (v == null) continue;
          versionsToInsert.add({
            'id': v['id'],
            'song_id': v['song_id'],
            'leader_id': v['song_leader_id'] ?? v['leader']?['id'],
            'key': v['key'] ?? '',
            'chords': v['chords'],
            'tempo': v['tempo'],
            'notes': v['notes'],
            'youtube_link': v['youtube_link'],
            'drive_link': v['drive_link'],
            'chord_reference': v['chord_reference'],
          });
        }
        await db.insertSongVersions(versionsToInsert);
      }

      // 5. Sync Setlists (and SetlistSongVersions)
      final setlistsRes = await _apiService.get('/setlists');
      if (setlistsRes.statusCode == 200) {
        final List<dynamic> data = await compute(_decodeList, setlistsRes.body);

        List<Map<String, dynamic>> setlistsToInsert = [];
        List<Map<String, dynamic>> setlistVersionLinks = [];

        for (var s in data) {
          if (s == null) continue;
          setlistsToInsert.add({
            'id': s['id'],
            'title': s['title'],
            'date': s['date'],
          });

          var versions = s['song_versions'] ?? s['songVersions'] ?? [];
          for (var v in versions) {
            setlistVersionLinks.add({
              'setlist_id': s['id'],
              'song_version_id': v['id'],
            });
          }
        }

        await db.insertSetlists(setlistsToInsert);
        await db.insertSetlistSongVersions(setlistVersionLinks);
      }

      // 6. Sync Schedules
      final schedulesRes = await _apiService.get('/schedules');
      if (schedulesRes.statusCode == 200) {
        final List<dynamic> data = await compute(_decodeList, schedulesRes.body);
        List<Map<String, dynamic>> schedulesToInsert = [];

        for (var s in data) {
          if (s == null) continue;
          schedulesToInsert.add({
            'id': s['id'],
            'month_year': s['month_year'],
            'weeks_json': jsonEncode(s['weeks'] ?? []),
          });
        }
        await db.insertSchedules(schedulesToInsert);
      }
    } catch (e) {
      print('Sync everything failed: $e');
    }
  }
}
