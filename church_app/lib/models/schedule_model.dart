import 'dart:convert';

class WeekSchedule {
  final String date;
  final Map<String, String> assignments;

  WeekSchedule({required this.date, required this.assignments});

  factory WeekSchedule.fromJson(Map<String, dynamic> json) {
    return WeekSchedule(
      date: json['date'] ?? '',
      assignments: Map<String, String>.from(json['assignments'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'assignments': assignments,
    };
  }
}

class Schedule {
  final int id;
  final String monthYear;
  final List<WeekSchedule> weeks;

  Schedule({
    required this.id,
    required this.monthYear,
    this.weeks = const [],
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    List<WeekSchedule> parsedWeeks = [];
    if (json['weeks'] != null) {
      if (json['weeks'] is String) {
        try {
          final decoded = jsonDecode(json['weeks']);
          if (decoded is List) {
             parsedWeeks = decoded.map((e) => WeekSchedule.fromJson(e)).toList();
          }
        } catch (e) {
          // parse error
        }
      } else if (json['weeks'] is List) {
        parsedWeeks = (json['weeks'] as List)
            .map((e) => WeekSchedule.fromJson(e))
            .toList();
      }
    }

    return Schedule(
      id: json['id'],
      monthYear: json['month_year'] ?? json['monthYear'] ?? '',
      weeks: parsedWeeks,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'month_year': monthYear,
      'weeks': jsonEncode(weeks.map((e) => e.toJson()).toList()),
    };
  }
}
