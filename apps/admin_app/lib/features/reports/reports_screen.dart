import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/models/domain.dart';
import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../../core/widgets/gem_widgets.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  List<Report> _items = [];
  bool _loading = true;
  String? _error;
  ReportType? _filterType;

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
      final res = await Locator.reports.list(
        churchId: Locator.authState.activeChurchId,
        type: _filterType,
      );
      if (mounted) setState(() => _items = res.items);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
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
          child: Text('Informes',
              style: Theme.of(context).textTheme.headlineSmall),
        ),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: [
              _typePill(null, 'Todos'),
              for (final t in ReportType.values)
                _typePill(t, reportTypeLabels[t] ?? t.name),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null && _items.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: GemErrorBanner(message: _error!),
                    )
                  : _items.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'No hay informes para este filtro. Usa el botón "Nuevo informe" para crear el primero.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: GemPalette.textMuted),
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding:
                                const EdgeInsets.fromLTRB(16, 8, 16, 90),
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemCount: _items.length,
                            itemBuilder: (_, i) =>
                                _ReportTile(report: _items[i]),
                          ),
                        ),
        ),
      ],
    );
  }

  Widget _typePill(ReportType? t, String label) {
    final selected = _filterType == t;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Center(
        child: GemPill(
          label: label,
          selected: selected,
          onTap: () {
            setState(() => _filterType = t);
            _load();
          },
        ),
      ),
    );
  }
}

class _ReportTile extends StatelessWidget {
  final Report report;
  const _ReportTile({required this.report});

  @override
  Widget build(BuildContext context) {
    return GemCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GemBadge(
                label: reportTypeLabels[report.reportType] ??
                    report.reportType.name,
                color: _colorFor(report.reportType),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  report.title,
                  style: Theme.of(context).textTheme.titleMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (_describe() != null)
            Text(
              _describe()!,
              style: const TextStyle(
                  color: GemPalette.textMuted, fontSize: 13, height: 1.4),
            ),
          const SizedBox(height: 6),
          Text(
            '${DateFormat('d MMM yyyy', 'es').format(report.periodStart)} – '
            '${DateFormat('d MMM yyyy', 'es').format(report.periodEnd)}',
            style: const TextStyle(
                color: GemPalette.textMuted, fontSize: 11.5),
          ),
          const SizedBox(height: 2),
          if (report.churchName != null)
            Text(
              report.churchName!,
              style: const TextStyle(
                color: GemPalette.emerald,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }

  Color _colorFor(ReportType t) => switch (t) {
        ReportType.OFFERINGS => GemPalette.emerald,
        ReportType.EXPENSES => GemPalette.ruby,
        ReportType.ATTENDANCE => GemPalette.sapphire,
        ReportType.EVENT => GemPalette.topaz,
        ReportType.REQUEST => GemPalette.amethyst,
        ReportType.OTHER => GemPalette.textMuted,
      };

  String? _describe() {
    final d = report.data;
    final cop = NumberFormat.currency(
        locale: 'es-CO', symbol: r'$', decimalDigits: 0);
    switch (report.reportType) {
      case ReportType.OFFERINGS:
        final v = d['totalCop'];
        return v != null ? cop.format(v) : null;
      case ReportType.EXPENSES:
        final v = d['totalCop'];
        final cat = d['category'] as String?;
        final amount = v != null ? cop.format(v) : null;
        final catLabel = cat != null
            ? expenseCategoryLabels[
                ExpenseCategory.values.firstWhere(
                  (e) => e.name == cat,
                  orElse: () => ExpenseCategory.OTHER,
                )]
            : null;
        return [catLabel, amount].whereType<String>().join(' · ');
      case ReportType.ATTENDANCE:
        final count = d['count'];
        final scope = d['scope'] == 'session' ? 'culto' : 'mensual';
        return count != null ? '$count asistentes ($scope)' : null;
      case ReportType.EVENT:
        return d['name'] as String?;
      case ReportType.REQUEST:
        final st = d['status'] as String?;
        final subj = d['subject'] as String?;
        final stLabel = st != null
            ? requestStatusLabels[
                RequestStatus.values.firstWhere(
                  (e) => e.name == st,
                  orElse: () => RequestStatus.PENDING,
                )]
            : null;
        return [subj, stLabel].whereType<String>().join(' · ');
      case ReportType.OTHER:
        final ft = d['freeText'] as String?;
        if (ft == null) return null;
        return ft.length > 80 ? '${ft.substring(0, 80)}…' : ft;
    }
  }
}
