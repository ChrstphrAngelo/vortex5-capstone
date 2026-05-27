import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:vortex5_application_2/app_state.dart';
import 'package:vortex5_application_2/models/bulletin_post.dart';
import 'package:vortex5_application_2/models/user_session.dart';

class BulletinBoardPage extends StatefulWidget {
  const BulletinBoardPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<BulletinBoardPage> createState() => _BulletinBoardPageState();
}

class _BulletinBoardPageState extends State<BulletinBoardPage> {
  static const _blue = Color(0xFF1E5BFF);
  static const _categories = [
    'All',
    'Events',
    'System Updates',
    'Achievements',
    'Reminders',
  ];

  List<BulletinPost> _posts = [];
  String _selectedCategory = 'All';
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadPosts());
  }

  Map<String, String> _headers() {
    final token = UserSession.current?.token ?? '';
    return {
      'Content-Type': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Future<void> _loadPosts() async {
    setState(() { _loading = true; _error = null; });
    try {
      final uri = Uri.parse('${UserSession.baseUrl}/api/announcements');
      final res = await http.get(uri, headers: _headers()).timeout(const Duration(seconds: 30));
      if (res.statusCode != 200) throw Exception('Server error ${res.statusCode}');
      final list = jsonDecode(res.body) as List<dynamic>;
      _posts = list
          .map((e) => BulletinPost.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _deletePost(String id) async {
    try {
      final uri = Uri.parse('${UserSession.baseUrl}/api/announcements/$id');
      final res = await http.delete(uri, headers: _headers()).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        setState(() => _posts.removeWhere((p) => p.id == id));
      }
    } catch (_) {}
  }

  Future<void> _createPost() async {
    final titleCtrl = TextEditingController();
    final messageCtrl = TextEditingController();
    String category = 'Events';
    bool pinned = false;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setModalState) {
          return AlertDialog(
            title: const Text('Create Announcement'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Title',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: messageCtrl,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Message',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: category,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      border: OutlineInputBorder(),
                    ),
                    items: _categories
                        .where((c) => c != 'All')
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (value) =>
                        setModalState(() => category = value ?? 'Events'),
                  ),
                  const SizedBox(height: 8),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Pin Announcement'),
                    value: pinned,
                    onChanged: (value) =>
                        setModalState(() => pinned = value ?? false),
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
                  if (titleCtrl.text.trim().isEmpty ||
                      messageCtrl.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Title and message are required.')),
                    );
                    return;
                  }
                  final messenger = ScaffoldMessenger.of(context);
                  final navigator = Navigator.of(dialogContext);
                  try {
                    final now = DateTime.now();
                    final uri = Uri.parse(
                        '${UserSession.baseUrl}/api/announcements');
                    final res = await http.post(
                      uri,
                      headers: _headers(),
                      body: jsonEncode({
                        'title': titleCtrl.text.trim(),
                        'description': messageCtrl.text.trim(),
                        'category': category,
                        'pinned': pinned,
                        'date':
                            '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
                        'time':
                            '${now.hour}:${now.minute.toString().padLeft(2, '0')}',
                      }),
                    );
                    if (!mounted) return;
                    navigator.pop();
                    if (res.statusCode == 200) {
                      final created = BulletinPost.fromJson(
                          jsonDecode(res.body) as Map<String, dynamic>);
                      setState(() => _posts.insert(0, created));
                      messenger.showSnackBar(
                          const SnackBar(content: Text('Announcement saved.')));
                    } else {
                      messenger.showSnackBar(
                          SnackBar(content: Text('Failed: ${res.statusCode}')));
                    }
                  } catch (e) {
                    if (mounted) {
                      Navigator.of(dialogContext).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: $e')));
                    }
                  }
                },
                child: const Text('Post'),
              ),
            ],
          );
        },
      ),
    );
  }

  List<BulletinPost> get _filteredPosts {
    if (_selectedCategory == 'All') return _posts;
    return _posts.where((p) => p.category == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = widget.appState.isAdmin;
    final filtered = _filteredPosts;
    final pinnedPosts = filtered.where((p) => p.pinned).toList();
    final regularPosts = filtered.where((p) => !p.pinned).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: _blue,
        elevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/bewair_logo.png',
              height: 28,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 10),
            Text(
              'Bulletin',
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 22,
                letterSpacing: 1.4,
              ),
            ),
          ],
        ),
        actions: [
          if (isAdmin)
            IconButton(
              onPressed: _createPost,
              icon: const Icon(Icons.add_comment_outlined, color: Colors.white),
            ),
        ],
      ),
      body: _loading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'Loading announcements…\nServer may take a moment to wake up.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  ),
                ],
              ),
            )
          : _error != null
              ? _errorState(_error!)
              : RefreshIndicator(
                  onRefresh: _loadPosts,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(12),
                    children: [
                      _CategoryCard(
                        selected: _selectedCategory,
                        onSelected: (value) =>
                            setState(() => _selectedCategory = value),
                      ),
                      const SizedBox(height: 14),
                      if (pinnedPosts.isNotEmpty) ...[
                        const Text(
                          'Pinned Announcements',
                          style: TextStyle(
                              fontSize: 19, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 10),
                        ...pinnedPosts.map((p) => _announcementCard(p, isAdmin)),
                        const SizedBox(height: 14),
                      ],
                      const Text(
                        'Announcements',
                        style: TextStyle(
                            fontSize: 19, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 10),
                      if (regularPosts.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.campaign_outlined,
                                    size: 48, color: Colors.black26),
                                SizedBox(height: 12),
                                Text(
                                  'No announcements yet.',
                                  style: TextStyle(color: Colors.black45),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ...regularPosts.map((p) => _announcementCard(p, isAdmin)),
                    ],
                  ),
                ),
    );
  }

  Widget _announcementCard(BulletinPost post, bool isAdmin) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF8BB5FF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8DDFB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(post.category,
                    style: const TextStyle(fontSize: 12)),
              ),
              if (post.pinned) ...[
                const SizedBox(width: 6),
                const Icon(Icons.push_pin_rounded,
                    size: 14, color: Color(0xFF1E5BFF)),
              ],
              const Spacer(),
              if (isAdmin)
                GestureDetector(
                  onTap: () => _confirmDelete(post),
                  child: const Icon(Icons.delete_outline_rounded,
                      size: 18, color: Color(0xFFCBD5E1)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            post.title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(post.message,
              style: const TextStyle(color: Color(0xFF475569), height: 1.4)),
          const SizedBox(height: 10),
          Text(
            _timeAgo(post.createdAt),
            style: const TextStyle(
              color: _blue,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BulletinPost post) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete announcement?'),
        content: Text('"${post.title}" will be permanently removed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _deletePost(post.id);
            },
            child:
                const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _errorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded,
                size: 48, color: Colors.black26),
            const SizedBox(height: 12),
            const Text(
              'Could not load announcements',
              style: TextStyle(
                  fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: _loadPosts,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
            ),
          ],
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

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.selected, required this.onSelected});

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    const categories = [
      'All',
      'Events',
      'System Updates',
      'Achievements',
      'Reminders',
    ];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: categories
            .map(
              (category) => ChoiceChip(
                label: Text(category),
                selected: selected == category,
                onSelected: (_) => onSelected(category),
              ),
            )
            .toList(),
      ),
    );
  }
}
