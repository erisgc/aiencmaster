import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../dashboard/dashboard_screen.dart';
import '../announcements/announcements_screen.dart';
import '../churches/churches_screen.dart';
import '../reports/reports_screen.dart';
import '../security/security_screen.dart';

/// Shell con barra inferior. Las cinco secciones se mantienen montadas
/// vía IndexedStack para preservar scroll y estado de cada feature.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _idx = 0;

  @override
  Widget build(BuildContext context) {
    final account = Locator.authState.account;
    final isRoot = account?.isRoot ?? false;

    final tabs = <_NavTab>[
      _NavTab(
        icon: Icons.insights_outlined,
        activeIcon: Icons.insights,
        label: 'Métricas',
        child: const DashboardScreen(),
      ),
      _NavTab(
        icon: Icons.campaign_outlined,
        activeIcon: Icons.campaign,
        label: 'Anuncios',
        child: const AnnouncementsScreen(),
      ),
      _NavTab(
        icon: Icons.church_outlined,
        activeIcon: Icons.church,
        label: 'Iglesias',
        child: const ChurchesScreen(),
      ),
      _NavTab(
        icon: Icons.assignment_outlined,
        activeIcon: Icons.assignment,
        label: 'Informes',
        child: const ReportsScreen(),
      ),
      if (isRoot)
        _NavTab(
          icon: Icons.shield_outlined,
          activeIcon: Icons.shield,
          label: 'Seguridad',
          child: const SecurityScreen(),
        ),
    ];

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: IndexedStack(
          index: _idx,
          children: tabs.map((t) => t.child).toList(),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: GemPalette.surfaceElevated,
          border: Border(
            top: BorderSide(color: GemPalette.borderSoft),
          ),
        ),
        child: SafeArea(
          top: false,
          child: NavigationBarTheme(
            data: NavigationBarThemeData(
              backgroundColor: Colors.transparent,
              indicatorColor: GemPalette.sapphire.withValues(alpha: 0.25),
              labelTextStyle: WidgetStateProperty.all(
                const TextStyle(
                    fontSize: 11.5, fontWeight: FontWeight.w600),
              ),
            ),
            child: NavigationBar(
              selectedIndex: _idx < tabs.length ? _idx : 0,
              onDestinationSelected: (i) => setState(() => _idx = i),
              destinations: [
                for (final t in tabs)
                  NavigationDestination(
                    icon: Icon(t.icon),
                    selectedIcon: Icon(t.activeIcon),
                    label: t.label,
                  ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: _idx == 3
          ? FloatingActionButton.extended(
              backgroundColor: GemPalette.emerald,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text('Nuevo informe'),
              onPressed: () => context.push('/reports/new'),
            )
          : null,
    );
  }
}

class _NavTab {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final Widget child;
  _NavTab({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.child,
  });
}
