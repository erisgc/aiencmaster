import '../api/api_client.dart';
import '../models/domain.dart';

/// Endpoints de autenticación que la app necesita.
/// Espejo de apps/web/app/lib/admin-auth.ts y admin-invitations.ts.
class AuthService {
  AuthService(this._api);
  final ApiClient _api;

  Future<SessionResponse> getSession() async {
    final res = await _api.dio.get('/admin/session');
    if (res.statusCode == 200) {
      return SessionResponse.fromJson(res.data as Map<String, dynamic>);
    }
    return SessionResponse(status: 'UNAUTHENTICATED', account: null);
  }

  Future<SessionResponse> login({
    required String username,
    required String password,
  }) async {
    final data = await _api.postJson<Map<String, dynamic>>(
      '/admin/auth/login',
      body: {'username': username, 'password': password},
    );
    return SessionResponse.fromJson(data);
  }

  Future<void> logout() async {
    try {
      await _api.dio.post('/admin/auth/logout');
    } finally {
      await _api.clearCookies();
    }
  }

  Future<InvitationPreview> previewInvitation(String token) async {
    final res = await _api.dio.get(
      '/admin/auth/invitations/preview',
      queryParameters: {'token': token},
    );
    return InvitationPreview.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> acceptInvitation(
    String token,
    String password,
  ) async {
    return _api.postJson<Map<String, dynamic>>(
      '/admin/auth/invitations/accept',
      body: {'token': token, 'password': password},
    );
  }
}
