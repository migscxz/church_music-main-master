import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('church_music.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 4,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
        CREATE TABLE schedules (
          id INTEGER PRIMARY KEY,
          month_year TEXT NOT NULL,
          weeks_json TEXT
        )
      ''');
    }
    if (oldVersion < 3) {
      await db.execute('ALTER TABLE song_leaders ADD COLUMN user_id INTEGER');
    }
    if (oldVersion < 4) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS setlists (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          date TEXT
        )
      ''');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS setlist_song_version (
          setlist_id INTEGER,
          song_version_id INTEGER,
          PRIMARY KEY (setlist_id, song_version_id),
          FOREIGN KEY (setlist_id) REFERENCES setlists (id),
          FOREIGN KEY (song_version_id) REFERENCES song_versions (id)
        )
      ''');
    }
  }

  Future _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE setlists (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE songs (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        original_key TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE song_leaders (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        user_id INTEGER
      )
    ''');

    await db.execute('''
      CREATE TABLE tags (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE song_versions (
        id INTEGER PRIMARY KEY,
        song_id INTEGER,
        leader_id INTEGER,
        key TEXT NOT NULL,
        chords TEXT,
        tempo TEXT,
        notes TEXT,
        youtube_link TEXT,
        drive_link TEXT,
        chord_reference TEXT,
        FOREIGN KEY (song_id) REFERENCES songs (id),
        FOREIGN KEY (leader_id) REFERENCES song_leaders (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE song_tag (
        song_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (song_id, tag_id),
        FOREIGN KEY (song_id) REFERENCES songs (id),
        FOREIGN KEY (tag_id) REFERENCES tags (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE setlist_song_version (
        setlist_id INTEGER,
        song_version_id INTEGER,
        PRIMARY KEY (setlist_id, song_version_id),
        FOREIGN KEY (setlist_id) REFERENCES setlists (id),
        FOREIGN KEY (song_version_id) REFERENCES song_versions (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE schedules (
        id INTEGER PRIMARY KEY,
        month_year TEXT NOT NULL,
        weeks_json TEXT
      )
    ''');
  }

  Future<void> clearAll() async {
    final db = await instance.database;
    await db.delete('setlist_song_version');
    await db.delete('song_tag');
    await db.delete('song_versions');
    await db.delete('tags');
    await db.delete('song_leaders');
    await db.delete('songs');
    await db.delete('setlists');
    await db.delete('schedules');
  }

  // Batch insert methods
  Future<void> insertSetlists(List<Map<String, dynamic>> items) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('setlists', {
        'id': item['id'],
        'title': item['title'],
        'date': item['date'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertSchedules(List<Map<String, dynamic>> items) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('schedules', {
        'id': item['id'],
        'month_year': item['month_year'],
        'weeks_json': item['weeks_json'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertSongs(List<Map<String, dynamic>> items) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('songs', {
        'id': item['id'],
        'title': item['title'],
        'original_key': item['original_key'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertSongLeaders(List<Map<String, dynamic>> items) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('song_leaders', {
        'id': item['id'],
        'name': item['name'],
        'user_id': item['user_id'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertTags(List<Map<String, dynamic>> items) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('tags', {
        'id': item['id'],
        'name': item['name'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertSongVersions(List<Map<String, dynamic>> items) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('song_versions', {
        'id': item['id'],
        'song_id': item['song_id'],
        'leader_id': item['leader_id'],
        'key': item['key'],
        'chords': item['chords'],
        'tempo': item['tempo'],
        'notes': item['notes'],
        'youtube_link': item['youtube_link'],
        'drive_link': item['drive_link'],
        'chord_reference': item['chord_reference'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertSongTags(List<Map<String, dynamic>> items) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('song_tag', {
        'song_id': item['song_id'],
        'tag_id': item['tag_id'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> insertSetlistSongVersions(
    List<Map<String, dynamic>> items,
  ) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var item in items) {
      batch.insert('setlist_song_version', {
        'setlist_id': item['setlist_id'],
        'song_version_id': item['song_version_id'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // Fetching methods
  Future<List<Map<String, dynamic>>> getSetlists() async {
    final db = await instance.database;
    // We'll need to join with song_versions for the full UI
    final result = await db.query('setlists', orderBy: 'date DESC');
    return result;
  }

  Future<List<Map<String, dynamic>>> getSchedules() async {
    final db = await instance.database;
    return await db.query('schedules', orderBy: 'month_year DESC');
  }

  Future<List<Map<String, dynamic>>> getSetlistVersions(int setlistId) async {
    final db = await instance.database;
    return await db.rawQuery(
      '''
      SELECT sv.*, s.title as song_title, s.original_key as song_original_key, sl.name as leader_name, sl.user_id as leader_user_id
      FROM song_versions sv
      JOIN setlist_song_version ssv ON sv.id = ssv.song_version_id
      JOIN songs s ON sv.song_id = s.id
      LEFT JOIN song_leaders sl ON sv.leader_id = sl.id
      WHERE ssv.setlist_id = ?
    ''',
      [setlistId],
    );
  }

  Future<List<Map<String, dynamic>>> getAllSongVersions() async {
    final db = await instance.database;
    return await db.rawQuery('''
      SELECT sv.*, s.title as song_title, s.original_key as song_original_key, sl.name as leader_name, sl.user_id as leader_user_id
      FROM song_versions sv
      JOIN songs s ON sv.song_id = s.id
      LEFT JOIN song_leaders sl ON sv.leader_id = sl.id
    ''');
  }

  Future<List<Map<String, dynamic>>> getAllSongTagsAll() async {
    final db = await instance.database;
    return await db.rawQuery('''
      SELECT st.song_id, t.* FROM tags t
      JOIN song_tag st ON t.id = st.tag_id
    ''');
  }

  Future<List<Map<String, dynamic>>> getAllSetlistVersionsAll() async {
    final db = await instance.database;
    return await db.rawQuery('''
      SELECT ssv.setlist_id, sv.*, s.title as song_title, s.original_key as song_original_key, sl.name as leader_name, sl.user_id as leader_user_id
      FROM song_versions sv
      JOIN setlist_song_version ssv ON sv.id = ssv.song_version_id
      JOIN songs s ON sv.song_id = s.id
      LEFT JOIN song_leaders sl ON sv.leader_id = sl.id
    ''');
  }

  Future<List<Map<String, dynamic>>> getSongTags(int songId) async {
    final db = await instance.database;
    return await db.rawQuery(
      '''
      SELECT t.* FROM tags t
      JOIN song_tag st ON t.id = st.tag_id
      WHERE st.song_id = ?
    ''',
      [songId],
    );
  }

  Future<List<Map<String, dynamic>>> getAllSongs() async {
    final db = await instance.database;
    return await db.query('songs', orderBy: 'title ASC');
  }

  Future<List<Map<String, dynamic>>> getSongVersions(int songId) async {
    final db = await instance.database;
    return await db.rawQuery(
      '''
      SELECT sv.*, sl.name as leader_name, sl.user_id as leader_user_id
      FROM song_versions sv
      LEFT JOIN song_leaders sl ON sv.leader_id = sl.id
      WHERE sv.song_id = ?
    ''',
      [songId],
    );
  }

  Future<List<Map<String, dynamic>>> getAllTags() async {
    final db = await instance.database;
    return await db.query('tags', orderBy: 'name ASC');
  }

  Future<List<Map<String, dynamic>>> getAllLeaders() async {
    final db = await instance.database;
    return await db.query('song_leaders', orderBy: 'name ASC');
  }
}
