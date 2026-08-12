const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

// Unique per test run so repeated runs against the shared dev DB don't collide.
const RUN_ID = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const USERNAME = `test_auth_${RUN_ID}`;
const PASSWORD = 'password123';

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE username = $1', [USERNAME]);
  await pool.end();
});

describe('Auth flow', () => {
  test('register creates a pharmacist by default', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: USERNAME, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: USERNAME, role: 'pharmacist' });
  });

  test('register rejects a duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: USERNAME, password: PASSWORD });

    expect(res.status).toBe(409);
  });

  test('register rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: `${USERNAME}_short`, password: '123' });

    expect(res.status).toBe(400);
  });

  test('login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: USERNAME, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  test('login succeeds and returns an access token + refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: USERNAME, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie'].some((c) => c.startsWith('meditrack_refresh_token='))).toBe(true);
  });

  test('protected route rejects requests with no token', async () => {
    const res = await request(app).get('/api/medications');
    expect(res.status).toBe(401);
  });

  test('protected route accepts a valid access token', async () => {
    const login = await request(app).post('/api/auth/login').send({ username: USERNAME, password: PASSWORD });
    const token = login.body.accessToken;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(USERNAME);
  });

  test('refresh issues a new access token from the refresh cookie', async () => {
    const login = await request(app).post('/api/auth/login').send({ username: USERNAME, password: PASSWORD });
    const cookie = login.headers['set-cookie'];

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  test('logout clears the refresh cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie'][0]).toMatch(/meditrack_refresh_token=;/);
  });
});
