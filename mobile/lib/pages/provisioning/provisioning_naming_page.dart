import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../models/user_session.dart';

class ProvisioningNamingPage extends StatefulWidget {
  final String deviceId;

  const ProvisioningNamingPage({super.key, required this.deviceId});

  @override
  State<ProvisioningNamingPage> createState() => _ProvisioningNamingPageState();
}

class _ProvisioningNamingPageState extends State<ProvisioningNamingPage> {
  final _nameCtrl = TextEditingController();
  final _roomCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _roomCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final room = _roomCtrl.text.trim();
    if (name.isEmpty || room.isEmpty) {
      setState(() => _error = 'Please fill in both fields.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final res = await http
          .post(
            Uri.parse('${UserSession.baseUrl}/api/device'),
            headers: {
              'Content-Type': 'application/json',
              if (UserSession.current != null)
                'Authorization': 'Bearer ${UserSession.current!.token}',
            },
            body: jsonEncode({
              'deviceId': widget.deviceId,
              'name': name,
              'room': room,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (res.statusCode != 200) {
        setState(() {
          _submitting = false;
          _error = 'Server rejected registration (${res.statusCode}).';
        });
        return;
      }

      if (!mounted) return;
      // Pop back to device page with a success result so it can refresh.
      Navigator.of(context).popUntil((route) => route.isFirst);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$name added in $room')),
      );
    } catch (e) {
      setState(() {
        _submitting = false;
        _error =
            'Could not reach the server. Make sure your phone is back on Wi-Fi with internet.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E5BFF),
        foregroundColor: Colors.white,
        title: const Text('Name Your Sensor'),
        automaticallyImplyLeading: false,
      ),
      body: AbsorbPointer(
        absorbing: _submitting,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.check_circle,
                color: Color(0xFF0A9A40),
                size: 56,
              ),
              const SizedBox(height: 12),
              const Text(
                'Sensor configured!',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                '${widget.deviceId} should now be online. Give it a name and a '
                'room so you can find it later.',
                style: const TextStyle(color: Colors.black54, height: 1.4),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _nameCtrl,
                decoration: InputDecoration(
                  labelText: 'Sensor name',
                  hintText: 'e.g. Front of classroom',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _roomCtrl,
                decoration: InputDecoration(
                  labelText: 'Room',
                  hintText: 'e.g. Room 101',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
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
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Finish'),
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
