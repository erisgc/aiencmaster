// Modelos de dominio espejo del backend AIENC.
// Mantén sincronizado con apps/api/src/modules/* y apps/web/app/lib/*

// ── Permisos ──────────────────────────────────────────────────────────

enum GlobalPermission {
  MANAGE_GLOBAL_ANNOUNCEMENTS,
  MANAGE_CHURCHES,
  MANAGE_ADMINS,
  VIEW_ALL_REPORTS,
}

enum ChurchPermission {
  MANAGE_CHURCH_ANNOUNCEMENTS,
  SUBMIT_REPORTS,
  EDIT_CHURCH_INFO,
  MANAGE_DIRECTORS,
}

GlobalPermission? globalPermissionFromString(String value) {
  for (final p in GlobalPermission.values) {
    if (p.name == value) return p;
  }
  return null;
}

ChurchPermission? churchPermissionFromString(String value) {
  for (final p in ChurchPermission.values) {
    if (p.name == value) return p;
  }
  return null;
}

class PermissionDescriptor {
  final String key;
  final String label;
  final String description;
  final String group; // 'global' | 'church'

  PermissionDescriptor({
    required this.key,
    required this.label,
    required this.description,
    required this.group,
  });

  factory PermissionDescriptor.fromJson(Map<String, dynamic> j) =>
      PermissionDescriptor(
        key: j['key'] as String,
        label: j['label'] as String,
        description: j['description'] as String? ?? '',
        group: j['group'] as String? ?? 'church',
      );
}

class PermissionTemplate {
  final String key;
  final String name;
  final String description;
  final List<ChurchPermission> churchPermissions;
  final List<GlobalPermission> globalPermissions;

  PermissionTemplate({
    required this.key,
    required this.name,
    required this.description,
    required this.churchPermissions,
    required this.globalPermissions,
  });

  factory PermissionTemplate.fromJson(Map<String, dynamic> j) =>
      PermissionTemplate(
        key: j['key'] as String,
        name: j['name'] as String,
        description: j['description'] as String? ?? '',
        churchPermissions: ((j['churchPermissions'] as List?) ?? const [])
            .map((e) => churchPermissionFromString(e as String))
            .whereType<ChurchPermission>()
            .toList(),
        globalPermissions: ((j['globalPermissions'] as List?) ?? const [])
            .map((e) => globalPermissionFromString(e as String))
            .whereType<GlobalPermission>()
            .toList(),
      );
}

class PermissionsCatalog {
  final List<PermissionDescriptor> catalog;
  final List<PermissionTemplate> templates;

  PermissionsCatalog({required this.catalog, required this.templates});

  factory PermissionsCatalog.fromJson(Map<String, dynamic> j) =>
      PermissionsCatalog(
        catalog: ((j['catalog'] as List?) ?? const [])
            .map((e) => PermissionDescriptor.fromJson(e as Map<String, dynamic>))
            .toList(),
        templates: ((j['templates'] as List?) ?? const [])
            .map((e) => PermissionTemplate.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

// ── Etiquetas legibles (español) ───────────────────────────────────────

/// Traduce el rol del backend ('ROOT' | 'ADMIN') a algo legible para el
/// usuario final, que no necesariamente sabe inglés.
String roleLabel(String role) {
  switch (role) {
    case 'ROOT':
      return 'Administrador principal';
    case 'ADMIN':
      return 'Administrador';
    default:
      return role;
  }
}

/// Versión corta del rol, pensada para badges/chips donde no cabe el texto
/// largo. "Principal" para ROOT, "Admin" para ADMIN.
String roleShortLabel(String role) {
  switch (role) {
    case 'ROOT':
      return 'Principal';
    case 'ADMIN':
      return 'Admin';
    default:
      return role;
  }
}

/// Traduce los códigos del log de auditoría a una descripción legible.
/// Los códigos vienen del backend (admin-audit.service.ts) y combinan
/// objeto + verbo en MAYÚSCULAS_CON_GUIONES.
String actionTypeLabel(String code) {
  switch (code) {
    case 'ADMIN_LOGIN_SUCCESS':
      return 'Inicio de sesión';
    case 'ADMIN_LOGIN_FAILED':
      return 'Intento de inicio de sesión fallido';
    case 'ADMIN_LOGOUT':
      return 'Cierre de sesión';
    case 'ADMIN_INVITATION_CREATED':
      return 'Invitación creada';
    case 'ADMIN_INVITATION_REVOKED':
      return 'Invitación revocada';
    case 'ADMIN_INVITATION_ACCEPTED':
      return 'Invitación aceptada';
    case 'ADMIN_ACCOUNT_CREATED':
      return 'Cuenta creada';
    case 'ADMIN_ACCOUNT_DEACTIVATED':
      return 'Cuenta desactivada';
    case 'ADMIN_ACCOUNT_REACTIVATED':
      return 'Cuenta reactivada';
    case 'ADMIN_PERMISSIONS_UPDATED':
      return 'Permisos actualizados';
    case 'ADMIN_CHURCH_ASSIGNED':
      return 'Iglesia asignada';
    case 'ADMIN_CHURCH_UNASSIGNED':
      return 'Iglesia removida';
    case 'REPORT_CREATED':
      return 'Informe creado';
    case 'REPORT_UPDATED':
      return 'Informe editado';
    case 'REPORT_DELETED':
      return 'Informe eliminado';
    case 'ANNOUNCEMENT_CREATED':
      return 'Anuncio creado';
    case 'ANNOUNCEMENT_UPDATED':
      return 'Anuncio editado';
    case 'ANNOUNCEMENT_DELETED':
      return 'Anuncio eliminado';
    case 'CHURCH_ANNOUNCEMENT_CREATED':
      return 'Anuncio de iglesia creado';
    case 'CHURCH_ANNOUNCEMENT_UPDATED':
      return 'Anuncio de iglesia editado';
    case 'CHURCH_ANNOUNCEMENT_DELETED':
      return 'Anuncio de iglesia eliminado';
    case 'CHURCH_CREATED':
      return 'Iglesia creada';
    case 'CHURCH_UPDATED':
      return 'Iglesia editada';
    case 'CHURCH_DEACTIVATED':
      return 'Iglesia desactivada';
    case 'CHURCH_REACTIVATED':
      return 'Iglesia reactivada';
    case 'DIRECTOR_CREATED':
      return 'Director añadido';
    case 'DIRECTOR_UPDATED':
      return 'Director editado';
    case 'DIRECTOR_DELETED':
      return 'Director eliminado';
    case 'ADMIN_ORIGIN_REJECTED':
      return 'Petición bloqueada (origen inválido)';
    default:
      // Fallback amable: transforma SNAKE_CASE → "Snake case"
      final cleaned = code
          .replaceAll('_', ' ')
          .toLowerCase();
      if (cleaned.isEmpty) return code;
      return cleaned[0].toUpperCase() + cleaned.substring(1);
  }
}

/// Etiqueta legible para el `targetType` que muestra el historial.
String targetTypeLabel(String? targetType) {
  switch (targetType) {
    case 'REPORT':
      return 'Informe';
    case 'ANNOUNCEMENT':
      return 'Anuncio global';
    case 'CHURCH_ANNOUNCEMENT':
      return 'Anuncio de iglesia';
    case 'CHURCH':
      return 'Iglesia';
    case 'ADMIN_INVITATION':
      return 'Invitación';
    case 'ADMIN_ACCOUNT':
      return 'Cuenta de administrador';
    case 'DIRECTOR':
      return 'Director';
    case 'ADMIN_HTTP_REQUEST':
      return 'Petición HTTP';
    case null:
    case '':
      return '—';
    default:
      return targetType;
  }
}

/// Estado de invitación a etiqueta en español.
String invitationStatusLabel(String status) {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'ACCEPTED':
      return 'Aceptada';
    case 'REVOKED':
      return 'Revocada';
    case 'EXPIRED':
      return 'Expirada';
    default:
      return status;
  }
}

// ── Sesión / cuenta ────────────────────────────────────────────────────

class ChurchAssignment {
  final String id;
  final String churchId;
  final String? churchName;
  final List<ChurchPermission> permissions;

  ChurchAssignment({
    required this.id,
    required this.churchId,
    required this.churchName,
    required this.permissions,
  });

  factory ChurchAssignment.fromJson(Map<String, dynamic> j) =>
      ChurchAssignment(
        id: j['id'] as String,
        churchId: j['churchId'] as String,
        churchName: j['churchName'] as String?,
        permissions: ((j['permissions'] as List?) ?? const [])
            .map((e) => churchPermissionFromString(e as String))
            .whereType<ChurchPermission>()
            .toList(),
      );
}

class AdminAccount {
  final String id;
  final String username;
  final String displayName;
  final String role; // 'ROOT' | 'ADMIN'
  final bool isActive;
  final List<GlobalPermission> globalPermissions;
  final List<ChurchAssignment> churchAssignments;

  AdminAccount({
    required this.id,
    required this.username,
    required this.displayName,
    required this.role,
    required this.isActive,
    required this.globalPermissions,
    required this.churchAssignments,
  });

  factory AdminAccount.fromJson(Map<String, dynamic> j) => AdminAccount(
        id: j['id'] as String,
        username: j['username'] as String,
        displayName: j['displayName'] as String? ?? j['username'] as String,
        role: j['role'] as String? ?? 'ADMIN',
        isActive: j['isActive'] as bool? ?? true,
        globalPermissions: ((j['globalPermissions'] as List?) ?? const [])
            .map((e) => globalPermissionFromString(e as String))
            .whereType<GlobalPermission>()
            .toList(),
        churchAssignments: ((j['churchAssignments'] as List?) ?? const [])
            .map((e) => ChurchAssignment.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  bool get isRoot => role == 'ROOT';

  bool hasGlobalPermission(GlobalPermission p) =>
      isRoot || globalPermissions.contains(p);

  bool hasChurchPermission(String churchId, ChurchPermission p) {
    if (isRoot) return true;
    for (final a in churchAssignments) {
      if (a.churchId == churchId && a.permissions.contains(p)) return true;
    }
    return false;
  }
}

class SessionResponse {
  final String status; // 'ACTIVE' | 'BOOTSTRAP_REQUIRED' | 'UNAUTHENTICATED' | 'PENDING'
  final AdminAccount? account;

  SessionResponse({required this.status, required this.account});

  factory SessionResponse.fromJson(Map<String, dynamic> j) => SessionResponse(
        status: j['status'] as String? ?? 'UNAUTHENTICATED',
        account: j['account'] == null
            ? null
            : AdminAccount.fromJson(j['account'] as Map<String, dynamic>),
      );
}

// ── Invitación ─────────────────────────────────────────────────────────

class InvitationPreview {
  final bool valid;
  final String status; // 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
  final String? username;
  final String? displayName;
  final String? churchName;
  final DateTime? expiresAt;

  InvitationPreview({
    required this.valid,
    required this.status,
    this.username,
    this.displayName,
    this.churchName,
    this.expiresAt,
  });

  factory InvitationPreview.fromJson(Map<String, dynamic> j) =>
      InvitationPreview(
        valid: j['valid'] as bool? ?? false,
        status: j['status'] as String? ?? 'EXPIRED',
        username: j['username'] as String?,
        displayName: j['displayName'] as String?,
        churchName: j['churchName'] as String?,
        expiresAt: j['expiresAt'] != null
            ? DateTime.tryParse(j['expiresAt'] as String)
            : null,
      );
}

// ── Iglesias ───────────────────────────────────────────────────────────

class Church {
  final String id;
  final String name;
  final String city;
  final String? address;
  final String? representatives;
  final int? avgAttendance;
  final bool isActive;
  final String? mainImageUrl;
  final String? coverImageUrl;

  Church({
    required this.id,
    required this.name,
    required this.city,
    this.address,
    this.representatives,
    this.avgAttendance,
    this.isActive = true,
    this.mainImageUrl,
    this.coverImageUrl,
  });

  factory Church.fromJson(Map<String, dynamic> j) => Church(
        id: j['id'] as String,
        name: j['name'] as String? ?? '',
        city: j['city'] as String? ?? '',
        address: j['address'] as String?,
        representatives: j['representatives'] as String?,
        avgAttendance: (j['avgAttendance'] as num?)?.toInt(),
        isActive: j['isActive'] as bool? ?? true,
        mainImageUrl: j['mainImageUrl'] as String?,
        coverImageUrl: j['coverImageUrl'] as String?,
      );
}

// ── Anuncios ───────────────────────────────────────────────────────────

class AnnouncementAttachment {
  final String id;
  final String url;
  final String name;
  final String format;

  AnnouncementAttachment({
    required this.id,
    required this.url,
    required this.name,
    required this.format,
  });

  factory AnnouncementAttachment.fromJson(Map<String, dynamic> j) =>
      AnnouncementAttachment(
        id: j['id'] as String? ?? '',
        url: j['url'] as String? ?? '',
        name: j['name'] as String? ?? '',
        format: j['format'] as String? ?? '',
      );
}

class Announcement {
  final String id;
  final String title;
  final String description;
  final String author;
  final DateTime createdAt;
  final List<AnnouncementAttachment> attachments;
  final String? churchId; // null para global

  Announcement({
    required this.id,
    required this.title,
    required this.description,
    required this.author,
    required this.createdAt,
    this.attachments = const [],
    this.churchId,
  });

  factory Announcement.fromJson(Map<String, dynamic> j) => Announcement(
        id: j['id'] as String,
        title: j['title'] as String? ?? '',
        description: j['description'] as String? ?? '',
        author: j['author'] as String? ?? '',
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
        attachments: ((j['attachments'] as List?) ?? const [])
            .map((e) =>
                AnnouncementAttachment.fromJson(e as Map<String, dynamic>))
            .toList(),
        churchId: j['churchId'] as String?,
      );
}

// ── Reportes ───────────────────────────────────────────────────────────

enum ReportType { OFFERINGS, ATTENDANCE, EXPENSES, EVENT, REQUEST, OTHER }
enum ExpenseCategory { PURCHASE, REPAIR, DAMAGE, THEFT, UTILITIES, OTHER }
enum RequestStatus { PENDING, APPROVED, REJECTED, RESOLVED }
enum AttendanceScope { session, month }

ReportType reportTypeFromString(String v) =>
    ReportType.values.firstWhere((e) => e.name == v,
        orElse: () => ReportType.OTHER);

const Map<ReportType, String> reportTypeLabels = {
  ReportType.OFFERINGS: 'Ofrendas',
  ReportType.ATTENDANCE: 'Asistencia',
  ReportType.EXPENSES: 'Gasto / egreso',
  ReportType.EVENT: 'Evento especial',
  ReportType.REQUEST: 'Solicitud',
  ReportType.OTHER: 'Otro',
};

const Map<ExpenseCategory, String> expenseCategoryLabels = {
  ExpenseCategory.PURCHASE: 'Compra',
  ExpenseCategory.REPAIR: 'Reparación / pintura',
  ExpenseCategory.DAMAGE: 'Daños',
  ExpenseCategory.THEFT: 'Robo / pérdida',
  ExpenseCategory.UTILITIES: 'Servicios públicos',
  ExpenseCategory.OTHER: 'Otro',
};

const Map<RequestStatus, String> requestStatusLabels = {
  RequestStatus.PENDING: 'Pendiente',
  RequestStatus.APPROVED: 'Aprobada',
  RequestStatus.REJECTED: 'Rechazada',
  RequestStatus.RESOLVED: 'Resuelta',
};

class Report {
  final String id;
  final String churchId;
  final ReportType reportType;
  final String title;
  final String notes;
  final DateTime periodStart;
  final DateTime periodEnd;
  final Map<String, dynamic> data;
  final String createdByDisplayName;
  final DateTime createdAt;
  final String? churchName;

  Report({
    required this.id,
    required this.churchId,
    required this.reportType,
    required this.title,
    required this.notes,
    required this.periodStart,
    required this.periodEnd,
    required this.data,
    required this.createdByDisplayName,
    required this.createdAt,
    this.churchName,
  });

  factory Report.fromJson(Map<String, dynamic> j) => Report(
        id: j['id'] as String,
        churchId: j['churchId'] as String? ?? '',
        reportType: reportTypeFromString(j['reportType'] as String? ?? 'OTHER'),
        title: j['title'] as String? ?? '',
        notes: j['notes'] as String? ?? '',
        periodStart: DateTime.tryParse(j['periodStart'] as String? ?? '') ??
            DateTime.now(),
        periodEnd: DateTime.tryParse(j['periodEnd'] as String? ?? '') ??
            DateTime.now(),
        data: (j['data'] as Map?)?.cast<String, dynamic>() ?? const {},
        createdByDisplayName: j['createdByDisplayName'] as String? ?? '',
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
        churchName: (j['church'] as Map?)?['name'] as String?,
      );
}

class ReportListResponse {
  final List<Report> items;
  final int total;
  ReportListResponse({required this.items, required this.total});

  factory ReportListResponse.fromJson(Map<String, dynamic> j) =>
      ReportListResponse(
        items: ((j['items'] as List?) ?? const [])
            .map((e) => Report.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: (j['total'] as num?)?.toInt() ?? 0,
      );
}

// ── Métricas ───────────────────────────────────────────────────────────

class TimelinePoint {
  final String month; // 'YYYY-MM'
  final double total;
  TimelinePoint({required this.month, required this.total});

  factory TimelinePoint.fromJson(Map<String, dynamic> j) => TimelinePoint(
        month: j['month'] as String,
        total: (j['total'] as num?)?.toDouble() ?? 0,
      );
}

class MetricsByChurch {
  final String churchId;
  final double offerings;
  final double expenses;
  final int attendance;
  MetricsByChurch({
    required this.churchId,
    required this.offerings,
    required this.expenses,
    required this.attendance,
  });

  factory MetricsByChurch.fromJson(Map<String, dynamic> j) => MetricsByChurch(
        churchId: j['churchId'] as String,
        offerings: (j['offerings'] as num?)?.toDouble() ?? 0,
        expenses: (j['expenses'] as num?)?.toDouble() ?? 0,
        attendance: (j['attendance'] as num?)?.toInt() ?? 0,
      );
}

class MetricsTimeline {
  final List<TimelinePoint> offerings;
  final List<TimelinePoint> expenses;
  final List<TimelinePoint> attendance;
  final List<MetricsByChurch> byChurch;

  MetricsTimeline({
    required this.offerings,
    required this.expenses,
    required this.attendance,
    required this.byChurch,
  });

  factory MetricsTimeline.fromJson(Map<String, dynamic> j) => MetricsTimeline(
        offerings: ((j['offerings'] as List?) ?? const [])
            .map((e) => TimelinePoint.fromJson(e as Map<String, dynamic>))
            .toList(),
        expenses: ((j['expenses'] as List?) ?? const [])
            .map((e) => TimelinePoint.fromJson(e as Map<String, dynamic>))
            .toList(),
        attendance: ((j['attendance'] as List?) ?? const [])
            .map((e) => TimelinePoint.fromJson(e as Map<String, dynamic>))
            .toList(),
        byChurch: ((j['byChurch'] as List?) ?? const [])
            .map((e) => MetricsByChurch.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

// ── Historial ──────────────────────────────────────────────────────────

class HistoryAction {
  final String id;
  final String actionType;
  final String description;
  final String? targetType;
  final String? targetId;
  final String? ip;
  final DateTime createdAt;
  final Map<String, dynamic>? metadata;

  HistoryAction({
    required this.id,
    required this.actionType,
    required this.description,
    required this.createdAt,
    this.targetType,
    this.targetId,
    this.ip,
    this.metadata,
  });

  factory HistoryAction.fromJson(Map<String, dynamic> j) => HistoryAction(
        id: j['id'] as String,
        actionType: j['actionType'] as String? ?? '',
        description: j['description'] as String? ?? '',
        targetType: j['targetType'] as String?,
        targetId: j['targetId'] as String?,
        ip: j['ip'] as String?,
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
        metadata: (j['metadata'] as Map?)?.cast<String, dynamic>(),
      );
}

class AccountHistoryResponse {
  final AdminAccount account;
  final List<HistoryAction> actions;
  AccountHistoryResponse({required this.account, required this.actions});

  factory AccountHistoryResponse.fromJson(Map<String, dynamic> j) =>
      AccountHistoryResponse(
        account: AdminAccount.fromJson(j['account'] as Map<String, dynamic>),
        actions: ((j['actions'] as List?) ?? const [])
            .map((e) => HistoryAction.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
