import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/models.dart';
import '../utils/constants.dart';
import '../screens/songs_database_screen.dart';
import '../screens/create_setlist_screen.dart';

class AppDrawer extends StatelessWidget {
  final List<Setlist> setlists;
  final Setlist? selectedSetlist;
  final Function(Setlist) onSetlistSelected;

  const AppDrawer({
    super.key,
    required this.setlists,
    required this.selectedSetlist,
    required this.onSetlistSelected,
  });

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Drawer(
      backgroundColor: AppColors.background,
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: BoxDecoration(color: AppColors.primaryDark),
            accountName: Text(
              user?.name ?? 'Musician',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            accountEmail: Text(
              user?.email ?? '',
              style: TextStyle(color: Colors.white70),
            ),
            currentAccountPicture: CircleAvatar(
              backgroundColor: AppColors.accentGold,
              child: Text(
                user?.name.isNotEmpty == true
                    ? user!.name[0].toUpperCase()
                    : 'M',
                style: TextStyle(
                  fontSize: 24,
                  color: AppColors.primaryDark,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          ListTile(
            leading: Icon(Icons.library_music, color: AppColors.textMain),
            title: Text(
              'Songs Database',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.textMain,
              ),
            ),
            onTap: () {
              Navigator.pop(context); // close drawer
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => SongsDatabaseScreen()),
              );
            },
          ),
          Divider(color: AppColors.borderLight),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 8.0,
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'YOUR SETLISTS',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  letterSpacing: 1.2,
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.zero,
              itemCount: setlists.length,
              itemBuilder: (context, index) {
                final setlist = setlists[index];
                final isSelected = selectedSetlist?.id == setlist.id;

                return ListTile(
                  title: Text(
                    setlist.title,
                    style: TextStyle(
                      color: isSelected
                          ? AppColors.accentGold
                          : AppColors.textMain,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text(
                    setlist.date ?? 'No date',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                  selected: isSelected,
                  selectedTileColor: AppColors.accentGoldLight.withOpacity(0.1),
                  leading: Icon(
                    Icons.format_list_bulleted,
                    color: isSelected
                        ? AppColors.accentGold
                        : AppColors.textMuted,
                  ),
                  onTap: () {
                    onSetlistSelected(setlist);
                    Navigator.pop(context); // close drawer automatically
                  },
                );
              },
            ),
          ),
          Divider(color: AppColors.borderLight),
          ListTile(
            leading: Icon(Icons.add_to_photos, color: AppColors.accentGold),
            title: Text(
              'New Setlist',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.accentGold,
              ),
            ),
            onTap: () async {
              Navigator.pop(context); // close drawer automatically
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => CreateSetlistScreen()),
              );
            },
          ),
          ListTile(
            leading: Icon(Icons.logout, color: AppColors.error),
            title: Text('Sign Out', style: TextStyle(color: AppColors.error)),
            onTap: () async {
              await context.read<AuthProvider>().logout();
            },
          ),
          SizedBox(height: 16),
        ],
      ),
    );
  }
}
