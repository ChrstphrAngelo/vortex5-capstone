import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/models/sensor_device.dart';
import 'package:vortex5_application_2/pages/device_detail_page.dart';
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
  /// 'all' = show all devices, otherwise the room name to filter by.
  String _selectedRoom = 'all';

  @override
  void initState() {
    super.initState();
    widget.appState.addListener(_handleStateChange);
    WidgetsBinding.instance.addPostFrameCallback((_) => _showPopupIfNeeded());
  }

  @override
  void dispose() {
    widget.appState.removeListener(_handleStateChange);
    super.dispose();
  }

  void _handleStateChange() {
    if (!mounted) return;
    setState(() {});
    _showPopupIfNeeded();
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

  List<SensorDevice> get _filteredSensors {
    final all = widget.appState.sensors;
    if (_selectedRoom == 'all') return all;
    return all.where((s) => s.room.trim() == _selectedRoom).toList();
  }

  void _openDevice(SensorDevice sensor) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DeviceDetailPage(
          appState: widget.appState,
          sensorId: sensor.id,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
            _roomTabs(),
            const SizedBox(height: 12),
            Expanded(
              child: _deviceGrid(),
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
        ],
      ),
    );
  }

  // ======== Room filter tabs ========
  Widget _roomTabs() {
    final rooms = widget.appState.rooms;
    final tabs = <String>['all', ...rooms];

    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: tabs.length,
        separatorBuilder: (_, _) => const SizedBox(width: 18),
        itemBuilder: (ctx, i) {
          final tab = tabs[i];
          final isSelected = _selectedRoom == tab;
          final label = tab == 'all' ? 'All Devices' : tab;
          return GestureDetector(
            onTap: () => setState(() => _selectedRoom = tab),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: isSelected ? 18 : 16,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                    color: isSelected
                        ? const Color(0xFF0F172A)
                        : const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 4),
                if (isSelected)
                  Container(
                    height: 3,
                    width: 24,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E88FF),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ======== 2-column device grid ========
  Widget _deviceGrid() {
    final sensors = _filteredSensors;

    if (sensors.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.sensors_off, size: 56, color: Colors.black38),
              const SizedBox(height: 12),
              Text(
                widget.appState.sensors.isEmpty
                    ? 'No sensors yet.\nAsk an admin to share a sensor with your account.'
                    : 'No sensors in this room.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black54),
              ),
            ],
          ),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: sensors.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.05,
      ),
      itemBuilder: (ctx, i) => _deviceCard(sensors[i]),
    );
  }

  Widget _deviceCard(SensorDevice sensor) {
    final reading = widget.appState.readingFor(sensor.id);

    final String badgeText;
    final Color badgeBg;
    final Color badgeFg;
    switch (sensor.status) {
      case SensorStatus.active:
        badgeText = 'Active';
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

    return InkWell(
      onTap: () => _openDevice(sensor),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F83FF), Color(0xFF8B2CF5)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.sensors, color: Colors.white, size: 22),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(10),
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
              ],
            ),
            const Spacer(),
            Text(
              sensor.name.isEmpty ? sensor.id : sensor.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sensor.room.isEmpty ? '—' : sensor.room,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 6),
            Text(
              reading == null ? 'AQI: --' : 'AQI: ${reading.aqi}',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E88FF),
              ),
            ),
          ],
        ),
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
