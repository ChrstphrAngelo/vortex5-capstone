import 'package:flutter/material.dart';
import 'metric_card.dart';

class MetricsRow extends StatelessWidget {
  const MetricsRow({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: const [
        MetricCard(
          icon: Icons.thermostat,
          iconColor: Colors.redAccent,
          value: '24.0°C',
          label: 'Temperature',
        ),
        MetricCard(
          icon: Icons.water_drop,
          iconColor: Colors.lightBlueAccent,
          value: '55%',
          label: 'Humidity',
        ),
        MetricCard(
          icon: Icons.air,
          iconColor: Colors.orangeAccent,
          value: '34.4',
          label: 'PM2.5 µg/m³',
        ),
        MetricCard(
          icon: Icons.blur_on,
          iconColor: Colors.purpleAccent,
          value: '42.4',
          label: 'PM10 µg/m³',
        ),
      ],
    );
  }
}
