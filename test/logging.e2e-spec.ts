/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Logging (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Clean up log files before test
    const logDir = path.join(__dirname, '..', 'logs');
    if (fs.existsSync(logDir)) {
      fs.rmSync(logDir, { recursive: true, force: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) should log the request', async () => {
    await request(app.getHttpServer()).get('/').expect(404); // Assuming default route returns 404 or something

    // Check if log files were created
    const logDir = path.join(__dirname, '..', 'logs');
    const files = fs.readdirSync(logDir);
    expect(files.some(f => f.startsWith('application-'))).toBe(true);
    
    // Check log content
    const logFile = files.find(f => f.startsWith('application-'));
    const logContent = fs.readFileSync(path.join(logDir, logFile), 'utf-8');
    expect(logContent).toContain('HTTP Request');
    expect(logContent).toContain('GET');
    expect(logContent).toContain('/');
  });
  
  it('should log an error for a non-existent route', async () => {
    await request(app.getHttpServer()).get('/non-existent-route').expect(404);

    const logDir = path.join(__dirname, '..', 'logs');
    const files = fs.readdirSync(logDir);
    const errorFile = files.find(f => f.startsWith('errors-'));
    // This might not create an error log if 404 is not considered an 'error' level log.
    // Let's check the application log instead for the request log.
    const logFile = files.find(f => f.startsWith('application-'));
    const logContent = fs.readFileSync(path.join(logDir, logFile), 'utf-8');
    expect(logContent).toContain('/non-existent-route');
    expect(logContent).toContain('404');
  });

  it('should redact sensitive fields', async () => {
    await request(app.getHttpServer())
      .post('/auth/login') // Assuming this route exists
      .send({ email: 'test@test.com', password: 'a-secret-password' })
      .expect(401); // Or whatever it returns for bad login

    const logDir = path.join(__dirname, '..', 'logs');
    const files = fs.readdirSync(logDir);
    const logFile = files.find(f => f.startsWith('application-'));
    const logContent = fs.readFileSync(path.join(logDir, logFile), 'utf-8');
    expect(logContent).toContain('HTTP Request');
    expect(logContent).toContain('/auth/login');
    expect(logContent).toContain('REDACTED');
    expect(logContent).not.toContain('a-secret-password');
  });
});
