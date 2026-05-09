import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:vortex5_application_2/models/alert_item.dart';
import 'package:vortex5_application_2/models/sensor_device.dart';
import 'package:vortex5_application_2/models/user_session.dart';
import 'package:vortex5_application_2/services/local_storage_service.dart';
import 'package:vortex5_application_2/services/notification_service.dart';

class AppState extends ChangeNotifier {
  AppState();

  static const _settingsKey = 'app_alert_settings';

  // Reading per deviceId — populated from /api/aqi/latest.
  final Map<String, SensorReadings> _readingsBySensorId = {};

  // Sensors fetched from /api/device.
  List<SensorDevice> _sensors = [];

  final List<AlertItem> _alerts = [];

  String _activeSensorId = '';
  int _aqi = 0;
  String _aqiLabel = '--';
  DateTime _lastUpdated = DateTime.now();
  bool _hasShownPopup = false;
  bool _notificationsEnabled = true;
  double _aqiThreshold = 100;
  double _pm25Threshold = 40;
  double _co2Threshold = 1000;

  Timer? _refreshTimer;

  String get activeSensorId => _activeSensorId;
  int get aqi => _aqi;
  String get aqiLabel => _aqiLabel;
  DateTime get lastUpdated => _lastUpdated;
  List<AlertItem> get alerts => List.unmodifiable(_alerts);
  List<SensorDevice> get sensors => List.unmodifiable(_sensors);
  double get aqiThreshold => _aqiThreshold;
  double get pm25Threshold => _pm25Threshold;
  double get co2Threshold => _co2Threshold;
  bool get notificationsEnabled => _notificationsEnabled;
  int get unreadAlertCount => _alerts.where((alert) => !alert.isRead).length;
  bool get hasUnreadAlerts => unreadAlertCount > 0;
  bool get hasShownPopup => _hasShownPopup;
  bool get hasAnyDevice => _sensors.isNotEmpty;

  SensorDevice get activeSensor => _sensors.firstWhere(
        (sensor) => sensor.id == _activeSensorId,
        orElse: () => SensorDevice(
          id: '',
          name: 'No sensor',
          room: 'No device registered',
          status: SensorStatus.offline,
          lastUpdated: _epoch,
          details: '',
          esp32IpAddress: '',
          esp32Endpoint: '',
          wifiName: '',
          connectionType: 'MQTT',
        ),
      );

  String get activeSensorName => activeSensor.name;
  String get activeSensorRoom => activeSensor.room;

  SensorReadings? get _activeReading => _readingsBySensorId[_activeSensorId];

  String get co2          => _fmt(_activeReading?.co2,           1, ' ppm', 0);
  String get pm1          => _fmt(_activeReading?.pm1,           1, ' µg/m³', 1);
  String get pm25         => _fmt(_activeReading?.pm25,          1, ' µg/m³', 1);
  String get pm10         => _fmt(_activeReading?.pm10,          1, ' µg/m³', 1);
  String get tvoc         => _fmt(_activeReading?.tvoc,          1, ' µg/m³', 0);
  String get formaldehyde => _fmt(_activeReading?.formaldehyde,  1, ' µg/m³', 0);
  String get temp         => _fmt(_activeReading?.temperature,   1, ' °C',   1);
  String get humidity     => _fmt(_activeReading?.humidity,      1, '%',     1);

  static String _fmt(double? v, int _, String suffix, int decimals) =>
      v == null ? '--' : '${v.toStringAsFixed(decimals)}$suffix';

  Future<void> initialize() async {
    final settings = await LocalStorageService.loadJsonMap(_settingsKey);
    _activeSensorId = settings['activeSensorId']?.toString() ?? '';
    _aqiThreshold =
        (settings['aqiThreshold'] as num?)?.toDouble() ?? _aqiThreshold;
    _pm25Threshold =
        (settings['pm25Threshold'] as num?)?.toDouble() ?? _pm25Threshold;
    _co2Threshold =
        (settings['co2Threshold'] as num?)?.toDouble() ??
        (settings['coThreshold'] as num?)?.toDouble() ??
        _co2Threshold;
    _notificationsEnabled =
        settings['notificationsEnabled'] as bool? ?? _notificationsEnabled;

    await refreshFromBackend();
  }

  void startAutoRefresh({Duration interval = const Duration(seconds: 10)}) {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(interval, (_) => refreshFromBackend());
  }

  void stopAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  Map<String, String> get _authHeaders {
    final token = UserSession.current?.token ?? '';
    return {
      'Content-Type': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  bool get isAdmin => UserSession.current?.role == 'admin';

  Future<void> refreshFromBackend() async {
    try {
      final devicesUri = Uri.parse('${UserSession.baseUrl}/api/device');
      final readingsUri = Uri.parse('${UserSession.baseUrl}/api/aqi/latest');

      final responses = await Future.wait([
        http.get(devicesUri, headers: _authHeaders).timeout(const Duration(seconds: 5)),
        http.get(readingsUri, headers: _authHeaders).timeout(const Duration(seconds: 5)),
      ]);

      if (responses[0].statusCode != 200 || responses[1].statusCode != 200) {
        return;
      }

      final devicesJson = jsonDecode(responses[0].body) as List<dynamic>;
      final readingsJson = jsonDecode(responses[1].body) as List<dynamic>;

      // Build readings map first so status can check for data presence.
      _readingsBySensorId.clear();
      for (final raw in readingsJson) {
        final r = raw as Map<String, dynamic>;
        final id = r['deviceId']?.toString();
        if (id == null || id.isEmpty) continue;
        _readingsBySensorId[id] = SensorReadings.fromJson(r);
      }

      _sensors = devicesJson.map((raw) {
        final d = raw as Map<String, dynamic>;
        final id = d['deviceId']?.toString() ?? '';
        final lastSeen = DateTime.tryParse(d['lastSeen']?.toString() ?? '') ??
            _epoch;
        final isOnline = d['status'] == 'online' &&
            DateTime.now().difference(lastSeen) < const Duration(seconds: 30);

        final SensorStatus status;
        if (!isOnline) {
          status = SensorStatus.offline;
        } else if (_readingsBySensorId.containsKey(id)) {
          status = SensorStatus.active;
        } else {
          status = SensorStatus.available; // online but no telemetry yet
        }

        return SensorDevice(
          id: id,
          name: d['name']?.toString() ?? '',
          room: d['room']?.toString() ?? '',
          status: status,
          lastUpdated: lastSeen,
          details: '',
          esp32IpAddress: '',
          esp32Endpoint: '',
          wifiName: '',
          connectionType: 'MQTT',
        );
      }).toList();

      // Drop readings for offline devices so the home screen clears stale data.
      for (final sensor in _sensors) {
        if (sensor.status == SensorStatus.offline) {
          _readingsBySensorId.remove(sensor.id);
        }
      }

      if (_sensors.isNotEmpty &&
          !_sensors.any((s) => s.id == _activeSensorId)) {
        _activeSensorId = _sensors.first.id;
        await _persistSettings();
      }

      _syncCurrentReading(pushAlert: false);
      _rebuildAlerts();
      notifyListeners();
    } catch (_) {
      // Network/DNS error — silently keep last known state.
    }
  }

  Future<void> setThresholds({
    required double aqiThreshold,
    required double pm25Threshold,
    required double co2Threshold,
    required bool notificationsEnabled,
  }) async {
    _aqiThreshold = aqiThreshold;
    _pm25Threshold = pm25Threshold;
    _co2Threshold = co2Threshold;
    _notificationsEnabled = notificationsEnabled;
    _rebuildAlerts();
    await _persistSettings();
    notifyListeners();
  }

  /// Admin-only: share a device with a user by email.
  Future<String?> shareDevice(String deviceId, String email) async {
    final uri = Uri.parse('${UserSession.baseUrl}/api/device/$deviceId/share');
    final res = await http.post(
      uri,
      headers: _authHeaders,
      body: jsonEncode({'email': email}),
    ).timeout(const Duration(seconds: 5));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) return null; // success
    return body['error']?.toString() ?? 'Failed to share device';
  }

  /// Admin-only: revoke a user's access to a device.
  Future<String?> unshareDevice(String deviceId, String email) async {
    final uri = Uri.parse('${UserSession.baseUrl}/api/device/$deviceId/unshare');
    final res = await http.post(
      uri,
      headers: _authHeaders,
      body: jsonEncode({'email': email}),
    ).timeout(const Duration(seconds: 5));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) return null;
    return body['error']?.toString() ?? 'Failed to revoke access';
  }

  /// Admin-only: send MQTT reset command to a device.
  /// Wipes Wi-Fi credentials on the ESP32 and reboots it into provisioning mode.
  Future<String?> resetDevice(String deviceId) async {
    final uri = Uri.parse('${UserSession.baseUrl}/api/device/$deviceId/reset');
    final res = await http.post(uri, headers: _authHeaders).timeout(const Duration(seconds: 10));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) return null;
    return body['error']?.toString() ?? 'Failed to send reset command';
  }

  /// Admin-only: list users who have access to a device.
  Future<List<Map<String, dynamic>>> getDeviceUsers(String deviceId) async {
    final uri = Uri.parse('${UserSession.baseUrl}/api/device/$deviceId/users');
    final res = await http.get(uri, headers: _authHeaders).timeout(const Duration(seconds: 5));
    if (res.statusCode != 200) return [];
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  Future<void> connectSensor(String sensorId) async {
    _activeSensorId = sensorId;
    _syncCurrentReading();
    await _persistSettings();
    notifyListeners();
  }

  void markAlertsRead() {
    for (final alert in _alerts) {
      alert.isRead = true;
    }
    notifyListeners();
  }

  void markPopupShown() {
    _hasShownPopup = true;
  }

  void _syncCurrentReading({bool pushAlert = true}) {
    final reading = _readingsBySensorId[_activeSensorId];
    if (reading == null) {
      _aqi = 0;
      _aqiLabel = '--';
      return;
    }

    final previousLabel = _aqiLabel;
    _aqi = reading.aqi;
    _aqiLabel = reading.aqiLabel;
    _lastUpdated = reading.updatedAt;

    if (pushAlert &&
        _notificationsEnabled &&
        previousLabel != _aqiLabel &&
        previousLabel != '--' &&
        previousLabel.isNotEmpty) {
      _alerts.insert(
        0,
        AlertItem(
          title: 'Air quality updated',
          message: '${activeSensor.room} is now $_aqiLabel with AQI $_aqi.',
          type: AlertType.aqi,
          createdAt: DateTime.now(),
        ),
      );
      _hasShownPopup = false;
    }

    _rebuildAlerts(keepManualAlerts: true);
  }

  void _rebuildAlerts({bool keepManualAlerts = false}) {
    final carried = keepManualAlerts
        ? _alerts.where((alert) => alert.type == AlertType.reminder).toList()
        : <AlertItem>[];

    final generated = <AlertItem>[];

    for (final sensor in _sensors) {
      final reading = _readingsBySensorId[sensor.id];
      if (reading == null) continue;

      final triggered = <String>[];
      if (reading.aqi >= _aqiThreshold) {
        triggered.add(
          'AQI ${reading.aqi} exceeds ${_aqiThreshold.toStringAsFixed(0)}',
        );
      }
      if (reading.pm25 >= _pm25Threshold) {
        triggered.add(
          'PM2.5 ${reading.pm25.toStringAsFixed(1)} exceeds ${_pm25Threshold.toStringAsFixed(0)}',
        );
      }
      if (reading.co2 >= _co2Threshold) {
        triggered.add(
          'CO2 ${reading.co2.toStringAsFixed(0)} exceeds ${_co2Threshold.toStringAsFixed(0)}',
        );
      }

      if (triggered.isEmpty) continue;

      final level = triggered.length >= 2
          ? 'High Alert'
          : reading.aqi >= 150
              ? 'High Alert'
              : 'Warning';

      generated.add(
        AlertItem(
          title: '$level - ${sensor.room}',
          message: triggered.join(' | '),
          type: AlertType.aqi,
          createdAt: sensor.lastUpdated,
          isRead: false,
        ),
      );
    }

    _alerts
      ..clear()
      ..addAll(generated)
      ..addAll(
        carried.isNotEmpty
            ? carried
            : NotificationService.getMockAlerts().where(
                (a) => a.type == AlertType.reminder,
              ),
      );
  }

  Future<void> _persistSettings() async {
    await LocalStorageService.saveJsonMap(_settingsKey, {
      'activeSensorId': _activeSensorId,
      'aqiThreshold': _aqiThreshold,
      'pm25Threshold': _pm25Threshold,
      'co2Threshold': _co2Threshold,
      'notificationsEnabled': _notificationsEnabled,
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
}

final DateTime _epoch = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);

String _aqiLabelFromValue(int aqi) {
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (SG)';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

class SensorReadings {
  final int aqi;
  final String aqiLabel;
  final double pm1;
  final double pm25;
  final double pm10;
  final double tvoc;
  final double co2;
  final double formaldehyde;
  final double temperature;
  final double humidity;
  final DateTime updatedAt;

  const SensorReadings({
    required this.aqi,
    required this.aqiLabel,
    required this.pm1,
    required this.pm25,
    required this.pm10,
    required this.tvoc,
    required this.co2,
    required this.formaldehyde,
    required this.temperature,
    required this.humidity,
    required this.updatedAt,
  });

  factory SensorReadings.fromJson(Map<String, dynamic> json) {
    final aqiVal = (json['Aqi'] as num?)?.toInt() ?? 0;
    return SensorReadings(
      aqi: aqiVal,
      aqiLabel: _aqiLabelFromValue(aqiVal),
      pm1:          (json['PM1']          as num?)?.toDouble() ?? 0,
      pm25:         (json['PM25']         as num?)?.toDouble() ?? 0,
      pm10:         (json['PM10']         as num?)?.toDouble() ?? 0,
      tvoc:         (json['TVOC']         as num?)?.toDouble() ?? 0,
      co2:          (json['CO2']          as num?)?.toDouble() ?? 0,
      formaldehyde: (json['Formaldehyde'] as num?)?.toDouble() ?? 0,
      temperature:  (json['Temperature']  as num?)?.toDouble() ?? 0,
      humidity:     (json['Humidity']     as num?)?.toDouble() ?? 0,
      updatedAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
