import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('Auth Email Verification (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let testEmail = `test${Date.now()}@example.com`;
  let testUsername = `user${Date.now()}`;
  let testPassword = 'TestPass123!';
  let verificationToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register and send verification email (token in db)', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send({ email: testEmail, username: testUsername, password: testPassword });
    expect(res.body.user).toBeDefined();
    expect(res.body.user.isEmailVerified).toBe(false);
    // Get token from DB (simulate, in real test use repo or mock mail)
    // For now, fetch user via API or DB (pseudo):
    // const user = await getUserByEmail(testEmail);
    // verificationToken = user.emailVerificationToken;
  });

  it('should block login for unverified user', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  it('should resend verification email for unverified user', async () => {
    const res = await request(server)
      .post('/auth/resend-verification')
      .send({ email: testEmail });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/resent/i);
  });

  // The following test assumes you can fetch the token from DB or mock mail
  // it('should verify email with token', async () => {
  //   const res = await request(server)
  //     .get(`/auth/verify-email?token=${verificationToken}`);
  //   expect(res.status).toBe(200);
  //   expect(res.body.message).toMatch(/verified/i);
  // });

  // it('should allow login after verification', async () => {
  //   const res = await request(server)
  //     .post('/auth/login')
  //     .send({ email: testEmail, password: testPassword });
  //   expect(res.status).toBe(201);
  //   expect(res.body.access_token).toBeDefined();
  // });
});
