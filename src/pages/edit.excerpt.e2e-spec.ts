import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Edit Excerpt (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should not allow path for unauthorized', () => {
    return request(app.getHttpServer())
      .get('/edit/mishna/mishna/yevamot/001/001')
      .expect(401)
      // .expect(({ body }) => {
      //   expect(body.tractate).toEqual('yevamot');
      // });
  });

  afterAll(()=>{
    app.close()
  })
});