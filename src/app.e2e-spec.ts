import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('App health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should fetch a mishna', () => {
    return request(app.getHttpServer())
      .get('/mishna/yevamot/001/001')
      .expect(200)
      .expect(({ body }) => {
        expect(body.tractate).toEqual('yevamot');
      });
  });

  afterAll(()=>{
    app.close()
  })
});