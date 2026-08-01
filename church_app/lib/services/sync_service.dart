import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/api_service.dart';
import '../services/database_helper.dart';

List<dynamic> _decodeList(String body) {
  return jsonDecode(body) as List<dynamic>;
}

class SyncService {
  static final ValueNotifier<int> onSyncComplete = ValueNotifier(0);
  final ApiService _apiService = ApiService();

  Future<bool> hasInternet() async {
    var connectivityResult = await (Connectivity().checkConnectivity());
    return !connectivityResult.contains(ConnectivityResult.none) && connectivityResult.isNotEmpty;
  }

  Future<void> syncEverything() async {
    try {
      if (!await hasInternet()) return;

      // 1. Fetch ALL data from APIs FIRST
      final futures = await Future.wait([
        _apiService.get('/tags'),
        _apiService.get('/song-leaders'),
        _apiService.get('/songs'),
        _apiService.get('/song-versions'),
        _apiService.get('/setlists'),
        _apiService.get('/schedules'),
      ]);

      final tagsRes = futures[0];
      final leadersRes = futures[1];
      final songsRes = futures[2];
      final versionsRes = futures[3];
      final setlistsRes = futures[4];
      final schedulesRes = futures[5];

      // If any request failed, abort sync to prevent data corruption/loss
      if (tagsRes.statusCode != 200 || leadersRes.statusCode != 200 || songsRes.statusCode != 200 || 
          versionsRes.statusCode != 200 || setlistsRes.statusCode != 200 || schedulesRes.statusCode != 200) {
        throw Exception("One or more API requests failed. Sync aborted.");
      }

      // 2. Process data in memory
      final tagsData = await compute(_decodeList, tagsRes.body);
      final cleanTags = tagsData.where((e) => e != null).cast<Map<String, dynamic>>().toList();

      final leadersData = await compute(_decodeList, leadersRes.body);
      final cleanLeaders = leadersData.where((e) => e != null).cast<Map<String, dynamic>>().toList();

      final songsData = await compute(_decodeList, songsRes.body);
      List<Map<String, dynamic>> songsToInsert = [];
      List<Map<String, dynamic>> songTagsToInsert = [];
      for (var s in songsData) {
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

      final versionsData = await compute(_decodeList, versionsRes.body);
      List<Map<String, dynamic>> versionsToInsert = [];
      for (var v in versionsData) {
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

      final setlistsData = await compute(_decodeList, setlistsRes.body);
      List<Map<String, dynamic>> setlistsToInsert = [];
      List<Map<String, dynamic>> setlistVersionLinks = [];
      for (var s in setlistsData) {
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

      final schedulesData = await compute(_decodeList, schedulesRes.body);
      List<Map<String, dynamic>> schedulesToInsert = [];
      for (var s in schedulesData) {
        if (s == null) continue;
        schedulesToInsert.add({
          'id': s['id'],
          'month_year': s['month_year'],
          'weeks_json': jsonEncode(s['weeks'] ?? []),
        });
      }

      // 3. ONLY CLEAR DB IF ALL FETCHING AND PARSING SUCCEEDED
      final db = DatabaseHelper.instance;
      await db.clearAll();

      // 4. Batch Insert Everything
      await db.insertTags(cleanTags);
      await db.insertSongLeaders(cleanLeaders);
      await db.insertSongs(songsToInsert);
      await db.insertSongTags(songTagsToInsert);
      await db.insertSongVersions(versionsToInsert);
      await db.insertSetlists(setlistsToInsert);
      await db.insertSetlistSongVersions(setlistVersionLinks);
      await db.insertSchedules(schedulesToInsert);

      // Notify listeners that sync is complete
      onSyncComplete.value++;

    } catch (e) {
      print('Sync everything failed: $e');
    }
  }
}
