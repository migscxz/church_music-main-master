import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  try {
    final versionsRes = await http.get(Uri.parse('http://127.0.0.1:8000/api/song-versions'));
    print('Status: ${versionsRes.statusCode}');
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
    print('Successfully parsed ${versionsToInsert.length} versions');
  } catch (e, stack) {
    print('Error: $e');
    print(stack);
  }
}
