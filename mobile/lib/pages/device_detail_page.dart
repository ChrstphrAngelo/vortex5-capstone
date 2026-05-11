import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/models/sensor_device.dart';

/// Detailed AQI + metrics view for a single sensor.
/// Pushed from the home page grid when a device card is tapped.
class DeviceDetailPage extends StatefulWidget {
  final AppState appState;
  final String sensorId;

  const DeviceDetailPage({
    super.key,
    required this.appState,
    required this.sensorId,
  });

  @override
  State<DeviceDetailPage> createState() => _DeviceDetailPageState();
}

class _DeviceDetailPageState extends State<DeviceDetailPage> {
  @override
  void initState() {
    super.initState();
    widget.appState.addListener(_onChange);
    // Mark this sensor as the active one so AppState's metric getters apply to it.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.appState.connectSensor(widget.sensorId);
    });
  }

  @override
  void dispose() {
    widget.appState.removeListener(_onChange);
    super.dispose();
  }

  void _onChange() {
    if (mounted) setState(() {});
  }

  SensorDevice get _sensor => widget.appState.sensors.firstWhere(
        (s) => s.id == widget.sensorId,
        orElse: () => SensorDevice(
          id: widget.sensorId,
          name: 'Unknown',
          room: '',
          status: SensorStatus.offline,
          lastUpdated: DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
          details: '',
          esp32IpAddress: '',
          esp32Endpoint: '',
          wifiName: '',
          connectionType: 'MQTT',
        ),
      );

  @override
  Widget build(BuildContext context) {
    final sensor = _sensor;
    final reading = widget.appState.readingFor(sensor.id);
    final hasReading = reading != null;

    final statusColor = !hasReading
        ? const Color(0xFF94A3B8)
        : (widget.appState.aqiLabel == 'Good'
            ? const Color(0xFF0A9A40)
            : const Color(0xFFF97316));
    final trendIcon = widget.appState.aqi <= widget.appState.aqiThreshold
        ? Icons.trending_up
        : Icons.trending_down;
    final trendText = widget.appState.aqi <= widget.appState.aqiThreshold
        ? 'Within threshold'
        : 'Above threshold';

    return Scaffold(
      backgroundColor: const Color(0xFFF4F8F5),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E88FF),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              sensor.name,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
            Text(
              sensor.room,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ),
      ),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFDDF5E4),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFC4E8CE)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          sensor.room.isEmpty ? sensor.name : sensor.room,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.8),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Text(
                            hasReading ? widget.appState.aqiLabel : '--',
                            style: TextStyle(
                              color: statusColor,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      hasReading
                          ? 'Updated ${_timeAgo(widget.appState.lastUpdated)}'
                          : 'No data yet',
                      style: const TextStyle(color: Colors.black54),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'Air Quality Index',
                            style: TextStyle(color: Colors.black54, fontSize: 22),
                          ),
                          Text(
                            hasReading ? '${widget.appState.aqi}' : '--',
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 68,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            hasReading ? widget.appState.aqiLabel : '--',
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 30,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (hasReading)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(trendIcon, color: statusColor),
                                const SizedBox(width: 6),
                                Text(
                                  trendText,
                                  style: TextStyle(
                                    color: statusColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _metric(
                          icon: Icons.air,
                          label: 'CO2',
                          value: widget.appState.co2,
                        ),
                        const SizedBox(width: 8),
                        _metric(
                          icon: Icons.water_drop_outlined,
                          label: 'PM2.5',
                          value: widget.appState.pm25,
                        ),
                        const SizedBox(width: 8),
                        _metric(
                          icon: Icons.device_thermostat,
                          label: 'Temp',
                          value: widget.appState.temp,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text(
                          'PM10\n${widget.appState.pm10}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const Spacer(),
                        Text(
                          'Humidity\n${widget.appState.humidity}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _metric({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF1E88FF)),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(color: Colors.black54)),
            const SizedBox(height: 4),
            Text(
              value,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes} min ago';
    if (diff.inDays < 1) return '${diff.inHours} hr ago';
    return '${diff.inDays} day ago';
  }
}
