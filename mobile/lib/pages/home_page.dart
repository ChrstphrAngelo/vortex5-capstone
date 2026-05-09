import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/models/alert_item.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F8F5),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _header(),
              const SizedBox(height: 18),
              const Text(
                'Your Classroom',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),
              _classroomCard(),
              const SizedBox(height: 18),
              if (widget.appState.alerts.isNotEmpty) ...[
                const Text(
                  'Latest Alerts',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 10),
                ...widget.appState.alerts.take(2).map(_alertCard),
                const SizedBox(height: 18),
              ],
              _tipCard(),
            ],
          ),
        ),
      ),
    );
  }

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
      child: Column(
        children: [
          Row(
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
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'School Air Quality Monitor',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Track classroom conditions and respond to alerts faster.',
                  style: TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _classroomCard() {
    final statusColor = widget.appState.aqiLabel == 'Good'
        ? const Color(0xFF0A9A40)
        : const Color(0xFFF97316);
    final trendIcon = widget.appState.aqi <= widget.appState.aqiThreshold
        ? Icons.trending_up
        : Icons.trending_down;
    final trendText = widget.appState.aqi <= widget.appState.aqiThreshold
        ? 'Within threshold'
        : 'Above threshold';

    return Container(
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
                widget.appState.activeSensorRoom == 'Room 1'
                    ? 'Room 101'
                    : widget.appState.activeSensorRoom,
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
                  widget.appState.aqiLabel == 'Good'
                      ? 'Good'
                      : widget.appState.aqiLabel,
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
            'Updated ${_timeAgo(widget.appState.lastUpdated)}',
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
                  '${widget.appState.aqi}',
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 68,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  widget.appState.aqiLabel == 'Good'
                      ? 'Good'
                      : widget.appState.aqiLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
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

  Widget _alertCard(AlertItem alert) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: alert.isRead ? Colors.white : const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: alert.isRead
              ? const Color(0xFFD7E2E8)
              : const Color(0xFF93C5FD),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            alert.title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(alert.message),
          const SizedBox(height: 8),
          Text(
            _timeAgo(alert.createdAt),
            style: const TextStyle(color: Colors.black54),
          ),
        ],
      ),
    );
  }

  Widget _tipCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFDCE7DF)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Classroom Tip',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 8),
          Text(
            'Keep doors and windows open during class breaks to maintain better air circulation.',
            style: TextStyle(color: Color(0xFF475569), height: 1.4),
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

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes} min ago';
    if (diff.inDays < 1) return '${diff.inHours} hr ago';
    return '${diff.inDays} day ago';
  }
}
