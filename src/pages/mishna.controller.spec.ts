import { Test, TestingModule } from '@nestjs/testing';
import { MishnaController } from './mishna.controller';

describe('Mishna Controller', () => {
  let controller: MishnaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MishnaController],
    }).compile();

    controller = module.get<MishnaController>(MishnaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
