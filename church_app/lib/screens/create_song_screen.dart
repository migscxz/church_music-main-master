import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
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

    if (_selectedLeaderId == null) {
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

        // 2. Create the SongVersion Child
        final versionPayload = {
          'song_id': songId,
          'song_leader_id': _selectedLeaderId,
          'key': _originalKey,
          'tempo': _tempo,
          'chords': _chords,
          'notes': _notes,
          'youtube_link': _youtubeLink,
        };

        final versionRes = await _apiService.post(
          '/song-versions',
          versionPayload,
        );

        if (versionRes.statusCode == 201) {
          if (mounted) {
            Navigator.pop(
              context,
              true,
            ); // true = trigger a refresh on Database Screen
          }
        } else {
          throw Exception('Failed to save chords/version details');
        }
      } else {
        throw Exception('Failed to save song metadata');
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
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Create Song',
          style: TextStyle(
            color: AppColors.textMain,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.surface,
        iconTheme: IconThemeData(color: AppColors.textMain),
        elevation: 0,
      ),
      body: _isFetchingData
          ? Center(
              child: CircularProgressIndicator(color: AppColors.accentGold),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '1. Song Metadata',
                      style: TextStyle(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    SizedBox(height: 12),
                    TextFormField(
                      decoration: InputDecoration(
                        labelText: 'Title *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Required' : null,
                      onSaved: (val) => _title = val ?? '',
                    ),
                    SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            decoration: InputDecoration(
                              labelText: 'Original Artist',
                              border: OutlineInputBorder(),
                            ),
                            onSaved: (val) => _originalArtist = val ?? '',
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            decoration: InputDecoration(
                              labelText: 'Original Key',
                              border: OutlineInputBorder(),
                            ),
                            onSaved: (val) => _originalKey = val ?? '',
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Categories',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Wrap(
                      spacing: 8.0,
                      children: _availableTags.map((tag) {
                        final isSelected = _selectedTagIds.contains(tag['id']);
                        return FilterChip(
                          label: Text(tag['name']),
                          selected: isSelected,
                          selectedColor: AppColors.accentGoldLight,
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
                    SizedBox(height: 32),
                    Text(
                      '2. Version Details',
                      style: TextStyle(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    SizedBox(height: 12),
                    DropdownButtonFormField<int>(
                      decoration: InputDecoration(
                        labelText: 'Song Leader *',
                        border: OutlineInputBorder(),
                      ),
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
                    ),
                    SizedBox(height: 12),
                    TextFormField(
                      decoration: InputDecoration(
                        labelText: 'Tempo (BPM)',
                        border: OutlineInputBorder(),
                      ),
                      onSaved: (val) => _tempo = val ?? '',
                    ),
                    SizedBox(height: 12),
                    TextFormField(
                      decoration: InputDecoration(
                        labelText: 'YouTube Link',
                        border: OutlineInputBorder(),
                      ),
                      onSaved: (val) => _youtubeLink = val ?? '',
                    ),
                    SizedBox(height: 12),
                    TextFormField(
                      decoration: InputDecoration(
                        labelText: 'Chords (Plain Text)',
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                        hintText:
                            'Paste chords here, keeping whitespace intact.',
                      ),
                      maxLines: 15,
                      style: TextStyle(fontFamily: 'Courier', fontSize: 13),
                      onSaved: (val) => _chords = val ?? '',
                    ),
                    SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryDark,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: _isLoading ? null : _submitForm,
                        child: _isLoading
                            ? CircularProgressIndicator(
                                color: AppColors.accentGold,
                              )
                            : Text(
                                'SAVE SONG',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.2,
                                ),
                              ),
                      ),
                    ),
                    SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }
}
