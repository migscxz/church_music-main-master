import 'dart:ui';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class CreateSongScreen extends StatefulWidget {
  const CreateSongScreen({super.key});

  @override
  _CreateSongScreenState createState() => _CreateSongScreenState();
}

class _CreateSongScreenState extends State<CreateSongScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  bool _isFetchingData = true;
  bool _showAdvanced = false;

  // Form Fields
  String _title = '';
  String _originalArtist = '';
  String _originalKey = '';
  String _tempo = '';
  String _chords = '';
  final String _notes = '';
  String _youtubeLink = '';

  // Tag and Leader Selections
  List<dynamic> _availableTags = [];
  List<dynamic> _availableLeaders = [];
  final List<int> _selectedTagIds = [];
  int? _selectedLeaderId;

  @override
  void initState() {
    super.initState();
    _fetchFormData();
  }

  Future<void> _fetchFormData() async {
    try {
      final responses = await Future.wait([
        _apiService.get('/tags'),
        _apiService.get('/song-leaders'),
      ]);

      if (responses[0].statusCode == 200 && responses[1].statusCode == 200) {
        if (mounted) {
          setState(() {
            _availableTags = jsonDecode(responses[0].body);
            _availableLeaders = jsonDecode(responses[1].body);

            // Auto select a system leader if no leader selected
            if (_availableLeaders.isNotEmpty && _selectedLeaderId == null) {
              _selectedLeaderId = _availableLeaders.first['id'];
            }
            _isFetchingData = false;
          });
        }
      } else {
        if (mounted) {
          setState(() => _isFetchingData = false);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isFetchingData = false);
      }
    }
  }

  Future<void> _formatWordDoc() async {
    // Temporary disabled on mobile until we decide on a clean mobile Word parser
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Word doc formatting only available on Web currently.'),
      ),
    );
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    final isAdminOrPianist = user?.role == 'admin' || user?.role == 'pianist';

    int? finalLeaderId = _selectedLeaderId;
    if (!isAdminOrPianist && user != null) {
      try {
        final myLeader = _availableLeaders.firstWhere(
          (l) => l['user_id']?.toString() == user.id.toString(),
        );
        finalLeaderId = myLeader['id'];
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Your account is not linked to a Song Leader profile. Cannot add song.')),
        );
        return;
      }
    }

    if (isAdminOrPianist && finalLeaderId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Please select a Song Leader.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      // 1. Create the Song Parent
      final songPayload = {
        'title': _title,
        'original_artist': _originalArtist,
        'original_key': _originalKey,
        'tags': _selectedTagIds,
      };

      final songRes = await _apiService.post('/songs', songPayload);

      if (songRes.statusCode == 201) {
        final songData = jsonDecode(songRes.body);
        final songId = songData['id'];

        // 2. Create the SongVersion Child if leader is assigned or if I am a leader
        if (finalLeaderId != null) {
          final versionPayload = {
            'song_id': songId,
            'song_leader_id': finalLeaderId,
            'key': _showAdvanced ? _originalKey : null,
            'tempo': _showAdvanced ? _tempo : null,
            'chords': _showAdvanced ? _chords : null,
            'notes': _showAdvanced ? _notes : null,
            'youtube_link': _showAdvanced ? _youtubeLink : null,
          };

          final versionRes = await _apiService.post(
            '/song-versions',
            versionPayload,
          );

          if (versionRes.statusCode != 201) {
            throw Exception('Failed to save chords/version details: ${versionRes.body}');
          }
        }

        if (mounted) {
          Navigator.pop(context, true); // true = trigger a refresh on Database Screen
        }
      } else {
        throw Exception('Failed to save song metadata: ${songRes.body}');
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

  InputDecoration _buildInputDecoration(String label, {String? hintText}) {
    return InputDecoration(
      labelText: label,
      hintText: hintText,
      hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.5)),
      labelStyle: TextStyle(color: AppColors.textSecondary),
      filled: true,
      fillColor: Colors.white.withOpacity(0.03),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.08), width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: AppColors.accentGold.withOpacity(0.6),
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: AppColors.error.withOpacity(0.5),
          width: 1,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppColors.error, width: 1.5),
      ),
      contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      alignLabelWithHint: true,
    );
  }

  Widget _buildGlassContainer({required Widget child, EdgeInsetsGeometry? padding}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWarm.withOpacity(0.4),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Padding(
            padding: padding ?? const EdgeInsets.all(24.0),
            child: child,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          'Create Song',
          style: TextStyle(
            color: AppColors.textMain,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.textMain),
        flexibleSpace: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: AppColors.background.withOpacity(0.7)),
          ),
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topRight,
            radius: 1.5,
            colors: [
              AppColors.accentGold.withOpacity(0.15),
              AppColors.background,
            ],
          ),
        ),
        child: _isFetchingData
            ? Center(
                child: CircularProgressIndicator(color: AppColors.accentGold),
              )
            : SafeArea(
                child: SingleChildScrollView(
                  physics: BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildGlassContainer(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.music_note, color: AppColors.accentGold, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Metadata',
                                    style: TextStyle(
                                      color: AppColors.textMain,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 24),
                              TextFormField(
                                style: TextStyle(color: AppColors.textMain),
                                decoration: _buildInputDecoration('Title *'),
                                validator: (val) =>
                                    val == null || val.isEmpty ? 'Required' : null,
                                onSaved: (val) => _title = val ?? '',
                              ),
                              SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      style: TextStyle(color: AppColors.textMain),
                                      decoration: _buildInputDecoration('Original Artist'),
                                      onSaved: (val) => _originalArtist = val ?? '',
                                    ),
                                  ),
                                  SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      style: TextStyle(color: AppColors.textMain),
                                      decoration: _buildInputDecoration('Original Key'),
                                      onSaved: (val) => _originalKey = val ?? '',
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 24),
                              Text(
                                'Categories',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textSecondary,
                                  fontSize: 14,
                                ),
                              ),
                              SizedBox(height: 12),
                              Wrap(
                                spacing: 8.0,
                                runSpacing: 8.0,
                                children: _availableTags.map((tag) {
                                  final isSelected = _selectedTagIds.contains(tag['id']);
                                  return FilterChip(
                                    label: Text(
                                      tag['name'],
                                      style: TextStyle(
                                        color: isSelected ? AppColors.primaryDark : AppColors.textMain,
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      ),
                                    ),
                                    selected: isSelected,
                                    showCheckmark: false,
                                    selectedColor: AppColors.accentGold,
                                    backgroundColor: Colors.white.withOpacity(0.05),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      side: BorderSide(
                                        color: isSelected ? AppColors.accentGold : Colors.white.withOpacity(0.1),
                                      ),
                                    ),
                                    onSelected: (bool selected) {
                                      setState(() {
                                        if (selected) {
                                          _selectedTagIds.add(tag['id']);
                                        } else {
                                          _selectedTagIds.remove(tag['id']);
                                        }
                                      });
                                    },
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 24),
                        _buildGlassContainer(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.mic, color: AppColors.accentGold, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Version Details',
                                    style: TextStyle(
                                      color: AppColors.textMain,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 24),
                              Consumer<AuthProvider>(
                                builder: (context, auth, _) {
                                  final user = auth.user;
                                  final isAdminOrPianist = user?.role == 'admin' || user?.role == 'pianist';

                                  if (!isAdminOrPianist) {
                                    return SizedBox(); 
                                  }

                                  return DropdownButtonFormField<int>(
                                    dropdownColor: AppColors.surfaceWarm,
                                    style: TextStyle(color: AppColors.textMain, fontSize: 16),
                                    decoration: _buildInputDecoration('Song Leader *'),
                                    initialValue: _selectedLeaderId,
                                    items: _availableLeaders.map<DropdownMenuItem<int>>((
                                      leader,
                                    ) {
                                      return DropdownMenuItem<int>(
                                        value: leader['id'],
                                        child: Text(leader['name']),
                                      );
                                    }).toList(),
                                    onChanged: (val) =>
                                        setState(() => _selectedLeaderId = val),
                                    validator: (val) => val == null ? 'Required' : null,
                                  );
                                }
                              ),
                              
                              AnimatedSize(
                                duration: Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                                child: Column(
                                  children: [
                                    if (!_showAdvanced)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 16.0),
                                        child: InkWell(
                                          borderRadius: BorderRadius.circular(12),
                                          onTap: () => setState(() => _showAdvanced = true),
                                          child: Container(
                                            padding: EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                                            decoration: BoxDecoration(
                                              color: AppColors.accentGoldLight.withOpacity(0.05),
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: AppColors.accentGold.withOpacity(0.2)),
                                            ),
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                Icon(Icons.add, color: AppColors.accentGold, size: 18),
                                                SizedBox(width: 8),
                                                Text(
                                                  'Add Tempo, Chords & Links',
                                                  style: TextStyle(
                                                    color: AppColors.accentGold,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    if (_showAdvanced) ...[
                                      SizedBox(height: 16),
                                      TextFormField(
                                        style: TextStyle(color: AppColors.textMain),
                                        decoration: _buildInputDecoration('Tempo (BPM)'),
                                        onSaved: (val) => _tempo = val ?? '',
                                      ),
                                      SizedBox(height: 16),
                                      TextFormField(
                                        style: TextStyle(color: AppColors.textMain),
                                        decoration: _buildInputDecoration('YouTube Link', hintText: 'https://youtube.com/...'),
                                        onSaved: (val) => _youtubeLink = val ?? '',
                                      ),
                                      SizedBox(height: 16),
                                      TextFormField(
                                        style: TextStyle(color: AppColors.accentGold, fontFamily: 'Courier', fontSize: 14),
                                        decoration: _buildInputDecoration('Chords (Plain Text)', hintText: 'Paste chords here, keeping whitespace intact.'),
                                        maxLines: 8,
                                        onSaved: (val) => _chords = val ?? '',
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 40),
                        Container(
                          width: double.infinity,
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppColors.accentGold, Color(0xFFE5C568)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.accentGold.withOpacity(0.3),
                                blurRadius: 16,
                                offset: Offset(0, 8),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            onPressed: _isLoading ? null : _submitForm,
                            child: _isLoading
                                ? SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      color: AppColors.primaryDark,
                                      strokeWidth: 2.5,
                                    ),
                                  )
                                : Text(
                                    'SAVE SONG',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.5,
                                      fontSize: 16,
                                      color: AppColors.primaryDark,
                                    ),
                                  ),
                          ),
                        ),
                        SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}
