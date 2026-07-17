import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/database_helper.dart';
import '../services/sync_service.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import '../models/models.dart';
import 'chord_viewer_screen.dart';
import 'create_setlist_screen.dart';
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

  Future<List<Setlist>> _getGroupedSetlists() async {
    final rawSetlists = await DatabaseHelper.instance.getSetlists();
    final allSetlistVersions = await DatabaseHelper.instance.getAllSetlistVersionsAll();

    Map<int, List<Map<String, dynamic>>> setlistVersionsMap = {};
    for (var sv in allSetlistVersions) {
      final int setlistId = sv['setlist_id'];
      setlistVersionsMap.putIfAbsent(setlistId, () => []);
      setlistVersionsMap[setlistId]!.add(sv);
    }

    List<Setlist> loadedSetlists = [];
    for (var row in rawSetlists) {
      final int id = row['id'] as int;
      final rawVersions = setlistVersionsMap[id] ?? [];

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
    return loadedSetlists;
  }

  Future<void> _loadOfflineData() async {
    final loadedSetlists = await _getGroupedSetlists();

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

    final loadedSetlists = await _getGroupedSetlists();

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

  Future<void> _deleteSetlist(int setlistId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surfaceWarm,
        title: Text('Delete Setlist?', style: TextStyle(color: AppColors.textMain)),
        content: Text('Are you sure you want to delete this setlist? This cannot be undone.', style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSyncing = true);
    try {
      final response = await ApiService().delete('/setlists/$setlistId');
      if (response.statusCode == 200 || response.statusCode == 204 || response.statusCode == 202) {
        await _triggerBackgroundSync();
      } else {
        throw Exception('Failed to delete setlist (Status: ${response.statusCode})');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting setlist: $e')),
        );
        setState(() => _isSyncing = false);
      }
    }
  }

  Widget _buildSetlistsAccordion() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    final canEditDelete = user?.role == 'admin' || user?.role == 'pianist' || user?.role == 'leader';

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
                if (canEditDelete)
                  Container(
                    color: AppColors.surfaceWarm,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CreateSetlistScreen(existingSetlist: setlist),
                              ),
                            );
                            if (result == true) {
                              _triggerBackgroundSync();
                            }
                          },
                          icon: Icon(Icons.edit, size: 16, color: AppColors.accentGold),
                          label: Text('Edit', style: TextStyle(color: AppColors.accentGold)),
                        ),
                        TextButton.icon(
                          onPressed: () => _deleteSetlist(setlist.id),
                          icon: Icon(Icons.delete, size: 16, color: AppColors.error),
                          label: Text('Delete', style: TextStyle(color: AppColors.error)),
                        ),
                        SizedBox(width: 8),
                      ],
                    ),
                  ),
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
