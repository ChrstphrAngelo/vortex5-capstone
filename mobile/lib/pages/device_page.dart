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
              'BewAir',
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
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title + add button
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Devices',
                                      style: TextStyle(
                                        fontSize: 28,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF0F172A),
                                        letterSpacing: -0.4,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (widget.appState.isAdmin)
                                FloatingActionButton.small(
                                  heroTag: 'provision_device',
                                  onPressed: _startProvisioning,
                                  backgroundColor: _blue,
                                  elevation: 1,
                                  child: const Icon(Icons.add, color: Colors.white),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.appState.isAdmin
                                ? 'Manage and share air quality sensors.'
                                : 'Sensors shared with you by an admin.',
                            style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                          ),
                          const SizedBox(height: 16),

                          // Compact online/offline pills
                          Row(
                            children: [
                              _StatusPill(
                                color: const Color(0xFF0A9A40),
                                label: 'Online',
                                count: onlineCount,
                              ),
                              const SizedBox(width: 8),
                              _StatusPill(
                                color: const Color(0xFFDC2626),
                                label: 'Offline',
                                count: offlineCount,
                              ),
                              const Spacer(),
                              IconButton(
                                tooltip: 'Refresh',
                                onPressed: () async {
                                  await widget.appState.refreshFromBackend();
                                  if (mounted) setState(() {});
                                },
                                icon: const Icon(Icons.refresh,
                                    color: Color(0xFF64748B), size: 22),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Search bar
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: TextField(
                              onChanged: (value) => setState(() => _search = value),
                              style: const TextStyle(fontSize: 14),
                              decoration: const InputDecoration(
                                hintText: 'Search by name, room, or ID',
                                hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                                prefixIcon: Icon(Icons.search,
                                    color: Color(0xFF94A3B8), size: 20),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                        ],
                      ),
                    ),
                  ),

                  // Device list / empty state
                  if (sensors.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.sensors_off,
                                size: 56, color: Color(0xFFCBD5E1)),
                            const SizedBox(height: 12),
                            Text(
                              widget.appState.sensors.isEmpty
                                  ? (widget.appState.isAdmin
                                      ? 'No sensors yet'
                                      : 'No sensors shared with you')
                                  : 'No matches',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              widget.appState.sensors.isEmpty
                                  ? (widget.appState.isAdmin
                                      ? 'Tap + to provision a new BewAir sensor.'
                                      : 'Ask an admin to share a sensor with your account.')
                                  : 'Try a different search term.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      sliver: SliverList.builder(
                        itemCount: sensors.length,
                        itemBuilder: (ctx, i) => _deviceCard(sensors[i]),
                      ),
                    ),
                ],
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
        badgeBg = const Color(0xFFDCFCE7);
        badgeFg = const Color(0xFF15803D);
      case SensorStatus.available:
        badgeText = 'No Data';
        badgeBg = const Color(0xFFFEF3C7);
        badgeFg = const Color(0xFF92400E);
      case SensorStatus.offline:
        badgeText = 'Inactive';
        badgeBg = const Color(0xFFFEE2E2);
        badgeFg = const Color(0xFF991B1B);
    }

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => _showSensorDetails(item),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isActive ? _blue : const Color(0xFFE2E8F0),
              width: isActive ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              // Sensor icon — solid blue square, no gradient
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.sensors, color: _blue, size: 22),
              ),
              const SizedBox(width: 12),

              // Name / room / id
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name.isEmpty ? item.id : item.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.room.isEmpty ? '—' : item.room,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 13,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.id.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF94A3B8),
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Right side: status pill + chevron
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(
                        color: badgeFg,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Icon(
                    Icons.chevron_right,
                    color: const Color(0xFFCBD5E1),
                    size: 20,
                  ),
                ],
              ),
            ],
          ),
        ),
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

/// Compact pill showing a count + label with a colored dot indicator.
/// Replaces the larger _StatCard tiles for a cleaner look.
class _StatusPill extends StatelessWidget {
  final Color color;
  final String label;
  final int count;

  const _StatusPill({
    required this.color,
    required this.label,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$count',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }
}

