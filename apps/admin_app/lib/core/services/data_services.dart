import 'package:dio/dio.dart';

import '../api/api_client.dart';
import '../models/domain.dart';

/// Iglesias
class ChurchService {
  ChurchService(this._api);
  final ApiClient _api;

  Future<List<Church>> list() async {
    final res = await _api.dio.get('/admin/churches');
    final raw = res.data;
    if (raw is List) {
      return raw
          .map((e) => Church.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return const [];
  }

  Future<Church> get(String id) async {
    final res = await _api.dio.get('/admin/churches/$id');
    return Church.fromJson(res.data as Map<String, dynamic>);
  }

  /// El endpoint PATCH de iglesias en el backend procesa `req.parts()`, así
  /// que aunque no subamos archivos debemos enviar los campos como
  /// multipart/form-data. La edición de imágenes queda como TODO en mobile:
  /// se hace desde la web (selector de archivos + cropper).
  Future<Church> update(
    String id, {
    String? name,
    String? city,
    String? address,
    String? representatives,
    int? avgAttendance,
    bool? isActive,
  }) async {
    final fields = <String, String>{};
    if (name != null) fields['name'] = name.trim();
    if (city != null) fields['city'] = city.trim();
    if (address != null) fields['address'] = address.trim();
    if (representatives != null) fields['representatives'] = representatives.trim();
    if (avgAttendance != null) fields['avgAttendance'] = avgAttendance.toString();
    if (isActive != null) fields['isActive'] = isActive ? 'true' : 'false';

    final form = FormData.fromMap(fields);
    final res = await _api.dio.patch(
      '/admin/churches/$id',
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    return Church.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Church> toggleActive(String id) async {
    final res = await _api.dio.patch('/admin/churches/$id/toggle');
    return Church.fromJson(res.data as Map<String, dynamic>);
  }
}

/// Anuncios — globales y por iglesia.
class AnnouncementService {
  AnnouncementService(this._api);
  final ApiClient _api;

  Future<List<Announcement>> listGlobal() async {
    final res = await _api.dio.get('/admin/announcements');
    final raw = res.data;
    if (raw is List) {
      return raw
          .map((e) => Announcement.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return const [];
  }

  Future<List<Announcement>> listForChurch(String churchId) async {
    final res =
        await _api.dio.get('/admin/churches/$churchId/announcements');
    final raw = res.data;
    if (raw is List) {
      return raw
          .map((e) => Announcement.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return const [];
  }

  /// Crear anuncio global (sólo ROOT con MANAGE_GLOBAL_ANNOUNCEMENTS).
  /// El backend usa multipart/form-data en POST (acepta archivos opcionales);
  /// desde mobile sólo enviamos campos de texto. Los adjuntos se suben desde
  /// la web.
  Future<Announcement> createGlobal({
    required String title,
    required String description,
    required String author,
  }) async {
    final form = FormData.fromMap({
      'title': title.trim(),
      'description': description.trim(),
      'author': author.trim(),
    });
    final res = await _api.dio.post(
      '/admin/announcements',
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    return Announcement.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Announcement> updateGlobal(
    String id, {
    required String title,
    required String description,
    required String author,
  }) async {
    final data = await _api.patchJson<Map<String, dynamic>>(
      '/admin/announcements/$id',
      body: {
        'title': title.trim(),
        'description': description.trim(),
        'author': author.trim(),
      },
    );
    return Announcement.fromJson(data);
  }

  Future<void> deleteGlobal(String id) async {
    await _api.dio.delete('/admin/announcements/$id');
  }

  Future<Announcement> createForChurch({
    required String churchId,
    required String title,
    required String description,
    required String author,
  }) async {
    final form = FormData.fromMap({
      'title': title.trim(),
      'description': description.trim(),
      'author': author.trim(),
    });
    final res = await _api.dio.post(
      '/admin/churches/$churchId/announcements',
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    return Announcement.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Announcement> updateForChurch({
    required String churchId,
    required String id,
    required String title,
    required String description,
    required String author,
  }) async {
    final data = await _api.patchJson<Map<String, dynamic>>(
      '/admin/churches/$churchId/announcements/$id',
      body: {
        'title': title.trim(),
        'description': description.trim(),
        'author': author.trim(),
      },
    );
    return Announcement.fromJson(data);
  }

  Future<void> deleteFromChurch(String churchId, String id) async {
    await _api.dio.delete('/admin/churches/$churchId/announcements/$id');
  }
}

/// Reportes
class ReportService {
  ReportService(this._api);
  final ApiClient _api;

  Future<ReportListResponse> list({
    String? churchId,
    ReportType? type,
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    final query = <String, dynamic>{};
    if (churchId != null && churchId.isNotEmpty) query['churchId'] = churchId;
    if (type != null) query['reportType'] = type.name;
    if (fromDate != null) {
      query['fromDate'] = fromDate.toIso8601String().substring(0, 10);
    }
    if (toDate != null) {
      query['toDate'] = toDate.toIso8601String().substring(0, 10);
    }
    final res = await _api.dio.get('/admin/reports', queryParameters: query);
    return ReportListResponse.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Report> create({
    required String churchId,
    required ReportType type,
    required String title,
    String? notes,
    required DateTime periodStart,
    required DateTime periodEnd,
    required Map<String, dynamic> data,
  }) async {
    final body = {
      'churchId': churchId,
      'reportType': type.name,
      'title': title,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
      'periodStart': periodStart.toIso8601String(),
      'periodEnd': periodEnd.toIso8601String(),
      'data': data,
    };
    final res =
        await _api.postJson<Map<String, dynamic>>('/admin/reports', body: body);
    return Report.fromJson(res);
  }

  Future<MetricsTimeline> metrics({
    String? churchId,
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    final q = <String, dynamic>{};
    if (churchId != null && churchId.isNotEmpty) q['churchId'] = churchId;
    if (fromDate != null) {
      q['fromDate'] = fromDate.toIso8601String().substring(0, 10);
    }
    if (toDate != null) {
      q['toDate'] = toDate.toIso8601String().substring(0, 10);
    }
    final res = await _api.dio
        .get('/admin/reports/metrics/timeline', queryParameters: q);
    return MetricsTimeline.fromJson(res.data as Map<String, dynamic>);
  }
}

/// Catálogo de permisos / gestión de cuentas (solo ROOT)
class SecurityService {
  SecurityService(this._api);
  final ApiClient _api;

  Future<PermissionsCatalog> catalog() async {
    final res = await _api.dio.get('/admin/security/permissions/catalog');
    return PermissionsCatalog.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<AdminAccount>> listAccounts() async {
    final res = await _api.dio.get('/admin/security/accounts');
    final raw = res.data;
    if (raw is List) {
      return raw
          .map((e) => AdminAccount.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return const [];
  }

  Future<AccountHistoryResponse> accountHistory(String id) async {
    final res = await _api.dio.get('/admin/security/accounts/$id/history');
    return AccountHistoryResponse.fromJson(res.data as Map<String, dynamic>);
  }

  /// Actualiza los permisos globales de una cuenta no-ROOT.
  Future<void> updateGlobalPermissions(
    String accountId,
    List<GlobalPermission> permissions,
  ) async {
    await _api.patchJson<Map<String, dynamic>>(
      '/admin/security/accounts/$accountId/permissions',
      body: {
        'globalPermissions': permissions.map((e) => e.name).toList(),
      },
    );
  }

  /// Asigna una iglesia con un set inicial de permisos.
  Future<void> assignChurch(
    String accountId, {
    required String churchId,
    required List<ChurchPermission> permissions,
  }) async {
    await _api.postJson<Map<String, dynamic>>(
      '/admin/security/accounts/$accountId/churches',
      body: {
        'churchId': churchId,
        'permissions': permissions.map((e) => e.name).toList(),
      },
    );
  }

  /// Cambia los permisos sobre una iglesia ya asignada.
  Future<void> updateChurchPermissions(
    String accountId, {
    required String churchId,
    required List<ChurchPermission> permissions,
  }) async {
    await _api.patchJson<Map<String, dynamic>>(
      '/admin/security/accounts/$accountId/churches/$churchId/permissions',
      body: {
        'permissions': permissions.map((e) => e.name).toList(),
      },
    );
  }

  /// Quita la asignación de una iglesia.
  Future<void> removeChurchAssignment(
    String accountId, {
    required String churchId,
  }) async {
    await _api.postJson<Map<String, dynamic>>(
      '/admin/security/accounts/$accountId/churches/$churchId/remove',
    );
  }
}

/// Invitaciones (solo ROOT).
class InvitationService {
  InvitationService(this._api);
  final ApiClient _api;

  Future<List<AdminInvitation>> list() async {
    final res = await _api.dio.get('/admin/security/invitations');
    final raw = res.data;
    if (raw is List) {
      return raw
          .map((e) => AdminInvitation.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return const [];
  }

  Future<CreatedInvitation> create({
    required String username,
    required String displayName,
    required String assignedChurchId,
    required List<ChurchPermission> churchPermissions,
    List<GlobalPermission> globalPermissions = const [],
  }) async {
    final res = await _api.postJson<Map<String, dynamic>>(
      '/admin/security/invitations',
      body: {
        'username': username.trim(),
        'displayName': displayName.trim(),
        'assignedChurchId': assignedChurchId,
        'churchPermissions': churchPermissions.map((e) => e.name).toList(),
        if (globalPermissions.isNotEmpty)
          'globalPermissions': globalPermissions.map((e) => e.name).toList(),
      },
    );
    return CreatedInvitation.fromJson(res);
  }

  Future<void> revoke(String id) async {
    await _api.dio.delete('/admin/security/invitations/$id');
  }
}
