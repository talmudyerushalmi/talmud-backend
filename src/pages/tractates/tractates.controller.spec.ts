import { Test, TestingModule } from '@nestjs/testing';
import { TractatesController } from './tractates.controller';

describe('Tractates Controller', () => {
  let controller: TractatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TractatesController],
    }).compile();

    controller = module.get<TractatesController>(TractatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
