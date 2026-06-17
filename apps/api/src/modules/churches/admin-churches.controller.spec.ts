import { Test, TestingModule } from '@nestjs/testing';

import { AdminAuditService } from '../admin-security/admin-audit.service';
import { AdminAuthGuard } from '../admin-security/guards/admin-auth.guard';
import { GlobalPermissionsGuard } from '../admin-security/permissions/global-permissions.guard';
import { PermissionsService } from '../admin-security/permissions/permissions.service';
import { AdminChurchesController } from './admin-churches.controller';
import { ChurchesService } from './churches.service';

describe('AdminChurchesController', () => {
  let controller: AdminChurchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminChurchesController],
      providers: [
        {
          provide: ChurchesService,
          useValue: {
            findAllForAdmin: jest.fn(),
            findByIdForAdmin: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            toggleActive: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AdminAuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            hasGlobalPermission: jest.fn(() => true),
            assertChurchPermission: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(GlobalPermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AdminChurchesController>(AdminChurchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
