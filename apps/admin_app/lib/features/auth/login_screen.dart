import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/state/locator.dart';
import '../../core/theme/gem_palette.dart';
import '../../core/widgets/gem_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Pre-cargar último usuario para conveniencia.
    Locator.localAuth.lastUser().then((u) {
      if (u != null && mounted) _usernameCtrl.text = u;
    });
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final session = await Locator.auth.login(
        username: _usernameCtrl.text.trim(),
        password: _passwordCtrl.text,
      );
      if (session.status != 'ACTIVE' || session.account == null) {
        setState(() => _error = 'No se pudo iniciar sesión.');
        return;
      }
      await Locator.authState.onLoginSuccess(session.account!);
      if (!mounted) return;
      // Tras login, ofrecer configurar biometría/PIN o ir directo al home.
      context.go('/setup-lock');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Error inesperado. Intenta de nuevo.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar sesión')),
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
                      'Accede con tu cuenta',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Usa el usuario y la contraseña que configuraste al '
                      'aceptar tu invitación.',
                      style: TextStyle(
                        color: GemPalette.textMuted,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 18),
                    TextField(
                      controller: _usernameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Usuario',
                        hintText: 'pastor.juan',
                      ),
                      autocorrect: false,
                      textCapitalization: TextCapitalization.none,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _passwordCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Contraseña',
                      ),
                      obscureText: true,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      GemErrorBanner(message: _error!),
                    ],
                    const SizedBox(height: 18),
                    GemPrimaryButton(
                      label: 'Entrar',
                      loading: _submitting,
                      onPressed: _submit,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              TextButton(
                onPressed: () => context.go('/invite'),
                child: const Text('Tengo una invitación nueva'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
