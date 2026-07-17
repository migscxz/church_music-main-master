import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/database_helper.dart';
import '../services/sync_service.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import '../models/models.dart';
import 'chord_viewer_screen.dart';
import 'create_song_screen.dart';

class SongsDatabaseScreen extends StatefulWidget {
  const SongsDatabaseScreen({super.key});

  @override
  _SongsDatabaseScreenState createState() => _SongsDatabaseScreenState();
}

class _SongsDatabaseScreenState extends State<SongsDatabaseScreen> {
  List<Song> _songs = [];
  Map<int, List<SongVersion>> _songToVersions = {};
  List<Tag> _tags = [];
  List<SongLeader> _leaders = [];

  // Filter Options Extracted from Data
  List<String> _uniqueLeaders = ['All Leaders'];
  List<String> _uniqueCategories = ['All Categories'];

  // Current State
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedLeader = 'All Leaders';
  String _selectedCategory = 'All Categories';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final db = DatabaseHelper.instance;

    // 1. Fetch Tags
    final rawTags = await db.getAllTags();
    _tags = rawTags.map((t) => Tag.fromJson(t)).toList();
    _uniqueCategories = ['All Categories', ..._tags.map((t) => t.name)];

    // 2. Fetch Leaders
    final rawLeaders = await db.getAllLeaders();
    _leaders = rawLeaders.map((l) => SongLeader.fromJson(l)).toList();
    _uniqueLeaders = ['All Leaders', ..._leaders.map((l) => l.name)];

    // 3. Fetch All Songs, Tags, and Versions
    final rawSongs = await db.getAllSongs();
    final allSongTags = await db.getAllSongTagsAll();
    final allSongVersions = await db.getAllSongVersions();

    // Group tags by songId
    Map<int, List<Tag>> songTagsMap = {};
    for (var st in allSongTags) {
      final int songId = st['song_id'];
      songTagsMap.putIfAbsent(songId, () => []);
      songTagsMap[songId]!.add(Tag.fromJson(st));
    }

    // Group versions by songId
    Map<int, List<Map<String, dynamic>>> songVersionsMap = {};
    for (var sv in allSongVersions) {
      final int songId = sv['song_id'];
      songVersionsMap.putIfAbsent(songId, () => []);
      songVersionsMap[songId]!.add(sv);
    }

    List<Song> loadedSongs = [];
    Map<int, List<SongVersion>> loadedVersionMap = {};

    for (var s in rawSongs) {
      final int songId = s['id'];

      final tags = songTagsMap[songId] ?? [];

      final song = Song(
        id: songId,
        title: s['title'],
        originalKey: s['original_key'],
        tags: tags,
      );
      loadedSongs.add(song);

      final versionMaps = songVersionsMap[songId] ?? [];
      loadedVersionMap[songId] = versionMaps
          .map(
            (v) => SongVersion(
              id: v['id'],
              key: v['key'],
              chords: v['chords'],
              tempo: v['tempo'],
              notes: v['notes'],
              youtubeLink: v['youtube_link'],
              driveLink: v['drive_link'],
              chordReference: v['chord_reference'],
              song: song,
              leader: v['leader_id'] != null
                  ? SongLeader(id: v['leader_id'], name: v['leader_name'] ?? 'Unknown', userId: v['leader_user_id'])
                  : null,
            ),
          )
          .toList();
    }

    if (mounted) {
      setState(() {
        _songs = loadedSongs;
        _songToVersions = loadedVersionMap;
        _isLoading = false;
      });
    }
  }

  List<Song> get _filteredSongs {
    return _songs.where((s) {
      // 1. Search Query
      final title = s.title.toLowerCase();
      final searchFilter =
          _searchQuery.isEmpty || title.contains(_searchQuery.toLowerCase());

      // 2. Leader Filter
      bool leaderFilter = _selectedLeader == 'All Leaders';
      if (!leaderFilter) {
        leaderFilter =
            _songToVersions[s.id]?.any(
              (v) => v.leader?.name == _selectedLeader,
            ) ??
            false;
      }

      // 3. Category Filter
      bool categoryFilter = _selectedCategory == 'All Categories';
      if (!categoryFilter) {
        categoryFilter = s.tags.any((tag) => tag.name == _selectedCategory);
      }

      return searchFilter && leaderFilter && categoryFilter;
    }).toList();
  }

  void _onSongTap(Song song) {
    final versions = _songToVersions[song.id] ?? [];

    if (_selectedLeader != 'All Leaders') {
      // Go directly to the selected leader's version
      final version = versions.firstWhere(
        (v) => v.leader?.name == _selectedLeader,
      );
      _navigateToViewer(version);
    } else {
      if (versions.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No chords available for this song yet.')),
        );
      } else if (versions.length == 1) {
        _navigateToViewer(versions.first);
      } else {
        _showVersionPicker(song, versions);
      }
    }
  }

  Future<void> _addToMySongs(Song song, SongLeader myLeaderProfile) async {
    setState(() => _isLoading = true);
    try {
      final payload = {
        'song_id': song.id,
        'song_leader_id': myLeaderProfile.id,
        'key': 'Unknown',
        'chords': null,
        'tempo': null,
        'youtube_link': null,
        'drive_link': null,
        'chord_reference': null,
        'notes': null,
      };

      final response = await ApiService().post('/song-versions', payload);
      if (response.statusCode == 201) {
        await SyncService().syncEverything();
        await _fetchData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${song.title} added to your list!')),
          );
        }
      } else {
        throw Exception('Failed to add song');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding song: ${e.toString()}')),
        );
      }
    }
  }

  void _showVersionPicker(Song song, List<SongVersion> versions) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Text(
                  'Select Version for ${song.title}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cormorant Garamond',
                    color: AppColors.textMain,
                  ),
                ),
              ),
              Divider(height: 1),
              ...versions.map(
                (v) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.accentGoldLight,
                    child: Icon(
                      Icons.person,
                      color: AppColors.accentGold,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    v.leader?.name ?? 'Unknown Leader',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text('Key: ${v.key}'),
                  trailing: Icon(
                    Icons.chevron_right,
                    color: AppColors.textMuted,
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _navigateToViewer(v);
                  },
                ),
              ),
              SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  void _navigateToViewer(SongVersion version) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChordViewerScreen(
          songVersion: version,
          listContext: 'Songs Database',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Songs Database',
          style: TextStyle(
            color: AppColors.textMain,
            fontFamily: 'Cormorant Garamond',
            fontWeight: FontWeight.bold,
            fontSize: 24,
          ),
        ),
        backgroundColor: AppColors.surface,
        elevation: 0,
        automaticallyImplyLeading: false,
        iconTheme: IconThemeData(color: AppColors.textMain),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(110),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search songs or leaders...',
                    prefixIcon: Icon(Icons.search, color: AppColors.textMuted),
                    filled: true,
                    fillColor: AppColors.surfaceWarm,
                    contentPadding: EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppColors.borderLight),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppColors.borderLight),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppColors.accentGold),
                    ),
                  ),
                  onChanged: (val) {
                    setState(() => _searchQuery = val);
                  },
                ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceWarm,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.borderLight),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _uniqueLeaders.contains(_selectedLeader)
                                ? _selectedLeader
                                : 'All Leaders',
                            isExpanded: true,
                            icon: Icon(
                              Icons.arrow_drop_down,
                              color: AppColors.accentGold,
                            ),
                            style: TextStyle(
                              color: AppColors.textMain,
                              fontSize: 13,
                            ),
                            onChanged: (String? newValue) {
                              if (newValue != null) {
                                setState(() => _selectedLeader = newValue);
                              }
                            },
                            items: _uniqueLeaders.map<DropdownMenuItem<String>>(
                              (String value) {
                                return DropdownMenuItem<String>(
                                  value: value,
                                  child: Text(
                                    value,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              },
                            ).toList(),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceWarm,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.borderLight),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _uniqueCategories.contains(_selectedCategory)
                                ? _selectedCategory
                                : 'All Categories',
                            isExpanded: true,
                            icon: Icon(
                              Icons.arrow_drop_down,
                              color: AppColors.accentGold,
                            ),
                            style: TextStyle(
                              color: AppColors.textMain,
                              fontSize: 13,
                            ),
                            onChanged: (String? newValue) {
                              if (newValue != null) {
                                setState(() => _selectedCategory = newValue);
                              }
                            },
                            items: _uniqueCategories
                                .map<DropdownMenuItem<String>>((String value) {
                                  return DropdownMenuItem<String>(
                                    value: value,
                                    child: Text(
                                      value,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                })
                                .toList(),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(color: AppColors.accentGold),
            )
          : RefreshIndicator(
              color: AppColors.accentGold,
              onRefresh: () async {
                setState(() => _isLoading = true);
                await SyncService().syncEverything();
                await _fetchData();
              },
              child: ListView.builder(
                padding: EdgeInsets.all(16),
                itemCount: _filteredSongs.length,
                itemBuilder: (context, index) {
                final song = _filteredSongs[index];
                final versions = _songToVersions[song.id] ?? [];

                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                final user = authProvider.user;
                final isAdminOrPianist = user?.role == 'admin' || user?.role == 'pianist';

                SongLeader? myLeaderProfile;
                if (!isAdminOrPianist && user != null) {
                  try {
                    myLeaderProfile = _leaders.firstWhere((l) => l.userId == user.id);
                  } catch (e) {
                    // Leader profile not found
                  }
                }

                final myVersion = myLeaderProfile != null 
                    ? versions.firstWhere((v) => v.leader?.id == myLeaderProfile!.id, orElse: () => SongVersion(id: -1, key: '')) 
                    : null;
                final hasMyVersion = myVersion != null && myVersion.id != -1;

                String subtitle = 'Original Key: ${song.originalKey ?? "N/A"}';
                if (_selectedLeader != 'All Leaders') {
                  final v = versions.firstWhere(
                    (v) => v.leader?.name == _selectedLeader,
                  );
                  subtitle = 'Key: ${v.key} • Tempo: ${v.tempo ?? "Normal"}';
                } else if (versions.isNotEmpty) {
                  subtitle =
                      '${versions.length} version${versions.length > 1 ? "s" : ""} available';
                }

                return Card(
                  color: AppColors.surfaceWarm,
                  elevation: 0,
                  margin: EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: AppColors.borderLight, width: 1.5),
                  ),
                  child: ListTile(
                    title: Text(
                      song.title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMain,
                      ),
                    ),
                    subtitle: Text(
                      subtitle,
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                    trailing: (!isAdminOrPianist && myLeaderProfile != null && !hasMyVersion)
                        ? IconButton(
                            icon: Icon(Icons.add_circle_outline, color: AppColors.accentGold),
                            onPressed: () => _addToMySongs(song, myLeaderProfile!),
                            tooltip: 'Add to My Songs',
                          )
                        : Icon(
                            versions.isEmpty ? Icons.music_off : Icons.music_note,
                            color: versions.isEmpty
                                ? AppColors.textMuted
                                : AppColors.accentGold,
                          ),
                    onTap: () {
                      if (!isAdminOrPianist && myLeaderProfile != null && !hasMyVersion) {
                        _addToMySongs(song, myLeaderProfile!);
                      } else {
                        _onSongTap(song);
                      }
                    },
                  ),
                );
              },
            ),
          ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 90.0),
        child: FloatingActionButton(
          backgroundColor: AppColors.accentGold,
          tooltip: 'Add New Song',
          onPressed: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => CreateSongScreen()),
            );
            if (result == true) {
              setState(() => _isLoading = true);
              await SyncService().syncEverything();
              _fetchData(); // Refresh list from local DB after sync
            }
          },
          child: Icon(Icons.add, color: AppColors.primaryDark),
        ),
      ),
    );
  }
}
