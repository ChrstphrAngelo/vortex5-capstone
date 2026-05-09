class BulletinPost {
  final String id;
  final String title;
  final String message;
  final String category;
  final bool pinned;
  final DateTime createdAt;

  const BulletinPost({
    required this.id,
    required this.title,
    required this.message,
    required this.category,
    required this.pinned,
    required this.createdAt,
  });

  factory BulletinPost.fromJson(Map<String, dynamic> json) {
    return BulletinPost(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General',
      pinned: json['pinned'] == true,
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'message': message,
    'category': category,
    'pinned': pinned,
    'createdAt': createdAt.toIso8601String(),
  };
}
