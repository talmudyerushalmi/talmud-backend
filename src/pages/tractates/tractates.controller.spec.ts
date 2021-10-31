import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from '../pages.service';
import { TractatesController } from './tractates.controller';

fdescribe('Tractates Controller', () => {
  let controller: TractatesController;
  let pageService: PagesService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TractatesController],
      providers: [{
        provide: PagesService,
        useValue: {
          method1: jest.fn(),
          method2: jest.fn(),
        }
      }]
    }).compile();

    pageService = module.get<PagesService>(PagesService);
    controller = module.get<TractatesController>(TractatesController);
  });

  it('should be defined', () => {

    expect(1).toBe(1);
    expect(controller).toBeDefined();
  });
});
