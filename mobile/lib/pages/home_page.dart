import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/models/sensor_device.dart';
import 'package:vortex5_application_2/pages/device_list_page.dart';
import 'package:vortex5_application_2/pages/share_device_page.dart';
import '../models/user_session.dart';

class HomePage extends StatefulWidget {
  final AppState appState;
  final VoidCallback onOpenAlerts;

  const HomePage({
    super.key,
    required this.appState,
    required this.onOpenAlerts,
  });

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final PageController _pageController = PageController();
  int _index = 0;

  @override
  void initState() {
    super.initState();
    widget.appState.addListener(_handleStateChange);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _syncActiveToIndex();
      _showPopupIfNeeded();
    });
  }

  @override
  void dispose() {
    widget.appState.removeListener(_handleStateChange);
    _pageController.dispose();
    super.dispose();
  }

  void _handleStateChange() {
    if (!mounted) return;
    // Keep the page index within bounds if the device list changed.
    final count = widget.appState.sensors.length;
    if (count > 0 && _index >= count) {
      _index = count - 1;
      if (_pageController.hasClients) {
        _pageController.jumpToPage(_index);
      }
    }
    setState(() {});
    _showPopupIfNeeded();
  }

  void _syncActiveToIndex() {
    final sensors = widget.appState.sensors;
    if (sensors.isEmpty) return;
    final i = _index.clamp(0, sensors.length - 1);
    widget.appState.connectSensor(sensors[i].id);
  }

  void _showPopupIfNeeded() {
    if (!mounted ||
        !widget.appState.hasUnreadAlerts ||
        widget.appState.hasShownPopup) {
      return;
    }

    widget.appState.markPopupShown();
    final latest = widget.appState.alerts.first;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${latest.title}: ${latest.message}'),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(label: 'View', onPressed: widget.onOpenAlerts),
      ),
    );
  }

  void _goTo(int i) {
    final sensors = widget.appState.sensors;
    if (i < 0 || i >= sensors.length) return;
    _pageController.animateToPage(
      i,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
    );
  }

  // ----- Admin actions on the current sensor -----
  SensorDevice? get _current {
    final sensors = widget.appState.sensors;
    if (sensors.isEmpty) return null;
    return sensors[_index.clamp(0, sensors.length - 1)];
  }

  void _openShare(SensorDevice s) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ShareDevicePage(
          appState: widget.appState,
          deviceId: s.id,
          deviceName: s.name,
        ),
      ),
    );
  }

  void _openDeviceList() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DeviceListPage(appState: widget.appState),
      ),
    );
  }

  Future<void> _confirmReset(SensorDevice s) async {
    if (s.status == SensorStatus.offline) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Device must be online to receive a reset command. '
            'Use the BOOT button on the ESP32 instead.',
          ),
        ),
      );
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset Device?'),
        content: Text(
          'This will wipe the Wi-Fi credentials on ${s.name} and put it back '
          'into provisioning mode. It will need to be re-provisioned.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reset', style: TextStyle(color: Colors.orange)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    final error = await widget.appState.resetDevice(s.id);
    if (!mounted) return;
    messenger.showSnackBar(
      SnackBar(content: Text(error ?? 'Reset command sent to ${s.name}.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sensors = widget.appState.sensors;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F8F5),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _header(),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: sensors.isEmpty ? _emptyState() : _carousel(sensors),
            ),
          ],
        ),
      ),
    );
  }

  // ======== Header (gradient) ========
  Widget _header() {
    const brandBlue = Color(0xFF1E88FF);
    const brandGreen = Color(0xFF18A957);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [brandBlue, brandGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.school_rounded,
              color: Colors.white,
              size: 30,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'BewAir',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _displayName(),
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
          // Notifications
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                onPressed: () {
                  widget.appState.markAlertsRead();
                  widget.onOpenAlerts();
                },
                icon: const Icon(
                  Icons.notifications_none_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              if (widget.appState.unreadAlertCount > 0)
                Positioned(
                  right: 6,
                  top: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${widget.appState.unreadAlertCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          // Overflow menu (admin device actions + list of devices)
          if (widget.appState.isAdmin)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: Colors.white),
              onSelected: (value) {
                final cur = _current;
                if (value == 'list') {
                  _openDeviceList();
                } else if (value == 'share' && cur != null) {
                  _openShare(cur);
                } else if (value == 'reset' && cur != null) {
                  _confirmReset(cur);
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'share',
                  child: ListTile(
                    leading: Icon(Icons.share),
                    title: Text('Share Device'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuItem(
                  value: 'reset',
                  child: ListTile(
                    leading: Icon(Icons.restart_alt, color: Colors.orange),
                    title: Text('Reset Device'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuItem(
                  value: 'list',
                  child: ListTile(
                    leading: Icon(Icons.list_alt),
                    title: Text('List of Devices'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.sensors_off, size: 56, color: Colors.black38),
            const SizedBox(height: 12),
            Text(
              widget.appState.isAdmin
                  ? 'No sensors yet.\nAdd one from the Connect tab.'
                  : 'No sensors shared with you.\nAsk an admin to share one.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }

  // ======== Swipeable per-sensor carousel ========
  Widget _carousel(List<SensorDevice> sensors) {
    return Column(
      children: [
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            itemCount: sensors.length,
            onPageChanged: (i) {
              _index = i;
              widget.appState.connectSensor(sensors[i].id);
              setState(() {});
            },
            itemBuilder: (ctx, i) {
              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: _SensorPanel(
                  sensor: sensors[i],
                  reading: widget.appState.readingFor(sensors[i].id),
                  threshold: widget.appState.aqiThreshold,
                ),
              );
            },
          ),
        ),
        _navBar(sensors.length),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _navBar(int count) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: _index > 0 ? () => _goTo(_index - 1) : null,
            icon: const Icon(Icons.chevron_left),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              disabledBackgroundColor: const Color(0xFFF1F5F9),
            ),
          ),
          // Dot indicator
          Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(count, (i) {
              final active = i == _index;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 18 : 7,
                height: 7,
                decoration: BoxDecoration(
                  color: active
                      ? const Color(0xFF1E88FF)
                      : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
          IconButton(
            onPressed: _index < count - 1 ? () => _goTo(_index + 1) : null,
            icon: const Icon(Icons.chevron_right),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              disabledBackgroundColor: const Color(0xFFF1F5F9),
            ),
          ),
        ],
      ),
    );
  }

  String _displayName() {
    final u = UserSession.current;
    if (u == null) return 'Teacher';
    final name = '${u.firstName} ${u.lastName}'.trim();
    return name.isEmpty ? 'Teacher' : name;
  }
}

/// Self-contained detail card for a single sensor. Reads only from the passed
/// sensor + reading so neighbouring PageView pages don't show the active one.
class _SensorPanel extends StatelessWidget {
  final SensorDevice sensor;
  final SensorReadings? reading;
  final double threshold;

  const _SensorPanel({
    required this.sensor,
    required this.reading,
    required this.threshold,
  });

  Color _aqiColor(int aqi) {
    if (aqi <= 50) return const Color(0xFF0A9A40);
    if (aqi <= 100) return const Color(0xFFF59E0B);
    if (aqi <= 150) return const Color(0xFFEA580C);
    if (aqi <= 200) return const Color(0xFFDC2626);
    if (aqi <= 300) return const Color(0xFF9333EA);
    return const Color(0xFF7F1D1D);
  }

  @override
  Widget build(BuildContext context) {
    final isOff = !sensor.enabled;
    final hasReading = reading != null && !isOff;
    final aqi = reading?.aqi ?? 0;
    final color = !hasReading ? const Color(0xFF94A3B8) : _aqiColor(aqi);
    final aboveThreshold = aqi > threshold;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title row
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sensor.name.isEmpty ? sensor.id : sensor.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    sensor.room.isEmpty ? '—' : sensor.room,
                    style: const TextStyle(color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isOff
                    ? const Color(0xFFF1F5F9)
                    : color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text(
                isOff
                    ? 'Off'
                    : (hasReading ? reading!.aqiLabel : 'No data'),
                style: TextStyle(
                  color: isOff ? const Color(0xFF64748B) : color,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Big AQI card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              const Text(
                'Air Quality Index',
                style: TextStyle(color: Colors.black54, fontSize: 18),
              ),
              const SizedBox(height: 4),
              Text(
                isOff ? '—' : (hasReading ? '$aqi' : '--'),
                style: TextStyle(
                  color: color,
                  fontSize: 72,
                  fontWeight: FontWeight.w800,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                isOff
                    ? 'Device turned off'
                    : (hasReading ? reading!.aqiLabel : 'No data yet'),
                style: TextStyle(
                  color: color,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (hasReading) ...[
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      aboveThreshold
                          ? Icons.trending_up
                          : Icons.check_circle_outline,
                      color: aboveThreshold
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF0A9A40),
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      aboveThreshold ? 'Above threshold' : 'Within threshold',
                      style: TextStyle(
                        color: aboveThreshold
                            ? const Color(0xFFDC2626)
                            : const Color(0xFF0A9A40),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Metric tiles
        Row(
          children: [
            _metric('CO₂', hasReading ? '${reading!.co2.toStringAsFixed(0)} ppm' : '--', Icons.air),
            const SizedBox(width: 10),
            _metric('PM2.5', hasReading ? reading!.pm25.toStringAsFixed(1) : '--', Icons.water_drop_outlined),
            const SizedBox(width: 10),
            _metric('Temp', hasReading ? '${reading!.temperature.toStringAsFixed(1)}°C' : '--', Icons.device_thermostat),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _metric('PM10', hasReading ? reading!.pm10.toStringAsFixed(1) : '--', Icons.grain),
            const SizedBox(width: 10),
            _metric('Humidity', hasReading ? '${reading!.humidity.toStringAsFixed(0)}%' : '--', Icons.opacity),
            const SizedBox(width: 10),
            _metric('TVOC', hasReading ? reading!.tvoc.toStringAsFixed(0) : '--', Icons.bubble_chart_outlined),
          ],
        ),
      ],
    );
  }

  Widget _metric(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF1E88FF), size: 22),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(color: Colors.black54, fontSize: 12)),
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
}
