import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';

import '../config/app_config.dart';

/// Wrapper sobre Dio con:
///   - cookie jar persistente en disco (las cookies HttpOnly admin_session
///     y admin_device sobreviven a reinicios de la app).
///   - header Origin obligatorio para pasar AdminOriginGuard.
///   - timeouts razonables y mapping uniforme de errores.
///
/// Una sola instancia singleton se crea en [ApiClient.init] al arrancar.
class ApiClient {
  ApiClient._(this._dio);

  static ApiClient? _instance;
  static ApiClient get I {
    final v = _instance;
    if (v == null) {
      throw StateError('ApiClient.init() no ha sido llamado todavía');
    }
    return v;
  }

  final Dio _dio;
  Dio get dio => _dio;

  static Future<void> init() async {
    if (_instance != null) return;

    final cookiesDir = await _cookieDir();
    final jar = PersistCookieJar(
      ignoreExpires: false,
      storage: FileStorage(cookiesDir),
    );

    final dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 12),
      sendTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      headers: <String, dynamic>{
        HttpHeaders.acceptHeader: 'application/json',
        HttpHeaders.contentTypeHeader: 'application/json',
        // Origin que el AdminOriginGuard espera para mutaciones.
        'Origin': AppConfig.mobileOrigin,
        HttpHeaders.userAgentHeader: AppConfig.userAgentTag,
      },
      validateStatus: (s) => s != null && s >= 200 && s < 600,
    ));

    dio.interceptors.add(CookieManager(jar));
    dio.interceptors.add(_ErrorMappingInterceptor());

    _instance = ApiClient._(dio);
    _instance!._jar = jar;
  }

  late final PersistCookieJar _jar;

  /// Borra todas las cookies persistentes (logout local).
  Future<void> clearCookies() async {
    await _jar.deleteAll();
  }

  static Future<String> _cookieDir() async {
    final base = await getApplicationSupportDirectory();
    final dir = Directory('${base.path}/aienc_cookies');
    if (!dir.existsSync()) dir.createSync(recursive: true);
    return dir.path;
  }

  /// Helper GET tipado.
  Future<T> getJson<T>(String path, {Map<String, dynamic>? query}) async {
    final res =
        await _dio.get(path, queryParameters: query);
    _ensureOk(res);
    return res.data as T;
  }

  /// Helper POST tipado.
  Future<T> postJson<T>(String path, {Object? body}) async {
    final res = await _dio.post(path, data: body);
    _ensureOk(res);
    return res.data as T;
  }

  Future<T> patchJson<T>(String path, {Object? body}) async {
    final res = await _dio.patch(path, data: body);
    _ensureOk(res);
    return res.data as T;
  }

  Future<T> putJson<T>(String path, {Object? body}) async {
    final res = await _dio.put(path, data: body);
    _ensureOk(res);
    return res.data as T;
  }

  Future<T> deleteJson<T>(String path) async {
    final res = await _dio.delete(path);
    _ensureOk(res);
    return res.data as T;
  }

  void _ensureOk(Response res) {
    final code = res.statusCode ?? 0;
    if (code >= 200 && code < 300) return;
    throw ApiException.fromResponse(res);
  }
}

/// Excepción tipada que mapea los códigos HTTP a mensajes legibles en
/// español, igual que la web (`apps/web/app/lib/admin-*.ts`).
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic raw;

  ApiException(this.statusCode, this.message, {this.raw});

  factory ApiException.fromResponse(Response res) {
    final code = res.statusCode ?? 0;
    final body = res.data;

    // No usamos body.message porque el backend NestJS devuelve los mensajes
    // de validación en inglés ("Invalid request origin", "must be a UUID",
    // etc.). El usuario final ve solo el mensaje friendly en español.
    // Si quieres debug, raw queda disponible para logging.
    final friendly = switch (code) {
      400 => 'Datos inválidos.',
      401 => 'Sesión no válida. Inicia sesión de nuevo.',
      403 => 'No tienes permisos para esta acción.',
      404 => 'No encontrado.',
      409 => 'Ya existe o el estado actual no lo permite.',
      413 => 'Archivo demasiado grande.',
      _ when code >= 500 => 'Error del servidor. Intenta más tarde.',
      _ => 'No se pudo completar la solicitud.',
    };
    return ApiException(code, friendly, raw: body);
  }

  /// Para `toString()` mostramos solo el mensaje legible — sin el código
  /// HTTP ni el nombre de la clase, porque este string puede acabar en
  /// banners de error visibles al usuario final.
  @override
  String toString() => message;
}

/// Extrae un mensaje legible para el usuario de cualquier error. Si es
/// `ApiException` devuelve su `message` (ya en español); de lo contrario
/// devuelve un fallback genérico — NO el `e.toString()` crudo, que puede
/// exponer stack traces o mensajes en inglés del Dart SDK.
String userMessageFor(Object e) {
  if (e is ApiException) return e.message;
  return 'No se pudo completar la operación. Intenta de nuevo.';
}

class _ErrorMappingInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response != null) {
      handler.reject(DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: ApiException.fromResponse(err.response!),
      ));
      return;
    }
    handler.reject(DioException(
      requestOptions: err.requestOptions,
      error: ApiException(
        0,
        'Sin conexión con el servidor. Revisa tu red.',
      ),
      type: err.type,
    ));
  }
}
