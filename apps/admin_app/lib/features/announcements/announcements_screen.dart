import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/api/api_client.dart';
import '../../core/models/domain.dart';
import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../../core/widgets/gem_widgets.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Announcement> _global = [];
  List<Announcement> _church = [];
  bool _loadingGlobal = true;
  bool _loadingChurch = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loadingGlobal = true;
      _loadingChurch = true;
      _error = null;
    });
    try {
      final g = await Locator.announcements.listGlobal();
      if (mounted) setState(() => _global = g);
    } catch (e) {
      if (mounted) setState(() => _error = userMessageFor(e));
    } finally {
      if (mounted) setState(() => _loadingGlobal = false);
    }

    final churchId = Locator.authState.activeChurchId;
    if (churchId != null) {
      try {
        final c = await Locator.announcements.listForChurch(churchId);
        if (mounted) setState(() => _church = c);
      } catch (_) {
        // si no tiene permisos, deja vacío
      } finally {
        if (mounted) setState(() => _loadingChurch = false);
      }
    } else {
      if (mounted) setState(() => _loadingChurch = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
          alignment: Alignment.centerLeft,
          child: Text('Anuncios',
              style: Theme.of(context).textTheme.headlineSmall),
        ),
        TabBar(
          controller: _tabs,
          indicatorColor: GemPalette.emerald,
          labelColor: GemPalette.textPrimary,
          unselectedLabelColor: GemPalette.textMuted,
          tabs: const [
            Tab(text: 'Globales'),
            Tab(text: 'Mi iglesia'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _buildList(_global, _loadingGlobal, isGlobal: true),
              _buildList(_church, _loadingChurch, isGlobal: false),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildList(List<Announcement> items, bool loading,
      {required bool isGlobal}) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (_error != null && items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: GemErrorBanner(message: _error!),
      );
    }
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            isGlobal
                ? 'Aún no hay anuncios globales publicados.'
                : 'Aún no hay anuncios para esta iglesia.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: GemPalette.textMuted),
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemCount: items.length,
        itemBuilder: (_, i) => _AnnouncementCard(item: items[i]),
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final Announcement item;
  const _AnnouncementCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return GemCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              Text(
                DateFormat('d MMM', 'es').format(item.createdAt),
                style: const TextStyle(
                    color: GemPalette.textMuted, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Por ${item.author}',
            style: const TextStyle(
              color: GemPalette.emerald,
              fontWeight: FontWeight.w700,
              fontSize: 12.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(item.description,
              style: Theme.of(context).textTheme.bodyMedium),
          if (item.attachments.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final a in item.attachments)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: GemPalette.emerald.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      '📎 ${a.name.isNotEmpty ? a.name : a.format.toUpperCase()}',
                      style: const TextStyle(
                          color: GemPalette.emerald, fontSize: 12),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
