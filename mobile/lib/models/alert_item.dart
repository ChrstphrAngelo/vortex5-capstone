enum AlertType { aqi, advisory, reminder }

class AlertItem {
  final String title;
  final String message;
  final AlertType type;
  final DateTime createdAt;
  bool isRead;

  AlertItem({
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    this.isRead = false,
  });
}
