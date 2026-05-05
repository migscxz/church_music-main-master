class SongLeader {
  final int id;
  final String name;

  SongLeader({required this.id, required this.name});

  factory SongLeader.fromJson(Map<String, dynamic> json) {
    return SongLeader(id: json['id'], name: json['name']);
  }

  Map<String, dynamic> toMap() {
    return {'id': id, 'name': name};
  }
}

class Tag {
  final int id;
  final String name;

  Tag({required this.id, required this.name});

  factory Tag.fromJson(Map<String, dynamic> json) {
    return Tag(id: json['id'], name: json['name']);
  }
}

class Song {
  final int id;
  final String title;
  final String? originalKey;
  final List<Tag> tags;

  Song({
    required this.id,
    required this.title,
    this.originalKey,
    this.tags = const [],
  });

  factory Song.fromJson(Map<String, dynamic> json) {
    var tagsList = json['tags'] as List? ?? [];
    List<Tag> parsedTags = tagsList.map((t) => Tag.fromJson(t)).toList();

    return Song(
      id: json['id'],
      title: json['title'],
      originalKey: json['original_key'],
      tags: parsedTags,
    );
  }

  Map<String, dynamic> toMap() {
    return {'id': id, 'title': title, 'original_key': originalKey};
  }
}

class SongVersion {
  final int id;
  final String key;
  final String? chords;
  final String? tempo;
  final String? notes;
  final String? youtubeLink;
  final String? driveLink;
  final String? chordReference;

  final Song? song;
  final SongLeader? leader;

  SongVersion({
    required this.id,
    required this.key,
    this.chords,
    this.tempo,
    this.notes,
    this.youtubeLink,
    this.driveLink,
    this.chordReference,
    this.song,
    this.leader,
  });

  factory SongVersion.fromJson(Map<String, dynamic> json) {
    return SongVersion(
      id: json['id'],
      key: json['key'],
      chords: json['chords'],
      tempo: json['tempo'],
      notes: json['notes'],
      youtubeLink: json['youtube_link'],
      driveLink: json['drive_link'],
      chordReference: json['chord_reference'],
      song: json['song'] != null ? Song.fromJson(json['song']) : null,
      leader: json['leader'] != null
          ? SongLeader.fromJson(json['leader'])
          : null,
    );
  }
}

class Setlist {
  final int id;
  final String title;
  final String? date;
  final List<SongVersion> songVersions;

  Setlist({
    required this.id,
    required this.title,
    this.date,
    this.songVersions = const [],
  });

  factory Setlist.fromJson(Map<String, dynamic> json) {
    var list =
        json['song_versions'] as List? ?? json['songVersions'] as List? ?? [];
    List<SongVersion> versions = list
        .map((i) => SongVersion.fromJson(i))
        .toList();

    return Setlist(
      id: json['id'],
      title: json['title'],
      date: json['date'],
      songVersions: versions,
    );
  }

  Map<String, dynamic> toMap() {
    return {'id': id, 'title': title, 'date': date};
  }
}
