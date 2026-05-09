import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'provisioning_naming_page.dart';

const String _esp32ProvisionUrl = 'http://192.168.4.1/provision';

class ProvisioningCredentialsPage extends StatefulWidget {
  final String deviceId;

  const ProvisioningCredentialsPage({super.key, required this.deviceId});

  @override
  State<ProvisioningCredentialsPage> createState() =>
      _ProvisioningCredentialsPageState();
}

class _ProvisioningCredentialsPageState
    extends State<ProvisioningCredentialsPage> {
  final _ssidCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _submitting = false;
  bool _hidePassword = true;
  String? _error;

  @override
  void dispose() {
    _ssidCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_ssidCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Wi-Fi name is required.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final res = await http
          .post(
            Uri.parse(_esp32ProvisionUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'ssid': _ssidCtrl.text.trim(),
              'password': _passCtrl.text,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode != 200) {
        setState(() {
          _submitting = false;
          _error = 'Sensor rejected the credentials (${res.statusCode}).';
        });
        return;
      }

      // Sensor will reboot now. Give it a moment, then go to naming.
      await Future.delayed(const Duration(seconds: 8));
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ProvisioningNamingPage(deviceId: widget.deviceId),
        ),
      );
    } catch (e) {
      setState(() {
        _submitting = false;
        _error =
            'Could not reach the sensor. Are you still joined to the BewAir network?';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E5BFF),
        foregroundColor: Colors.white,
        title: const Text('Wi-Fi Credentials'),
      ),
      body: AbsorbPointer(
        absorbing: _submitting,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sensor found: ${widget.deviceId}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E5BFF),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Enter the Wi-Fi the sensor should join. This is the network "
                "your sensor will use to send data — typically your home or "
                "school Wi-Fi (must be 2.4 GHz).",
                style: TextStyle(color: Colors.black54, height: 1.4),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _ssidCtrl,
                decoration: InputDecoration(
                  labelText: 'Wi-Fi name (SSID)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passCtrl,
                obscureText: _hidePassword,
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _hidePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () =>
                        setState(() => _hidePassword = !_hidePassword),
                  ),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E5BFF),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 12),
                            Text('Configuring sensor...'),
                          ],
                        )
                      : const Text('Send to Sensor'),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
