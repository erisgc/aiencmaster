import { Test, TestingModule } from '@nestjs/testing';
import { PublicChurchesController } from './public-churches.controller';
import { ChurchesService } from './churches.service';

describe('PublicChurchesController', () => {
  let controller: PublicChurchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicChurchesController],
      providers: [
        {
          provide: ChurchesService,
          useValue: {
            findAllPublic: jest.fn(),
            findOnePublic: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PublicChurchesController>(PublicChurchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
