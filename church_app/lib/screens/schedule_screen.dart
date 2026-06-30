import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../services/database_helper.dart';
import '../models/schedule_model.dart';
import '../utils/constants.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ScheduleScreenState createState() => ScheduleScreenState();
}

class ScheduleScreenState extends State<ScheduleScreen> {
  bool _isLoading = true;
  List<Schedule> _schedules = [];
  
  static const List<String> defaultRoles = [
    'Song Leader',
    'Back-up 1',
    'Back-up 2',
    'Backup Trainee',
    'Keyboard',
    'Lead Guitar',
    'Rhythm Guitar',
    'Bass Guitar',
    'Drum',
    'Devotion/Prayer'
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final rawSchedules = await DatabaseHelper.instance.getSchedules();
    final parsed = rawSchedules.map((row) {
      return Schedule.fromJson({
        'id': row['id'],
        'month_year': row['month_year'],
        'weeks': row['weeks_json'],
      });
    }).toList();

    setState(() {
      _schedules = parsed;
      _isLoading = false;
    });
  }

  String _formatMonthYear(String yyyymm) {
    if (yyyymm.isEmpty) return '';
    try {
      final parts = yyyymm.split('-');
      if (parts.length == 2) {
        final date = DateTime(int.parse(parts[0]), int.parse(parts[1]));
        return DateFormat('MMMM yyyy').format(date);
      }
    } catch (_) {}
    return yyyymm;
  }

  String _formatDay(String yyyymmdd) {
    if (yyyymmdd.isEmpty) return '';
    try {
      final parts = yyyymmdd.split('-');
      if (parts.length == 3) {
        return parts[2]; // just the day
      }
    } catch (_) {}
    return yyyymmdd;
  }

  Widget _buildMobileSchedule(Schedule schedule) {
    final weeks = schedule.weeks;
    if (weeks.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text('No weeks found for this schedule.', style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: weeks.map((week) {
        String formattedDate = week.date;
        try {
          final d = DateTime.parse(week.date);
          formattedDate = DateFormat('EEEE, MMMM d').format(d);
        } catch (_) {}

        return Container(
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.borderLight)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Date Header
              Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: AppColors.surfaceWarm,
                child: Row(
                  children: [
                    Icon(Icons.calendar_today, size: 16, color: AppColors.accentGold),
                    SizedBox(width: 8),
                    Text(
                      formattedDate,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMain,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              // Assignments list
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Column(
                  children: defaultRoles.map((role) {
                    final assigned = week.assignments[role];
                    // Only show roles that have an assignment
                    if (assigned == null || assigned.trim().isEmpty) {
                      return SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 130,
                            child: Text(
                              role.toUpperCase(),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textSecondary,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              assigned,
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.textMain,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Schedules',
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
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentGold))
          : _schedules.isEmpty
              ? Center(
                  child: Text(
                    'No schedules available.\nPlease sync to fetch schedules.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                )
              : ListView.builder(
                  padding: EdgeInsets.all(16),
                  itemCount: _schedules.length,
                  itemBuilder: (context, index) {
                    final schedule = _schedules[index];
                    return Card(
                      color: AppColors.surface,
                      elevation: 0,
                      margin: EdgeInsets.only(bottom: 24),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: AppColors.borderLight, width: 1.5),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Container(
                            padding: EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceWarm,
                              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                              border: Border(bottom: BorderSide(color: AppColors.borderLight)),
                            ),
                            child: Text(
                              _formatMonthYear(schedule.monthYear).toUpperCase(),
                              style: TextStyle(
                                fontFamily: 'Cormorant Garamond',
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.2,
                                color: AppColors.textMain,
                              ),
                            ),
                          ),
                          _buildMobileSchedule(schedule),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
