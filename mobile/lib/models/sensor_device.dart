enum SensorStatus { active, available, offline }

class SensorDevice {
  final String id;
  final String name;
  final String room;
  final SensorStatus status;
  final DateTime lastUpdated;
  final String details;
  final String esp32IpAddress;
  final String esp32Endpoint;
  final String wifiName;
  final String connectionType;

  const SensorDevice({
    required this.id,
    required this.name,
    required this.room,
    required this.status,
    required this.lastUpdated,
    required this.details,
    required this.esp32IpAddress,
    required this.esp32Endpoint,
    required this.wifiName,
    required this.connectionType,
  });

  factory SensorDevice.fromJson(Map<String, dynamic> json) {
    return SensorDevice(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      room: json['room']?.toString() ?? '',
      status: _statusFromString(json['status']?.toString() ?? 'available'),
      lastUpdated:
          DateTime.tryParse(json['lastUpdated']?.toString() ?? '') ??
          DateTime.now(),
      details: json['details']?.toString() ?? '',
      esp32IpAddress: json['esp32IpAddress']?.toString() ?? '',
      esp32Endpoint: json['esp32Endpoint']?.toString() ?? '/sensor',
      wifiName: json['wifiName']?.toString() ?? '',
      connectionType: json['connectionType']?.toString() ?? 'HTTP',
    );
  }

  factory SensorDevice.fromBackend(Map<String, dynamic> json) {
    return SensorDevice(
      id: json['deviceId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      room: json['room']?.toString() ?? '',
      status: json['status']?.toString() == 'online'
          ? SensorStatus.available
          : SensorStatus.offline,
      lastUpdated:
          DateTime.tryParse(json['lastSeen']?.toString() ?? '') ??
          DateTime.now(),
      details: '',
      esp32IpAddress: '',
      esp32Endpoint: '',
      wifiName: '',
      connectionType: 'MQTT',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'room': room,
    'status': status.name,
    'lastUpdated': lastUpdated.toIso8601String(),
    'details': details,
    'esp32IpAddress': esp32IpAddress,
    'esp32Endpoint': esp32Endpoint,
    'wifiName': wifiName,
    'connectionType': connectionType,
  };

  SensorDevice copyWith({
    String? id,
    String? name,
    String? room,
    SensorStatus? status,
    DateTime? lastUpdated,
    String? details,
    String? esp32IpAddress,
    String? esp32Endpoint,
    String? wifiName,
    String? connectionType,
  }) {
    return SensorDevice(
      id: id ?? this.id,
      name: name ?? this.name,
      room: room ?? this.room,
      status: status ?? this.status,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      details: details ?? this.details,
      esp32IpAddress: esp32IpAddress ?? this.esp32IpAddress,
      esp32Endpoint: esp32Endpoint ?? this.esp32Endpoint,
      wifiName: wifiName ?? this.wifiName,
      connectionType: connectionType ?? this.connectionType,
    );
  }

  static SensorStatus _statusFromString(String value) {
    switch (value.toLowerCase()) {
      case 'active':
        return SensorStatus.active;
      case 'offline':
        return SensorStatus.offline;
      default:
        return SensorStatus.available;
    }
  }
}
