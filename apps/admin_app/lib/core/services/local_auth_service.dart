import 'package:shared_preferences/shared_preferences.dart';

/// Manejo de re-login local con PIN.
///
/// La biometría (huella/cara) está documentada como TODO — pull-ea
/// `objective_c` que no compila en Windows cuando el path del Flutter SDK
/// tiene espacios. Volverá a activarse cuando movamos el SDK o cuando
/// `local_auth` deje de depender de `objective_c`.
///
/// El cifrado at-rest también está en pausa por el mismo motivo
/// (`flutter_secure_storage_windows` requiere `win32` 6.x). Para el MVP:
///   - El PIN se guarda como FNV-1a hash, no en claro.
///   - Las cookies HttpOnly están en cookie_jar (archivos dentro del
///     sandbox del app), inaccesibles para otras apps.
/// Cuando se quiera endurecer, basta con volver a `flutter_secure_storage`
/// y mover el SDK Flutter a una ruta sin espacios.
class LocalAuthService {
  LocalAuthService();

  static const _kPinHash = 'local_pin_hash';
  static const _kLastUser = 'local_last_user';

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  /// Por ahora siempre `false` — biometría queda como TODO.
  Future<bool> biometricsAvailable() async => false;

  Future<bool> isBiometricEnabled() async => false;

  Future<void> setBiometricEnabled(bool _) async {
    /* no-op */
  }

  Future<bool> authenticate({String? reason}) async => false;

  Future<void> setPin(String pin) async {
    final p = await _prefs;
    await p.setString(_kPinHash, _hashPin(pin));
  }

  Future<bool> verifyPin(String pin) async {
    final p = await _prefs;
    final stored = p.getString(_kPinHash);
    if (stored == null) return false;
    return stored == _hashPin(pin);
  }

  Future<bool> hasPin() async {
    final p = await _prefs;
    return p.getString(_kPinHash) != null;
  }

  Future<void> setLastUser(String username) async {
    final p = await _prefs;
    await p.setString(_kLastUser, username);
  }

  Future<String?> lastUser() async {
    final p = await _prefs;
    return p.getString(_kLastUser);
  }

  Future<void> clearAll() async {
    final p = await _prefs;
    await p.remove(_kPinHash);
    await p.remove(_kLastUser);
  }

  String _hashPin(String pin) {
    var h = 0x811c9dc5;
    for (final c in pin.codeUnits) {
      h ^= c;
      h = (h * 0x01000193) & 0xFFFFFFFF;
    }
    return h.toRadixString(16).padLeft(8, '0');
  }
}
