import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/api/api_client.dart';
import '../../core/models/domain.dart';
import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../../core/widgets/gem_widgets.dart';

class InviteScreen extends StatefulWidget {
  final String? initialToken;
  const InviteScreen({super.key, this.initialToken});

  @override
  State<InviteScreen> createState() => _InviteScreenState();
}

class _InviteScreenState extends State<InviteScreen> {
  final _tokenCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  InvitationPreview? _preview;
  bool _loading = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialToken != null && widget.initialToken!.isNotEmpty) {
      _tokenCtrl.text = widget.initialToken!;
      // dispara preview automático.
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadPreview());
    }
  }

  @override
  void dispose() {
    _tokenCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPreview() async {
    final t = _tokenCtrl.text.trim();
    if (t.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
      _preview = null;
    });
    try {
      final p = await Locator.auth.previewInvitation(t);
      setState(() => _preview = p);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'No se pudo verificar el token.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _accept() async {
    if (_submitting) return;
    if (_preview == null || !_preview!.valid) return;
    final pwd = _passwordCtrl.text;
    if (pwd.length < 8 || pwd.length > 128) {
      setState(() => _error = 'La contraseña debe tener 8–128 caracteres.');
      return;
    }
    if (pwd != _confirmCtrl.text) {
      setState(() => _error = 'Las contraseñas no coinciden.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await Locator.auth.acceptInvitation(_tokenCtrl.text.trim(), pwd);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cuenta activada. Inicia sesión con tu usuario.'),
        ),
      );
      context.go('/login');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'No se pudo aceptar la invitación.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final preview = _preview;

    return Scaffold(
      appBar: AppBar(title: const Text('Activar invitación')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              GemCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Pega tu enlace o token',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'El ROOT te envió un enlace tipo '
                      '"aiencadmin://invite?token=...". Pégalo aquí o sólo '
                      'el token (la parte después de `token=`).',
                      style:
                          TextStyle(color: GemPalette.textMuted, height: 1.5),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _tokenCtrl,
                      decoration: InputDecoration(
                        labelText: 'Token de invitación',
                        suffixIcon: IconButton(
                          icon: _loading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.search),
                          onPressed: _loading ? null : _loadPreview,
                        ),
                      ),
                      onSubmitted: (_) => _loadPreview(),
                    ),
                  ],
                ),
              ),
              if (preview != null && preview.valid) ...[
                const SizedBox(height: 16),
                GemCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.verified_user_outlined,
                              color: GemPalette.emerald),
                          const SizedBox(width: 8),
                          Text(
                            'Invitación válida',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _InfoRow(label: 'Usuario', value: preview.username ?? '—'),
                      _InfoRow(
                          label: 'Nombre', value: preview.displayName ?? '—'),
                      _InfoRow(
                          label: 'Iglesia', value: preview.churchName ?? '—'),
                      if (preview.expiresAt != null)
                        _InfoRow(
                          label: 'Expira',
                          value: DateFormat('dd MMM yyyy, HH:mm', 'es')
                              .format(preview.expiresAt!.toLocal()),
                        ),
                      const SizedBox(height: 16),
                      Text(
                        'Define tu contraseña',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Mínimo 8 caracteres. Combina letras, números y '
                        'símbolos. No podrás recuperarla sin ayuda del ROOT.',
                        style: TextStyle(
                          color: GemPalette.textMuted,
                          fontSize: 12.5,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nueva contraseña',
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _confirmCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Confirmar contraseña',
                        ),
                        obscureText: true,
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        GemErrorBanner(message: _error!),
                      ],
                      const SizedBox(height: 16),
                      GemPrimaryButton(
                        label: 'Activar cuenta',
                        loading: _submitting,
                        onPressed: _accept,
                      ),
                    ],
                  ),
                ),
              ] else if (preview != null && !preview.valid) ...[
                const SizedBox(height: 16),
                GemErrorBanner(
                  message: switch (preview.status) {
                    'ACCEPTED' =>
                      'Esta invitación ya fue aceptada. Inicia sesión normalmente.',
                    'REVOKED' => 'Esta invitación fue revocada.',
                    'EXPIRED' =>
                      'Esta invitación expiró. Solicita una nueva al ROOT.',
                    _ => 'Esta invitación no está disponible.',
                  },
                ),
              ] else if (_error != null) ...[
                const SizedBox(height: 16),
                GemErrorBanner(message: _error!),
              ],
              const SizedBox(height: 18),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Ya tengo cuenta — iniciar sesión'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label,
                style: const TextStyle(
                    color: GemPalette.textMuted, fontSize: 12.5)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
