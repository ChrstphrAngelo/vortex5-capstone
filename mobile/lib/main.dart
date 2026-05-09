import 'package:flutter/material.dart';
import 'package:vortex5_application_2/models/user_session.dart';
import 'package:vortex5_application_2/pages/login_page.dart';
import 'package:vortex5_application_2/pages/main_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await UserSession.loadFromStorage();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: UserSession.current == null ? const LoginPage() : const MainShell(),
    );
  }
}
