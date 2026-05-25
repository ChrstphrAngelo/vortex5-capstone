import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/pages/provisioning/provisioning_scan_page.dart';

class DevicePage extends StatefulWidget {
  final AppState appState;

  const DevicePage({super.key, required this.appState});

  @override
  State<DevicePage> createState() => _DevicePageState();
}

class _DevicePageState extends State<DevicePage> {
  static const Color _blue = Color(0xFF1E5BFF);
  static const Color _bg = Color(0xFFF3F4F6);

  Future<void> _startProvisioning() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const ProvisioningScanPage(),
      ),
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = widget.appState.isAdmin;

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
              'Connect a Sensor',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: isAdmin ? _addCard() : _viewerNotice(),
          ),
        ),
      ),
    );
  }

  // ======== Centered "Add BewAir Sensor" card (admin) ========
  Widget _addCard() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 380),
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 36),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Icon badge
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: _blue.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.wifi_tethering,
              color: _blue,
              size: 48,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Ready to connect',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Power on your BewAir sensor and make sure it is in '
            'provisioning mode (the "BewAir-XXXX" Wi-Fi should appear).',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF64748B),
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _startProvisioning,
              style: ElevatedButton.styleFrom(
                backgroundColor: _blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Add BewAir Sensor'),
            ),
          ),
        ],
      ),
    );
  }

  // ======== Non-admin notice ========
  Widget _viewerNotice() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 380),
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 36),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_outline, size: 56, color: Color(0xFFCBD5E1)),
          SizedBox(height: 16),
          Text(
            'Admins only',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Connecting new sensors is restricted to admin accounts. '
            'Sensors shared with you appear on the Home tab.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF64748B), fontSize: 14, height: 1.4),
          ),
        ],
      ),
    );
  }
}
