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

  Future<Announcement> createForChurch({
    required String churchId,
    required String title,
    required String description,
    required String author,
  }) async {
    final data = await _api.postJson<Map<String, dynamic>>(
      '/admin/churches/$churchId/announcements',
      body: {
        'title': title,
        'description': description,
        'author': author,
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
}
