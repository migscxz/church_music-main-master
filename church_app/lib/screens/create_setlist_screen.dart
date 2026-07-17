import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/sync_service.dart';
import '../services/database_helper.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import '../models/models.dart';
import 'pitch_detection_screen.dart';
import 'create_song_screen.dart';

class CreateSetlistScreen extends StatefulWidget {
  final Setlist? existingSetlist;
  const CreateSetlistScreen({super.key, this.existingSetlist});

  @override
  _CreateSetlistScreenState createState() => _CreateSetlistScreenState();
}

class _CreateSetlistScreenState extends State<CreateSetlistScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  bool _isDataLoading = true;
  String _title = '';
  DateTime? _selectedDate;

  // Song Selection State
  List<SongVersion> _availableVersions = [];
  List<String> _uniqueLeaders = ['All Leaders'];
  String _leaderFilter = 'All Leaders';
  String _searchQuery = '';
  final List<int> _selectedVersionIds = [];

  @override
  void initState() {
    super.initState();
    if (widget.existingSetlist != null) {
      _title = widget.existingSetlist!.title;
      _selectedDate = widget.existingSetlist!.date != null 
          ? DateTime.tryParse(widget.existingSetlist!.date!) 
          : null;
      _selectedVersionIds.addAll(
          widget.existingSetlist!.songVersions.map((v) => v.id));
    }
    _fetchSongs();
  }

  Future<void> _fetchSongs() async {
    try {
      final db = DatabaseHelper.instance;
      
      final rawVersions = await db.getAllSongVersions();
      final List<SongVersion> loadedVersions = rawVersions.map((v) {
        return SongVersion(
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
              ? SongLeader(
                  id: v['leader_id'],
                  name: v['leader_name'] ?? 'Unknown',
                  userId: v['leader_user_id'] != null ? int.tryParse(v['leader_user_id'].toString()) : null,
                )
              : null,
        );
      }).toList();

      if (mounted) {
        setState(() {
          _availableVersions = loadedVersions;

          final leaderNames = _availableVersions
              .where((v) => v.leader != null)
              .map((v) => v.leader!.name)
              .toSet()
              .toList();
          leaderNames.sort();
          _uniqueLeaders = ['All Leaders', ...leaderNames];

          _isDataLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isDataLoading = false);
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primaryDark,
              onPrimary: Colors.white,
              surface: AppColors.background,
              onSurface: AppColors.textMain,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _isLoading = true);

    try {
      final payload = {
        'title': _title,
        'date': _selectedDate != null
            ? "${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}"
            : null,
        'song_version_ids': _selectedVersionIds,
      };

      final response = widget.existingSetlist == null
          ? await _apiService.post('/setlists', payload)
          : await _apiService.put('/setlists/${widget.existingSetlist!.id}', payload);

      if (response.statusCode == 201 || response.statusCode == 200) {
        if (mounted) {
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(
          'Failed to save setlist (Status: ${response.statusCode})',
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    final isAdminOrPianist = user?.role == 'admin' || user?.role == 'pianist';

    // Filter logic
    final filteredVersions = _availableVersions.where((v) {
      if (!isAdminOrPianist && user != null && v.leader?.userId != user.id) {
        return false;
      }
      final matchesLeader = _leaderFilter == 'All Leaders' || v.leader?.name == _leaderFilter;
      final matchesSearch = _searchQuery.isEmpty || 
          (v.song?.title.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          (v.leader?.name.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
      return matchesLeader && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.existingSetlist != null ? 'Edit Setlist' : 'New Setlist',
          style: TextStyle(
            color: AppColors.textMain,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.surface,
        iconTheme: IconThemeData(color: AppColors.textMain),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.add_circle_outline, color: AppColors.accentGold),
            tooltip: 'Add New Song to Database',
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => CreateSongScreen()),
              );
              if (result == true) {
                setState(() => _isDataLoading = true);
                // We don't have SyncService imported directly here yet, but we can fetch
                // the new songs directly since _fetchSongs calls the API. 
                // But let's trigger a full sync if possible to ensure local DB matches.
                try {
                  await SyncService().syncEverything();
                } catch (_) {}
                await _fetchSongs();
              }
            },
          ),
          SizedBox(width: 8),
        ],
      ),
      body: _isDataLoading
          ? Center(
              child: CircularProgressIndicator(color: AppColors.accentGold),
            )
          : Padding(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextFormField(
                      initialValue: _title,
                      decoration: InputDecoration(
                        labelText: 'Setlist Title *',
                        hintText: 'e.g. Sunday Service AM',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: AppColors.accentGold,
                            width: 2,
                          ),
                        ),
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Required' : null,
                      onSaved: (val) => _title = val ?? '',
                    ),
                    SizedBox(height: 24),
                    InkWell(
                      onTap: () => _selectDate(context),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(12),
                          color: AppColors.surfaceWarm,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _selectedDate == null
                                  ? 'Select Date (Optional)'
                                  : '${_selectedDate!.toLocal()}'.split(' ')[0],
                              style: TextStyle(
                                fontSize: 16,
                                color: _selectedDate == null
                                    ? AppColors.textMuted
                                    : AppColors.textMain,
                              ),
                            ),
                            Icon(
                              Icons.calendar_today,
                              color: AppColors.accentGold,
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Select Songs',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        DropdownButton<String>(
                          value: _leaderFilter,
                          underline: SizedBox(),
                          icon: Icon(
                            Icons.filter_list,
                            size: 16,
                            color: AppColors.accentGold,
                          ),
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.textMain,
                          ),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _leaderFilter = val);
                            }
                          },
                          items: _uniqueLeaders.map((leader) {
                            return DropdownMenuItem(
                              value: leader,
                              child: Text(leader),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                    SizedBox(height: 12),
                    TextField(
                      decoration: InputDecoration(
                        labelText: 'Search Songs',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                      ),
                      onChanged: (val) => setState(() => _searchQuery = val),
                    ),
                    SizedBox(height: 12),
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.borderLight),
                          borderRadius: BorderRadius.circular(12),
                          color: AppColors.surfaceWarm,
                        ),
                        child: ListView.separated(
                          itemCount: filteredVersions.length,
                          separatorBuilder: (_, _) =>
                              Divider(height: 1, color: AppColors.borderLight),
                          itemBuilder: (context, index) {
                            final version = filteredVersions[index];
                            final isSelected = _selectedVersionIds.contains(
                              version.id,
                            );

                            return CheckboxListTile(
                              activeColor: AppColors.accentGold,
                              checkColor: AppColors.primaryDark,
                              title: Text(
                                version.song?.title ?? 'Unknown Song',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        '${version.leader?.name ?? 'Unknown Leader'}',
                                        style: TextStyle(
                                          color: AppColors.textMuted,
                                          fontSize: 13,
                                        ),
                                      ),
                                      SizedBox(width: 8),
                                      Icon(
                                        Icons.music_note,
                                        size: 16,
                                        color: AppColors.textSecondary,
                                      ),
                                      SizedBox(width: 4),
                                      Text(
                                        version.key,
                                        style: TextStyle(
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (version.key.toLowerCase() == 'unknown')
                                    TextButton(
                                      onPressed: () async {
                                        final result = await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => PitchDetectionScreen(
                                              targetVersionId: version.id,
                                              songTitle: version.song?.title,
                                              leaderName: version.leader?.name,
                                            ),
                                          ),
                                        );
                                        if (result == true) {
                                          _fetchSongs(); // Refresh versions
                                        }
                                      },
                                      child: Text(
                                        'Get Your Key',
                                        style: TextStyle(color: AppColors.accentGold),
                                      ),
                                    ),
                                ],
                              ),
                              value: isSelected,
                              onChanged: (bool? checked) {
                                setState(() {
                                  if (checked == true) {
                                    _selectedVersionIds.add(version.id);
                                  } else {
                                    _selectedVersionIds.remove(version.id);
                                  }
                                });
                              },
                            );
                          },
                        ),
                      ),
                    ),
                    SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryDark,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        onPressed: _isLoading ? null : _submitForm,
                        child: _isLoading
                            ? CircularProgressIndicator(
                                color: AppColors.accentGold,
                              )
                            : Text(
                                widget.existingSetlist != null ? 'UPDATE SETLIST' : 'CREATE SETLIST',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.2,
                                  fontSize: 16,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
