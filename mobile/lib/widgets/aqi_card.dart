import 'package:flutter/material.dart';

class AqiCard extends StatelessWidget {
  final int aqi;
  final String status;
  final String updatedTime;
  final double progress;
  final Color color;

  const AqiCard({
    super.key,
    required this.aqi,
    required this.status,
    required this.updatedTime,
    required this.progress,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color.fromARGB(255, 169, 172, 177), Color(0xFF1E222C)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 120,
                height: 120,
                child: CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 10,
                  backgroundColor: Colors.grey.shade800,
                  valueColor: AlwaysStoppedAnimation(color),
                ),
              ),
              Text(
                aqi.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('🙂', style: TextStyle(fontSize: 28)),
          const SizedBox(height: 6),
          Text(
            status,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Air Quality Index',
            style: TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 4),
          Text(
            updatedTime,
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
