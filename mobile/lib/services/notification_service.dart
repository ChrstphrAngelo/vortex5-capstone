import '../models/alert_item.dart';

/// Mock notification service used until real push integration is available.
class NotificationService {
  NotificationService._();

  static bool _notificationsEnabled = true;

  static bool get notificationsEnabled => _notificationsEnabled;

  static void setNotificationsEnabled(bool enabled) {
    _notificationsEnabled = enabled;
  }

  /// Returns static sample alerts. In production this can call backend/Firebase.
  static List<AlertItem> getMockAlerts() {
    final now = DateTime.now();
    return [
      AlertItem(
        title: 'AQI Alert',
        message: 'Room 101 PM2.5 has exceeded the preferred classroom range.',
        type: AlertType.aqi,
        createdAt: now,
        isRead: false,
      ),
      AlertItem(
        title: 'Air Quality Updated',
        message: 'Air quality changed after the latest sensor sync.',
        type: AlertType.advisory,
        createdAt: now.subtract(const Duration(hours: 2)),
        isRead: false,
      ),
      AlertItem(
        title: 'Teacher Reminder',
        message: 'Open classroom windows during break for better airflow.',
        type: AlertType.reminder,
        createdAt: now.subtract(const Duration(days: 1)),
        isRead: true,
      ),
    ];
  }
}
