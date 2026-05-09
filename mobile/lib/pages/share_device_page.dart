import 'package:flutter/material.dart';
import 'package:vortex5_application_2/app_state.dart';

class ShareDevicePage extends StatefulWidget {
  final AppState appState;
  final String deviceId;
  final String deviceName;

  const ShareDevicePage({
    super.key,
    required this.appState,
    required this.deviceId,
    required this.deviceName,
  });

  @override
  State<ShareDevicePage> createState() => _ShareDevicePageState();
}

class _ShareDevicePageState extends State<ShareDevicePage> {
  final _emailCtrl = TextEditingController();
  List<Map<String, dynamic>> _users = [];
  bool _loading = true;
  bool _sharing = false;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    setState(() => _loading = true);
    try {
      final users = await widget.appState.getDeviceUsers(widget.deviceId);
      if (!mounted) return;
      setState(() {
        _users = users;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _share() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) return;

    setState(() => _sharing = true);
    final error = await widget.appState.shareDevice(widget.deviceId, email);
    if (!mounted) return;

    setState(() => _sharing = false);
    final messenger = ScaffoldMessenger.of(context);

    if (error != null) {
      messenger.showSnackBar(SnackBar(content: Text(error)));
    } else {
      _emailCtrl.clear();
      messenger.showSnackBar(
        SnackBar(content: Text('Device shared with $email')),
      );
      _loadUsers();
    }
  }

  Future<void> _unshare(String email, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Revoke Access'),
        content: Text('Remove $name ($email) from this device?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final error = await widget.appState.unshareDevice(widget.deviceId, email);
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    if (error != null) {
      messenger.showSnackBar(SnackBar(content: Text(error)));
    } else {
      messenger.showSnackBar(SnackBar(content: Text('Access revoked for $email')));
      _loadUsers();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E5BFF),
        foregroundColor: Colors.white,
        title: Text('Share ${widget.deviceName}'),
      ),
      body: Column(
        children: [
          // Share input
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      hintText: "Enter teacher's email",
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onSubmitted: (_) => _share(),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E5BFF),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                  ),
                  onPressed: _sharing ? null : _share,
                  child: _sharing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Share'),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                const Icon(Icons.people_outline, size: 20, color: Colors.black54),
                const SizedBox(width: 8),
                Text(
                  'Users with access (${_users.length})',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black54,
                  ),
                ),
              ],
            ),
          ),

          // User list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _users.isEmpty
                    ? const Center(
                        child: Text(
                          'No users have access yet.',
                          style: TextStyle(color: Colors.black54),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadUsers,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: _users.length,
                          itemBuilder: (ctx, i) {
                            final u = _users[i];
                            final email = u['email']?.toString() ?? '';
                            final first = u['firstName']?.toString() ?? '';
                            final last = u['lastName']?.toString() ?? '';
                            final role = u['role']?.toString() ?? '';
                            final fullName = '$first $last'.trim();
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: role == 'admin'
                                      ? const Color(0xFFEFF5FF)
                                      : const Color(0xFFF3F4F6),
                                  child: Icon(
                                    role == 'admin' ? Icons.admin_panel_settings : Icons.person,
                                    color: role == 'admin'
                                        ? const Color(0xFF1E5BFF)
                                        : Colors.black54,
                                  ),
                                ),
                                title: Text(
                                  fullName,
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                                subtitle: Text('$email  •  $role'),
                                trailing: role == 'admin'
                                    ? null
                                    : IconButton(
                                        icon: const Icon(Icons.remove_circle_outline,
                                            color: Colors.red),
                                        onPressed: () => _unshare(email, fullName),
                                      ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
