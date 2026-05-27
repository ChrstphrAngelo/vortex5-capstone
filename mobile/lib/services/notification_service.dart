import '../models/alert_item.dart';

/// Mock notification service used until real push integration is available.
class NotificationService {
  NotificationService._();

  static bool _notificationsEnabled = true;

  static bool get notificationsEnabled => _notificationsEnabled;

  static void setNotificationsEnabled(bool enabled) {
    _notificationsEnabled = enabled;
  }

  static List<AlertItem> getMockAlerts() => [];
}
