import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/api_service.dart';
import '../services/database_helper.dart';

class SyncService {
  final ApiService _apiService = ApiService();

  Future<bool> hasInternet() async {
    var connectivityResult = await (Connectivity().checkConnectivity());
    return connectivityResult != ConnectivityResult.none;
  }

  Future<void> syncEverything() async {
    try {
      if (!await hasInternet()) return;

      final db = DatabaseHelper.instance;
      await db.clearAll();

      // 1. Sync Tags
      final tagsRes = await _apiService.get('/tags');
      if (tagsRes.statusCode == 200) {
        final List<dynamic> data = jsonDecode(tagsRes.body);
        await db.insertTags(data.cast<Map<String, dynamic>>());
      }

      // 2. Sync Leaders
      final leadersRes = await _apiService.get('/song-leaders');
      if (leadersRes.statusCode == 200) {
        final List<dynamic> data = jsonDecode(leadersRes.body);
        await db.insertSongLeaders(data.cast<Map<String, dynamic>>());
      }

      // 3. Sync Master Songs (and their Tags)
      final songsRes = await _apiService.get('/songs');
      if (songsRes.statusCode == 200) {
        final List<dynamic> data = jsonDecode(songsRes.body);
        List<Map<String, dynamic>> songsToInsert = [];
        List<Map<String, dynamic>> songTagsToInsert = [];

        for (var s in data) {
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
        final List<dynamic> data = jsonDecode(versionsRes.body);
        List<Map<String, dynamic>> versionsToInsert = [];

        for (var v in data) {
          versionsToInsert.add({
            'id': v['id'],
            'song_id': v['song_id'],
            'leader_id': v['song_leader_id'] ?? v['leader']?['id'],
            'key': v['key'],
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
        final List<dynamic> data = jsonDecode(setlistsRes.body);

        List<Map<String, dynamic>> setlistsToInsert = [];
        List<Map<String, dynamic>> setlistVersionLinks = [];

        for (var s in data) {
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
    } catch (e) {
      print('Sync everything failed: $e');
    }
  }
}
