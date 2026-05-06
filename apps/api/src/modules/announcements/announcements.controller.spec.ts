import { Test, TestingModule } from '@nestjs/testing';

import { AdminAuthGuard } from '../admin-security/guards/admin-auth.guard';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [
        {
          provide: AnnouncementsService,
          useValue: {
            findLatestFive: jest.fn(),
            findAll: jest.fn(),
            findOneById: jest.fn(),
            findPaginatedWithFilters: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AnnouncementsController>(AnnouncementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
