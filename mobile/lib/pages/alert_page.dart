import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/models/alert_item.dart';

class AlertPage extends StatefulWidget {
  const AlertPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<AlertPage> createState() => _AlertPageState();
}

class _AlertPageState extends State<AlertPage> {
  int _filter = 0;

  @override
  void initState() {
    super.initState();
    widget.appState.markAlertsRead();
  }

  @override
  Widget build(BuildContext context) {
    final alerts = _visibleAlerts();

    return Scaffold(
      backgroundColor: const Color(0xFFF4F8F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: AnimatedBuilder(
        animation: widget.appState,
        builder: (context, _) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.appState.unreadAlertCount} unread notifications',
                  style: const TextStyle(color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      _tab('All', 0),
                      _tab('Unread', 1),
                      _tab('Settings', 2),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Expanded(
                  child: _filter == 2
                      ? _settingsCard()
                      : ListView.builder(
                          itemCount: alerts.length,
                          itemBuilder: (context, index) {
                            final alert = alerts[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: alert.isRead
                                    ? Colors.white
                                    : const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: _borderForAlert(alert),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    alert.title,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(alert.message),
                                  const SizedBox(height: 8),
                                  Text(
                                    _timeAgo(alert.createdAt),
                                    style: const TextStyle(
                                      color: Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  List<AlertItem> _visibleAlerts() {
    final alerts = widget.appState.alerts;
    if (_filter == 1) {
      return alerts.where((alert) => !alert.isRead).toList();
    }
    return alerts;
  }

  Widget _tab(String label, int value) {
    final selected = _filter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          margin: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: selected ? const Color(0xFF0F172A) : Colors.black87,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _settingsCard() {
    final aqiCtrl = TextEditingController(
      text: widget.appState.aqiThreshold.toStringAsFixed(0),
    );
    final pm25Ctrl = TextEditingController(
      text: widget.appState.pm25Threshold.toStringAsFixed(0),
    );
    final coCtrl = TextEditingController(
      text: widget.appState.co2Threshold.toStringAsFixed(0),
    );
    bool notificationsEnabled = widget.appState.notificationsEnabled;

    return StatefulBuilder(
      builder: (context, setModalState) {
        return ListView(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFD7E2E8)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Threshold Limits',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  _settingsField(aqiCtrl, 'AQI Limit'),
                  const SizedBox(height: 12),
                  _settingsField(pm25Ctrl, 'PM2.5 Limit'),
                  const SizedBox(height: 12),
                  _settingsField(coCtrl, 'CO2 Limit'),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Enable Bell Notifications'),
                    subtitle: const Text(
                      'Show pop-up updates on the home page',
                    ),
                    value: notificationsEnabled,
                    onChanged: (value) =>
                        setModalState(() => notificationsEnabled = value),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final aqi = double.tryParse(aqiCtrl.text);
                        final pm25 = double.tryParse(pm25Ctrl.text);
                        final co = double.tryParse(coCtrl.text);

                        if (aqi == null || pm25 == null || co == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Please enter valid numeric thresholds.',
                              ),
                            ),
                          );
                          return;
                        }

                        await widget.appState.setThresholds(
                          aqiThreshold: aqi,
                          pm25Threshold: pm25,
                          co2Threshold: co,
                          notificationsEnabled: notificationsEnabled,
                        );
                        if (!mounted) return;
                        ScaffoldMessenger.of(this.context).showSnackBar(
                          const SnackBar(
                            content: Text('Alert settings saved.'),
                          ),
                        );
                      },
                      child: const Text('Save Settings'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _settingsField(TextEditingController controller, String label) {
    return TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Color _borderForAlert(AlertItem alert) {
    if (alert.title.toLowerCase().contains('high')) {
      return const Color(0xFFFCA5A5);
    }
    if (alert.title.toLowerCase().contains('warning')) {
      return const Color(0xFFFCD34D);
    }
    return alert.isRead ? const Color(0xFFD7E2E8) : const Color(0xFF93C5FD);
  }

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes} min ago';
    if (diff.inDays < 1) return '${diff.inHours} hr ago';
    return '${diff.inDays} day ago';
  }
}
