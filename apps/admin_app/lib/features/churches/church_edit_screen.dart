import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/models/domain.dart';
import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../../core/widgets/gem_widgets.dart';

/// Edición de iglesia. Acepta sólo campos de texto/numéricos — las imágenes
/// (logo + portada) se gestionan desde la web por la ergonomía de
/// cropping/recortado. Eliminar la iglesia también queda en la web (es una
/// acción destructiva poco frecuente).
class ChurchEditScreen extends StatefulWidget {
  final String churchId;
  const ChurchEditScreen({super.key, required this.churchId});

  @override
  State<ChurchEditScreen> createState() => _ChurchEditScreenState();
}

class _ChurchEditScreenState extends State<ChurchEditScreen> {
  Church? _initial;
  final _nameCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _repsCtrl = TextEditingController();
  final _avgAttendanceCtrl = TextEditingController();
  bool _isActive = true;

  bool _loading = true;
  bool _saving = false;
  bool _toggling = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _cityCtrl.dispose();
    _addressCtrl.dispose();
    _repsCtrl.dispose();
    _avgAttendanceCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final c = await Locator.churches.get(widget.churchId);
      _initial = c;
      _nameCtrl.text = c.name;
      _cityCtrl.text = c.city;
      _addressCtrl.text = c.address ?? '';
      _repsCtrl.text = c.representatives ?? '';
      _avgAttendanceCtrl.text =
          c.avgAttendance != null ? c.avgAttendance.toString() : '';
      _isActive = c.isActive;
    } catch (e) {
      _error = userMessageFor(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (_saving) return;
    final name = _nameCtrl.text.trim();
    final city = _cityCtrl.text.trim();
    if (name.isEmpty || city.isEmpty) {
      setState(() => _error = 'Nombre y ciudad son obligatorios.');
      return;
    }
    int? avg;
    if (_avgAttendanceCtrl.text.trim().isNotEmpty) {
      avg = int.tryParse(_avgAttendanceCtrl.text.trim());
      if (avg == null || avg < 0) {
        setState(() => _error = 'Asistencia promedio inválida.');
        return;
      }
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final updated = await Locator.churches.update(
        widget.churchId,
        name: name,
        city: city,
        address: _addressCtrl.text.trim(),
        representatives: _repsCtrl.text.trim(),
        avgAttendance: avg,
        isActive: _isActive,
      );
      _initial = updated;
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cambios guardados.')),
      );
      context.pop(true);
    } catch (e) {
      setState(() => _error = userMessageFor(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _toggle() async {
    if (_toggling) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          _isActive ? 'Marcar como inactiva' : 'Reactivar iglesia',
        ),
        content: Text(
          _isActive
              ? '¿Confirmas que esta iglesia ya no está activa? Dejará de aparecer en el listado público.'
              : '¿Reactivar esta iglesia para que vuelva a aparecer en el listado público?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _toggling = true);
    try {
      final updated = await Locator.churches.toggleActive(widget.churchId);
      setState(() {
        _initial = updated;
        _isActive = updated.isActive;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(updated.isActive
              ? 'Iglesia reactivada.'
              : 'Iglesia marcada como inactiva.'),
        ),
      );
    } catch (e) {
      setState(() => _error = userMessageFor(e));
    } finally {
      if (mounted) setState(() => _toggling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_initial?.name ?? 'Editar iglesia'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    GemCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('Datos generales',
                              style:
                                  Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _nameCtrl,
                            decoration:
                                const InputDecoration(labelText: 'Nombre'),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _cityCtrl,
                            decoration:
                                const InputDecoration(labelText: 'Ciudad'),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _addressCtrl,
                            decoration: const InputDecoration(
                                labelText: 'Dirección (opcional)'),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _repsCtrl,
                            decoration: const InputDecoration(
                                labelText: 'Representantes (opcional)'),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _avgAttendanceCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Asistencia promedio (opcional)',
                              hintText: 'Ej: 120',
                            ),
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                          ),
                          const SizedBox(height: 16),
                          SwitchListTile.adaptive(
                            contentPadding: EdgeInsets.zero,
                            value: _isActive,
                            onChanged: (v) => setState(() => _isActive = v),
                            title: const Text('Iglesia activa'),
                            subtitle: const Text(
                              'Si está inactiva no aparece en el listado público.',
                              style: TextStyle(
                                  color: GemPalette.textMuted, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      GemErrorBanner(message: _error!),
                    ],
                    const SizedBox(height: 16),
                    GemPrimaryButton(
                      label: 'Guardar cambios',
                      loading: _saving,
                      onPressed: _save,
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      icon: Icon(_isActive
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined),
                      label: Text(_isActive
                          ? 'Marcar como inactiva'
                          : 'Reactivar iglesia'),
                      onPressed: _toggling ? null : _toggle,
                    ),
                    const SizedBox(height: 16),
                    GemCard(
                      gradientBorder: false,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Información disponible solo en la web',
                              style:
                                  Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 6),
                          const Text(
                            'Para subir imágenes (logo y portada), fijar la '
                            'ubicación en el mapa o gestionar el equipo de '
                            'directores, abre esta iglesia desde el panel web.',
                            style: TextStyle(
                                color: GemPalette.textMuted, height: 1.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
