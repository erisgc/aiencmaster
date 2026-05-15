import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/models/domain.dart';
import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../../core/widgets/gem_widgets.dart';

class ChurchesScreen extends StatefulWidget {
  const ChurchesScreen({super.key});

  @override
  State<ChurchesScreen> createState() => _ChurchesScreenState();
}

class _ChurchesScreenState extends State<ChurchesScreen> {
  List<Church> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await Locator.churches.list();
      if (mounted) setState(() => _items = list);
    } catch (e) {
      if (mounted) setState(() => _error = userMessageFor(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
          child: Text('Iglesias',
              style: Theme.of(context).textTheme.headlineSmall),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: GemErrorBanner(message: _error!),
                    )
                  : _items.isEmpty
                      ? const Center(
                          child: Text('No hay iglesias registradas todavía.',
                              style:
                                  TextStyle(color: GemPalette.textMuted)),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding:
                                const EdgeInsets.fromLTRB(16, 12, 16, 90),
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemCount: _items.length,
                            itemBuilder: (_, i) =>
                                _ChurchTile(church: _items[i]),
                          ),
                        ),
        ),
      ],
    );
  }
}

class _ChurchTile extends StatelessWidget {
  final Church church;
  const _ChurchTile({required this.church});

  @override
  Widget build(BuildContext context) {
    return GemCard(
      padding: const EdgeInsets.all(14),
      onTap: () {
        // Por ahora la app sólo muestra info. Edición vendrá en una siguiente
        // pasada para evitar inflar el MVP.
      },
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: GemPalette.surfaceElevated,
              image: church.mainImageUrl != null
                  ? DecorationImage(
                      image: NetworkImage(church.mainImageUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            alignment: Alignment.center,
            child: church.mainImageUrl == null
                ? const Icon(Icons.church, color: GemPalette.textMuted)
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(church.name,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(
                  church.city,
                  style: const TextStyle(
                      color: GemPalette.textMuted, fontSize: 12.5),
                ),
                if (church.avgAttendance != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Asistencia promedio: ${church.avgAttendance}',
                    style: const TextStyle(
                        color: GemPalette.textMuted, fontSize: 11.5),
                  ),
                ],
              ],
            ),
          ),
          GemBadge(
            label: church.isActive ? 'ACTIVA' : 'INACTIVA',
            color: church.isActive ? GemPalette.emerald : GemPalette.danger,
          ),
        ],
      ),
    );
  }
}
