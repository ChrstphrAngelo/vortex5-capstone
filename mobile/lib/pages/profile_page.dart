import 'package:flutter/material.dart';
import '../models/user_session.dart';
import 'login_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _privateAccount = false;

  Future<void> _editProfile() async {
    final user = UserSession.current;
    if (user == null) return;

    final firstCtrl = TextEditingController(text: user.firstName);
    final lastCtrl = TextEditingController(text: user.lastName);
    final emailCtrl = TextEditingController(text: user.email);
    final pictureCtrl = TextEditingController(text: user.pictureUrl);
    String department = user.department;
    String staffType = user.staffType;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setModalState) {
          return AlertDialog(
            title: const Text('Edit Profile'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _field(firstCtrl, 'First name'),
                  const SizedBox(height: 12),
                  _field(lastCtrl, 'Last name'),
                  const SizedBox(height: 12),
                  _field(emailCtrl, 'Email'),
                  const SizedBox(height: 12),
                  _field(pictureCtrl, 'Picture URL'),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: department.isEmpty ? null : department,
                    decoration: _inputDecoration('Department'),
                    items: const [
                      DropdownMenuItem(
                        value: 'Science Department',
                        child: Text('Science Department'),
                      ),
                      DropdownMenuItem(
                        value: 'Mathematics Department',
                        child: Text('Mathematics Department'),
                      ),
                      DropdownMenuItem(
                        value: 'English Department',
                        child: Text('English Department'),
                      ),
                      DropdownMenuItem(
                        value: 'ICT Department',
                        child: Text('ICT Department'),
                      ),
                    ],
                    onChanged: (value) =>
                        setModalState(() => department = value ?? ''),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: staffType.isEmpty ? null : staffType,
                    decoration: _inputDecoration('Staff Type'),
                    items: const [
                      DropdownMenuItem(
                        value: 'Teacher',
                        child: Text('Teacher'),
                      ),
                      DropdownMenuItem(
                        value: 'Student Teacher',
                        child: Text('Student Teacher'),
                      ),
                    ],
                    onChanged: (value) =>
                        setModalState(() => staffType = value ?? ''),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  final navigator = Navigator.of(dialogContext);
                  final message = await UserSession.updateProfile(
                    firstName: firstCtrl.text,
                    lastName: lastCtrl.text,
                    email: emailCtrl.text,
                    department: department,
                    staffType: staffType,
                    pictureUrl: pictureCtrl.text,
                  );
                  if (!mounted) return;
                  if (message != null) {
                    messenger.showSnackBar(SnackBar(content: Text(message)));
                    return;
                  }
                  navigator.pop();
                  setState(() {});
                },
                child: const Text('Save'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _changePassword() async {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Change Password'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _field(currentCtrl, 'Current Password', obscureText: true),
              const SizedBox(height: 12),
              _field(newCtrl, 'New Password', obscureText: true),
              const SizedBox(height: 12),
              _field(confirmCtrl, 'Confirm Password', obscureText: true),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              final navigator = Navigator.of(dialogContext);
              final message = await UserSession.changePassword(
                currentPassword: currentCtrl.text,
                newPassword: newCtrl.text,
                confirmPassword: confirmCtrl.text,
              );
              if (!mounted) return;
              if (message != null) {
                messenger.showSnackBar(SnackBar(content: Text(message)));
                return;
              }
              navigator.pop();
              messenger.showSnackBar(
                const SnackBar(content: Text('Password updated successfully.')),
              );
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final u = UserSession.current;
    final userName = u == null ? "User" : "${u.firstName} ${u.lastName}".trim();
    final email = u?.email ?? "john.doe@school.edu";
    final department = u?.department.isNotEmpty == true
        ? u!.department
        : "Science Department";
    final staffType = u?.staffType.isNotEmpty == true
        ? u!.staffType
        : "Teacher";

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E5BFF),
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
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF355CFF), Color(0xFFA020F0)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _avatar(u?.pictureUrl),
                const SizedBox(height: 12),
                Text(
                  userName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(email, style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    Chip(label: Text(staffType)),
                    Chip(label: Text(department)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Text(
                'Profile',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: _editProfile,
                icon: const Icon(Icons.edit_outlined),
                label: const Text('Edit'),
              ),
            ],
          ),
          _infoCard([
            _infoRow('Name', userName),
            _infoRow('Email', email),
            _infoRow('Department', department),
            _infoRow('Staff Type', staffType),
            _infoRow('Teacher ID', u?.teacherId ?? '--'),
          ]),
          const SizedBox(height: 14),
          const Text(
            'Account Settings',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFD1D5DB)),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Email Preferences'),
                  subtitle: const Text('Receive summary updates by email'),
                  value: _emailNotifications,
                  onChanged: (value) =>
                      setState(() => _emailNotifications = value),
                ),
                SwitchListTile(
                  title: const Text('Notification Settings'),
                  subtitle: const Text('Enable push alerts on this device'),
                  value: _pushNotifications,
                  onChanged: (value) =>
                      setState(() => _pushNotifications = value),
                ),
                SwitchListTile(
                  title: const Text('Privacy & Security'),
                  subtitle: const Text(
                    'Keep my account private to school staff',
                  ),
                  value: _privateAccount,
                  onChanged: (value) => setState(() => _privateAccount = value),
                ),
                ListTile(
                  title: const Text('Change Password'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _changePassword,
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'Assigned Classrooms',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          _roomCard('Room 101'),
          const SizedBox(height: 10),
          _roomCard('Room 102'),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () async {
              await UserSession.logout();
              if (!context.mounted) return;
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginPage()),
                (route) => false,
              );
            },
            icon: const Icon(Icons.logout, color: Colors.red),
            label: const Text(
              'Sign Out',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFF9A8A8)),
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _avatar(String? pictureUrl) {
    final initials = _avatarInitials();
    if (pictureUrl != null && pictureUrl.trim().isNotEmpty) {
      return CircleAvatar(
        radius: 34,
        backgroundColor: const Color(0xFF6988FF),
        backgroundImage: NetworkImage(pictureUrl),
        onBackgroundImageError: (exception, stackTrace) {},
        child: const SizedBox.shrink(),
      );
    }

    return CircleAvatar(
      radius: 34,
      backgroundColor: const Color(0xFF6988FF),
      child: Text(
        initials,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _roomCard(String room) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFE6EEFF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.school_outlined, color: Color(0xFF1E5BFF)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  room,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Text(
                  'Main Building',
                  style: TextStyle(color: Colors.black54),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFE7F9EC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF86E3A8)),
            ),
            child: const Text(
              'Online',
              style: TextStyle(color: Color(0xFF0A9A40)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: Column(children: children),
    );
  }

  Widget _infoRow(String label, String value) {
    return ListTile(title: Text(label), subtitle: Text(value));
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool obscureText = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      decoration: _inputDecoration(label),
    );
  }

  static InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  String _avatarInitials() {
    final u = UserSession.current;
    if (u == null) return 'U';
    final f = u.firstName.trim();
    final l = u.lastName.trim();
    final a = f.isNotEmpty ? f[0] : '';
    final b = l.isNotEmpty ? l[0] : '';
    final initials = (a + b).toUpperCase();
    return initials.isEmpty ? 'U' : initials;
  }
}
