import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { INestApplication, NestModule } from '@nestjs/common';
import * as request from 'supertest';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserGroup } from './middleware/userType';



@Module({
  imports: [AppModule],
})
export class TestAuthOverride implements NestModule {
  public usergroup: UserGroup;
  constructor(){}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply((req, res, next) => {
      res.locals.userGroup = this.usergroup;
      next();})
    .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

fdescribe('App health (e2e)', () => {
  let app: INestApplication;
  let testModule: TestAuthOverride;
    beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAuthOverride],
    })
    .compile();

    app = moduleFixture.createNestApplication();
    testModule = moduleFixture.get<TestAuthOverride>(TestAuthOverride)
    

    await app.init();
  });

  



  describe('for unauthenticated user', ()=>{
    it('should fetch a public mishna', () => {
      testModule.usergroup = UserGroup.Unauthenticated   
      return request(app.getHttpServer())
        .get('/mishna/yevamot/001/001')
        .expect(200)
        .expect(({ body }) => {
          expect(body.tractate).toEqual('yevamot');
          return;
        });
    });

    it('should not fetch a mishna which is not public', () => {
      testModule.usergroup = UserGroup.Unauthenticated   
      return request(app.getHttpServer())
        .get('/mishna/taaniyot/004?mishna=1')
        .expect(403)
    });
  })

  describe('for an editor', ()=>{
    it('should fetch a mishna which is not public', () => {
      testModule.usergroup = UserGroup.Editor   
      return request(app.getHttpServer())
        .get('/mishna/taaniyot/004?mishna=1')
        .expect(200)
        .expect(({ body }) => {
        expect(body.tractate).toEqual('taaniyot');
        });
    });
  })


  afterAll(()=>{
    app.close()
  })
});