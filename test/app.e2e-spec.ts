import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

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

describe('User Profile (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    // Register a user
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'profiletest@example.com',
        username: 'profiletest',
        password: 'TestPass123!',
      });
    userId = res.body.id;

    // Login to get JWT
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'profiletest@example.com',
        password: 'TestPass123!',
      });
    accessToken = loginRes.body.accessToken;
  });

  it('should update profile fields', async () => {
    const update = {
      displayName: 'Test User',
      avatarUrl: 'http://localhost/uploads/test.png',
      emailPreferences: { promotional: false, transactional: true },
    };
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(update)
      .expect(200);
    expect(res.body.displayName).toBe(update.displayName);
    expect(res.body.avatarUrl).toBe(update.avatarUrl);
    expect(res.body.emailPreferences).toEqual(update.emailPreferences);
  });

  it('should upload an avatar', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'avatar.png');
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from([137,80,78,71,13,10,26,10])); // PNG header
    }
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/profile/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', filePath)
      .expect(201);
    expect(res.body.avatarUrl).toMatch(/\/uploads\//);
  });

  afterAll(async () => {
    await app.close();
  });
});
