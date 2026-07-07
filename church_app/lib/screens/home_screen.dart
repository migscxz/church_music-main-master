import 'package:flutter/material.dart';

import '../services/database_helper.dart';
import '../services/sync_service.dart';
import '../utils/constants.dart';
import '../models/models.dart';
import 'chord_viewer_screen.dart';
import '../widgets/app_drawer.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final SyncService _syncService = SyncService();
  List<Setlist> _setlists = [];
  Setlist? _selectedSetlist;
  bool _isLoading = true;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadOfflineData();
  }

  Future<void> _loadOfflineData() async {
    final rawSetlists = await DatabaseHelper.instance.getSetlists();
    List<Setlist> loadedSetlists = [];

    for (var row in rawSetlists) {
      final int id = row['id'] as int;
      final rawVersions = await DatabaseHelper.instance.getSetlistVersions(id);

      final versions = rawVersions
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
              song: Song(
                id: v['song_id'],
                title: v['song_title'],
                originalKey: v['song_original_key'],
              ),
              leader: v['leader_id'] != null
                  ? SongLeader(id: v['leader_id'], name: v['leader_name'] ?? 'Unknown')
                  : null,
            ),
          )
          .toList();

      loadedSetlists.add(
        Setlist(
          id: id,
          title: row['title'] as String,
          date: row['date'] as String?,
          songVersions: versions,
        ),
      );
    }

    setState(() {
      _setlists = loadedSetlists;
      _isLoading = false;

      // Auto-select the first setlist if available
      if (_setlists.isNotEmpty && _selectedSetlist == null) {
        _selectedSetlist = _setlists.first;
      }
    });

    _triggerBackgroundSync();
  }

  Future<void> _triggerBackgroundSync() async {
    setState(() => _isSyncing = true);
    await _syncService.syncEverything();

    final rawSetlists = await DatabaseHelper.instance.getSetlists();
    List<Setlist> loadedSetlists = [];

    for (var row in rawSetlists) {
      final int id = row['id'] as int;
      final rawVersions = await DatabaseHelper.instance.getSetlistVersions(id);

      final versions = rawVersions
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
              song: Song(
                id: v['song_id'],
                title: v['song_title'],
                originalKey: v['song_original_key'],
              ),
              leader: v['leader_id'] != null
                  ? SongLeader(id: v['leader_id'], name: v['leader_name'] ?? 'Unknown')
                  : null,
            ),
          )
          .toList();

      loadedSetlists.add(
        Setlist(
          id: id,
          title: row['title'] as String,
          date: row['date'] as String?,
          songVersions: versions,
        ),
      );
    }

    if (mounted) {
      setState(() {
        _setlists = loadedSetlists;
        _isSyncing = false;

        // Re-assign selected setlist to hydrated version
        if (_selectedSetlist != null) {
          try {
            _selectedSetlist = _setlists.firstWhere(
              (s) => s.id == _selectedSetlist!.id,
            );
          } catch (e) {
            _selectedSetlist = _setlists.isNotEmpty ? _setlists.first : null;
          }
        } else if (_setlists.isNotEmpty) {
          _selectedSetlist = _setlists.first;
        }
      });
    }
  }

  Widget _buildSetlistsAccordion() {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(color: AppColors.accentGold),
      );
    }
    if (_setlists.isEmpty) {
      return Center(
        child: Text(
          'No setlists cached on device.\nConnect to Wi-Fi to sync.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.accentGold,
      onRefresh: _triggerBackgroundSync,
      child: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: _setlists.length,
        itemBuilder: (context, setlistIndex) {
          final setlist = _setlists[setlistIndex];
          return Card(
            color: AppColors.surface,
            elevation: 0,
            margin: EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: AppColors.borderLight, width: 1.5),
            ),
            child: ExpansionTile(
              collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              backgroundColor: AppColors.surfaceWarm,
              title: Text(
                setlist.title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AppColors.textMain,
                  fontFamily: 'Cormorant Garamond',
                ),
              ),
              subtitle: Text(
                setlist.date ?? 'No date',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              children: [
                if (setlist.songVersions.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      'This setlist has no songs yet.',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  )
                else
                  ...setlist.songVersions.asMap().entries.map((entry) {
                    final index = entry.key;
                    final version = entry.value;
                    return Container(
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppColors.borderLight),
                        ),
                      ),
                      child: ListTile(
                        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        leading: CircleAvatar(
                          backgroundColor: AppColors.accentGoldLight,
                          radius: 16,
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              color: AppColors.accentGold,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        title: Text(
                          version.song?.title ?? 'Unknown Title',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: AppColors.textMain,
                          ),
                        ),
                        subtitle: Text(
                          'Key: ${version.key} • Leader: ${version.leader?.name ?? "System"}',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        ),
                        trailing: Icon(Icons.music_note, color: AppColors.textMuted, size: 20),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChordViewerScreen(
                                songVersion: version,
                                listContext: setlist.title,
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  }).toList(),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Church Music',
          style: TextStyle(
            color: AppColors.textMain,
            fontFamily: 'Cormorant Garamond',
            fontWeight: FontWeight.bold,
            fontSize: 24,
          ),
        ),
        backgroundColor: AppColors.surface,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.textMain),
        actions: [
          if (_isSyncing)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    color: AppColors.accentGold,
                    strokeWidth: 2,
                  ),
                ),
              ),
            ),
        ],
      ),
      drawer: AppDrawer(
        setlists: _setlists, // keeping for signature compatibility if needed
        selectedSetlist: _selectedSetlist,
        onSetlistSelected: (Setlist setlist) {},
      ),
      body: _buildSetlistsAccordion(),
    );
  }
}
