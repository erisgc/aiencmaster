import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'core/router.dart';
import 'core/state/locator.dart';
import 'core/theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0B1220),
    ),
  );
  await initializeDateFormatting('es');
  await Locator.init();
  await Locator.authState.bootstrap();
  runApp(const AdminApp());
}

class AdminApp extends StatefulWidget {
  const AdminApp({super.key});

  @override
  State<AdminApp> createState() => _AdminAppState();
}

class _AdminAppState extends State<AdminApp> {
  late final GoRouter _router;
  late final AppLinks _appLinks;

  @override
  void initState() {
    super.initState();
    _router = buildRouter();
    _appLinks = AppLinks();

    // Deep link inicial (app abierta vía aiencadmin://invite?token=...).
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) _handleDeepLink(uri);
    });
    // Deep link entrante mientras la app está corriendo.
    _appLinks.uriLinkStream.listen(_handleDeepLink);
  }

  void _handleDeepLink(Uri uri) {
    if (uri.scheme != 'aiencadmin') return;
    if (uri.host == 'invite') {
      final token = uri.queryParameters['token'];
      _router.go('/invite?token=${token ?? ''}');
    } else {
      _router.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AIENC Admin',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.build(),
      routerConfig: _router,
    );
  }
}
