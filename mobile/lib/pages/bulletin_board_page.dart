import 'package:flutter/material.dart';
import 'package:vortex5_application_2/models/bulletin_post.dart';
import 'package:vortex5_application_2/services/local_storage_service.dart';

class BulletinBoardPage extends StatefulWidget {
  const BulletinBoardPage({super.key});

  @override
  State<BulletinBoardPage> createState() => _BulletinBoardPageState();
}

class _BulletinBoardPageState extends State<BulletinBoardPage> {
  static const _storageKey = 'bulletin_posts';
  static const _categories = [
    'All',
    'Events',
    'System Updates',
    'Achievements',
    'Reminders',
  ];

  List<BulletinPost> _posts = const [];
  String _selectedCategory = 'All';

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    final saved = await LocalStorageService.loadJsonList(_storageKey);
    if (saved.isEmpty) {
      _posts = _defaultPosts;
      await _persistPosts();
    } else {
      _posts = saved.map(BulletinPost.fromJson).toList();
    }
    if (mounted) setState(() {});
  }

  Future<void> _persistPosts() async {
    await LocalStorageService.saveJsonList(
      _storageKey,
      _posts.map((post) => post.toJson()).toList(),
    );
  }

  List<BulletinPost> get _filteredPosts {
    if (_selectedCategory == 'All') return _posts;
    return _posts.where((post) => post.category == _selectedCategory).toList();
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
                        .where((item) => item != 'All')
                        .map(
                          (item) =>
                              DropdownMenuItem(value: item, child: Text(item)),
                        )
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
                  final messenger = ScaffoldMessenger.of(context);
                  final navigator = Navigator.of(dialogContext);
                  if (titleCtrl.text.trim().isEmpty ||
                      messageCtrl.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Title and message are required.'),
                      ),
                    );
                    return;
                  }

                  _posts = [
                    BulletinPost(
                      id: DateTime.now().microsecondsSinceEpoch.toString(),
                      title: titleCtrl.text.trim(),
                      message: messageCtrl.text.trim(),
                      category: category,
                      pinned: pinned,
                      createdAt: DateTime.now(),
                    ),
                    ..._posts,
                  ];
                  await _persistPosts();
                  if (!mounted) return;
                  navigator.pop();
                  setState(() {});
                  messenger.showSnackBar(const SnackBar(content: Text('Announcement saved.')));
                },
                child: const Text('Post'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pinnedPosts = _filteredPosts.where((post) => post.pinned).toList();
    final regularPosts = _filteredPosts.where((post) => !post.pinned).toList();

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
        actions: [
          IconButton(
            onPressed: _createPost,
            icon: const Icon(Icons.add_comment_outlined, color: Colors.white),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          const Text(
            'Bulletin Board',
            style: TextStyle(fontSize: 34, fontWeight: FontWeight.w700),
          ),
          const Text(
            'School-wide announcements and updates',
            style: TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 12),
          const _HeroCard(),
          const SizedBox(height: 14),
          _CategoryCard(
            selected: _selectedCategory,
            onSelected: (value) => setState(() => _selectedCategory = value),
          ),
          const SizedBox(height: 14),
          if (pinnedPosts.isNotEmpty) ...[
            const Text(
              'Pinned Announcements',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            ...pinnedPosts.map(_announcementCard),
            const SizedBox(height: 14),
          ],
          const Text(
            'School Updates',
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (regularPosts.isEmpty)
            const Text(
              'No announcements in this category yet.',
              style: TextStyle(color: Colors.black54),
            ),
          ...regularPosts.map(_announcementCard),
          const SizedBox(height: 12),
          const _StayUpdatedCard(),
        ],
      ),
    );
  }

  Widget _announcementCard(BulletinPost post) {
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFE8DDFB),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(post.category, style: const TextStyle(fontSize: 12)),
          ),
          const SizedBox(height: 8),
          Text(
            post.title,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(post.message),
          const SizedBox(height: 10),
          Text(
            _timeAgo(post.createdAt),
            style: const TextStyle(
              color: Color(0xFF1E5BFF),
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
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

class _HeroCard extends StatelessWidget {
  const _HeroCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF355CFF), Color(0xFFA020F0)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Text(
        'Welcome to AirWatch!\nStay informed about air quality in your classrooms. Check here regularly for important updates and environmental tips.',
        style: TextStyle(
          color: Colors.white,
          fontSize: 22,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
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

class _StayUpdatedCard extends StatelessWidget {
  const _StayUpdatedCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF5FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFB5D0FF)),
      ),
      child: const Text(
        'Stay Updated\nEnable notifications to receive important announcements instantly.',
      ),
    );
  }
}

final _defaultPosts = [
  BulletinPost(
    id: 'post1',
    title: 'Air Quality Awareness Week',
    message:
        'Join us for Air Quality Awareness Week! Learn the importance of clean air.',
    category: 'Events',
    pinned: true,
    createdAt: DateTime(2026, 3, 20),
  ),
  BulletinPost(
    id: 'post2',
    title: 'New Air Quality Thresholds',
    message:
        'We have updated our air quality monitoring thresholds to align with the latest school guidelines.',
    category: 'System Updates',
    pinned: true,
    createdAt: DateTime(2026, 3, 19),
  ),
  BulletinPost(
    id: 'post3',
    title: 'Reminder: Window Ventilation Protocol',
    message:
        'Please open classroom windows during breaks and between classes whenever possible.',
    category: 'Reminders',
    pinned: false,
    createdAt: DateTime(2026, 3, 18),
  ),
  BulletinPost(
    id: 'post4',
    title: 'Environmental Club Recognition',
    message:
        'Congratulations to the Environmental Club for their clean air campaign success.',
    category: 'Achievements',
    pinned: false,
    createdAt: DateTime(2026, 3, 17),
  ),
];
