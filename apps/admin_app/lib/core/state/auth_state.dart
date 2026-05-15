import 'package:flutter/foundation.dart';

import '../models/domain.dart';
import '../services/auth_service.dart';
import '../services/local_auth_service.dart';

/// Estado global de autenticación.
///
/// La fuente de verdad para "estoy logueado" es la cookie HttpOnly que el
/// backend setea en /admin/auth/login. Cuando arranca la app, llamamos a
/// /admin/session para saber si la cookie sigue siendo válida.
///
/// `locked` indica que tenemos sesión válida pero el usuario debe pasar
/// el bloqueo local (biometría / PIN) antes de ver el panel.
enum AuthPhase {
  /// Aún no sabemos qué hacer (esperando /admin/session).
  loading,

  /// No hay sesión, hay que loguear o aceptar invitación.
  signedOut,

  /// Hay cookies válidas pero el usuario tiene biometría/PIN activos
  /// y todavía no ha desbloqueado en este arranque.
  locked,

  /// Listo: pantallas de la app son accesibles.
  authenticated,
}

class AuthState extends ChangeNotifier {
  AuthState({required AuthService auth, required LocalAuthService localAuth})
      : _auth = auth,
        _localAuth = localAuth;

  final AuthService _auth;
  final LocalAuthService _localAuth;

  AuthPhase _phase = AuthPhase.loading;
  AuthPhase get phase => _phase;

  AdminAccount? _account;
  AdminAccount? get account => _account;

  String? _activeChurchId;
  String? get activeChurchId => _activeChurchId;
  set activeChurchId(String? id) {
    _activeChurchId = id;
    notifyListeners();
  }

  /// Llamado al arrancar la app — comprueba si hay cookies válidas.
  Future<void> bootstrap() async {
    _phase = AuthPhase.loading;
    notifyListeners();

    try {
      final session = await _auth.getSession();
      if (session.status == 'ACTIVE' && session.account != null) {
        _account = session.account;
        _selectDefaultChurch();

        final pinSet = await _localAuth.hasPin();
        final bioEnabled = await _localAuth.isBiometricEnabled();
        if (pinSet || bioEnabled) {
          _phase = AuthPhase.locked;
        } else {
          _phase = AuthPhase.authenticated;
        }
      } else {
        _account = null;
        _activeChurchId = null;
        _phase = AuthPhase.signedOut;
      }
    } catch (_) {
      _account = null;
      _activeChurchId = null;
      _phase = AuthPhase.signedOut;
    }
    notifyListeners();
  }

  /// Tras login exitoso. Si el dispositivo tiene biometría disponible o el
  /// usuario ya configuró un PIN, queda autenticado de inmediato (acaba de
  /// pasar contraseña). El opt-in al re-login local lo configura aparte.
  Future<void> onLoginSuccess(AdminAccount account) async {
    _account = account;
    _selectDefaultChurch();
    await _localAuth.setLastUser(account.username);
    _phase = AuthPhase.authenticated;
    notifyListeners();
  }

  Future<void> unlock() async {
    if (_account == null) return;
    _phase = AuthPhase.authenticated;
    notifyListeners();
  }

  Future<void> lock() async {
    if (_account == null) return;
    _phase = AuthPhase.locked;
    notifyListeners();
  }

  Future<void> signOut() async {
    await _auth.logout();
    await _localAuth.clearAll();
    _account = null;
    _activeChurchId = null;
    _phase = AuthPhase.signedOut;
    notifyListeners();
  }

  void _selectDefaultChurch() {
    final a = _account;
    if (a == null) return;
    if (a.churchAssignments.isNotEmpty) {
      _activeChurchId ??= a.churchAssignments.first.churchId;
    } else if (a.isRoot) {
      _activeChurchId = null; // ROOT puede ver todo
    }
  }
}
