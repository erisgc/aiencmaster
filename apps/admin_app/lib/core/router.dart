import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/welcome_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/invite_screen.dart';
import '../features/auth/lock_screen.dart';
import '../features/auth/setup_lock_screen.dart';
import '../features/churches/church_edit_screen.dart';
import '../features/reports/new_report_screen.dart';
import '../features/shell/home_shell.dart';
import 'state/auth_state.dart';
import 'state/locator.dart';

GoRouter buildRouter() {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: Locator.authState,
    redirect: (context, state) {
      final phase = Locator.authState.phase;
      final loc = state.matchedLocation;

      // Splash mientras bootstrap corre.
      if (phase == AuthPhase.loading) return '/splash';

      // Sin sesión: sólo accesibles welcome/login/invite/splash.
      if (phase == AuthPhase.signedOut) {
        final allowed = {'/welcome', '/login', '/invite', '/splash'};
        if (allowed.contains(loc)) return null;
        return '/welcome';
      }

      // Locked: forzar /lock.
      if (phase == AuthPhase.locked) {
        if (loc == '/lock') return null;
        return '/lock';
      }

      // Authenticated: prohibir pantallas de auth.
      final authPaths = {'/welcome', '/login', '/invite', '/splash', '/lock'};
      if (authPaths.contains(loc)) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const _Splash()),
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/invite',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'];
          return InviteScreen(initialToken: token);
        },
      ),
      GoRoute(path: '/lock', builder: (_, __) => const LockScreen()),
      GoRoute(
          path: '/setup-lock',
          builder: (_, __) => const SetupLockScreen()),
      GoRoute(path: '/', builder: (_, __) => const HomeShell()),
      GoRoute(
        path: '/reports/new',
        builder: (_, __) => const NewReportScreen(),
      ),
      GoRoute(
        path: '/churches/:id/edit',
        builder: (_, state) =>
            ChurchEditScreen(churchId: state.pathParameters['id']!),
      ),
    ],
  );
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
}
