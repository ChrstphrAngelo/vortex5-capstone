import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/models/sensor_device.dart';
import 'package:vortex5_application_2/pages/provisioning/provisioning_instructions_page.dart';
import 'package:vortex5_application_2/pages/share_device_page.dart';

class DevicePage extends StatefulWidget {
  final AppState appState;

  const DevicePage({super.key, required this.appState});

  @override
  State<DevicePage> createState() => _DevicePageState();
}

class _DevicePageState extends State<DevicePage> {
  static const Color _blue = Color(0xFF1E5BFF);
  static const Color _bg = Color(0xFFF3F4F6);

  String _search = '';

  List<SensorDevice> get _filteredSensors {
    final query = _search.trim().toLowerCase();
    if (query.isEmpty) return widget.appState.sensors;
    return widget.appState.sensors.where((sensor) {
      return sensor.name.toLowerCase().contains(query) ||
          sensor.room.toLowerCase().contains(query) ||
          sensor.id.toLowerCase().contains(query) ||
          sensor.esp32IpAddress.toLowerCase().contains(query);
    }).toList();
  }

  Future<void> _startProvisioning() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const ProvisioningInstructionsPage(),
      ),
    );
    if (mounted) setState(() {});
  }


  Future<void> _confirmReset(BuildContext sheetContext, SensorDevice sensor) async {
    final sheetNavigator = Navigator.of(sheetContext);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset Device?'),
        content: Text(
          'This will wipe the Wi-Fi credentials on ${sensor.name} and put it '
          'back into provisioning mode (Wi-Fi "BewAir-XXXX" will appear). '
          'The device record stays in the system, but it will need to be '
          're-provisioned to come back online.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reset', style: TextStyle(color: Colors.orange)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    final error = await widget.appState.resetDevice(sensor.id);
    if (!mounted) return;
    sheetNavigator.pop();
    if (error != null) {
      messenger.showSnackBar(SnackBar(content: Text(error)));
    } else {
      messenger.showSnackBar(
        SnackBar(content: Text('Reset command sent to ${sensor.name}.')),
      );
    }
  }

  Future<void> _showSensorDetails(SensorDevice sensor) async {
    final isActive = sensor.id == widget.appState.activeSensorId;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                sensor.name,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(sensor.room, style: const TextStyle(color: Colors.black54)),
              const SizedBox(height: 12),
              Text('Sensor ID: ${sensor.id.toUpperCase()}'),
              Text('Connection: ${sensor.connectionType}'),
              Text('Last seen: ${_timeAgo(sensor.lastUpdated)}'),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isActive
                      ? null
                      : () async {
                          final messenger = ScaffoldMessenger.of(context);
                          final navigator = Navigator.of(sheetContext);
                          await widget.appState.connectSensor(sensor.id);
                          if (!mounted) return;
                          navigator.pop();
                          setState(() {});
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text('${sensor.name} is now connected.'),
                            ),
                          );
                        },
                  child: Text(isActive ? 'Currently Active' : 'Connect Sensor'),
                ),
              ),
              if (widget.appState.isAdmin) ...[
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.share),
                    label: const Text('Share Device'),
                    onPressed: () {
                      Navigator.of(sheetContext).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ShareDevicePage(
                            appState: widget.appState,
                            deviceId: sensor.id,
                            deviceName: sensor.name,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.restart_alt),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.orange.shade700,
                      side: BorderSide(color: Colors.orange.shade700),
                    ),
                    label: const Text('Reset Device'),
                    onPressed: sensor.status == SensorStatus.offline
                        ? null
                        : () => _confirmReset(sheetContext, sensor),
                  ),
                ),
                if (sensor.status == SensorStatus.offline)
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      'Device must be online to receive a reset command. '
                      'Use the BOOT button on the ESP32 instead.',
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ),
              ],
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final sensors = _filteredSensors;
    final onlineCount = widget.appState.sensors
        .where((s) => s.status == SensorStatus.active || s.status == SensorStatus.available)
        .length;
    final warningCount = widget.appState.alerts.length;
    final offlineCount = widget.appState.sensors
        .where((sensor) => sensor.status == SensorStatus.offline)
        .length;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _blue,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AirWatch',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              'Air Quality Monitor',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: AnimatedBuilder(
          animation: widget.appState,
          builder: (context, _) {
            return RefreshIndicator(
              onRefresh: () => widget.appState.refreshFromBackend(),
              child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Connected Sensors',
                          style: TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (widget.appState.isAdmin)
                        FloatingActionButton.small(
                          heroTag: 'provision_device',
                          onPressed: _startProvisioning,
                          backgroundColor: const Color(0xFF0F172A),
                          child: const Icon(Icons.add, color: Colors.white),
                        ),
                    ],
                  ),
                  Text(
                    widget.appState.isAdmin
                        ? 'Configure and share IoT air quality devices.'
                        : 'Sensors shared with you by an admin.',
                    style: const TextStyle(color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          icon: Icons.wifi,
                          count: '$onlineCount',
                          label: 'Online',
                          color: const Color(0xFF1E5BFF),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _StatCard(
                          icon: Icons.error_outline,
                          count: '$warningCount',
                          label: 'Warning',
                          color: const Color(0xFFD97706),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _StatCard(
                          icon: Icons.wifi_off,
                          count: '$offlineCount',
                          label: 'Offline',
                          color: const Color(0xFFDC2626),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    onChanged: (value) => setState(() => _search = value),
                    decoration: InputDecoration(
                      hintText: 'Search sensor, room, or ESP32 IP...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: const Color(0xFFE5E7EB),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text(
                        'ESP32 Devices',
                        style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: () async {
                          await widget.appState.refreshFromBackend();
                          if (mounted) setState(() {});
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('Refresh'),
                      ),
                    ],
                  ),
                  if (sensors.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Text(
                        'No matching sensors found.',
                        style: TextStyle(color: Colors.black54),
                      ),
                    ),
                  ...sensors.map(_deviceCard),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF5FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFB5D0FF)),
                    ),
                    child: Text(
                      widget.appState.isAdmin
                          ? 'Need help?\nTap + to provision a new sensor. Tap a sensor and choose "Share Device" to give teachers access.'
                          : 'Need help?\nAsk an admin to share a sensor with your account. Shared sensors will appear here automatically.',
                      style: const TextStyle(color: Color(0xFF0F172A)),
                    ),
                  ),
                ],
              ),
            ),
            );
          },
        ),
      ),
    );
  }

  Widget _deviceCard(SensorDevice item) {
    final isActive = item.id == widget.appState.activeSensorId;

    // Three-state badge: Active (green), No Data (orange), Inactive (red).
    final String badgeText;
    final Color badgeBg;
    final Color badgeFg;
    switch (item.status) {
      case SensorStatus.active:
        badgeText = isActive ? 'Active' : 'Online';
        badgeBg = const Color(0xFFE7F9EC);
        badgeFg = const Color(0xFF0A9A40);
      case SensorStatus.available:
        badgeText = 'No Data';
        badgeBg = const Color(0xFFFFF7ED);
        badgeFg = const Color(0xFFD97706);
      case SensorStatus.offline:
        badgeText = 'Inactive';
        badgeBg = const Color(0xFFFFEAEA);
        badgeFg = const Color(0xFFDC2626);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isActive ? const Color(0xFF60A5FA) : const Color(0xFFD1D5DB),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F83FF), Color(0xFF8B2CF5)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.sensors, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      item.room,
                      style: const TextStyle(color: Colors.black54),
                    ),
                    Text(
                      '${item.id.toUpperCase()} - ${item.esp32IpAddress}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.black45,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    color: badgeFg,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                'Endpoint: ${item.esp32Endpoint}',
                style: const TextStyle(color: Colors.black54),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => _showSensorDetails(item),
                child: const Text(
                  'View Details',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime value) {
    final diff = DateTime.now().difference(value);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes} min ago';
    if (diff.inDays < 1) return '${diff.inHours} hr ago';
    return '${diff.inDays} day ago';
  }

}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String count;
  final String label;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.count,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 8),
          Text(
            count,
            style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700),
          ),
          Text(label, style: const TextStyle(color: Colors.black54)),
        ],
      ),
    );
  }
}
