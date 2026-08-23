const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

const RUN_ID = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const USERNAME = `test_meds_${RUN_ID}`;
const PASSWORD = 'password123';
const MED_NAME = `Test Med ${RUN_ID}`;
const DEPT = 'TestDept';

let token;
let medicationId;

beforeAll(async () => {
  await request(app).post('/api/auth/register').send({ username: USERNAME, password: PASSWORD });
  const login = await request(app).post('/api/auth/login').send({ username: USERNAME, password: PASSWORD });
  token = login.body.accessToken;
});

afterAll(async () => {
  if (medicationId) {
    await pool.query('DELETE FROM withdrawal_transactions WHERE medication_id = $1', [medicationId]);
    await pool.query('DELETE FROM medications WHERE medication_id = $1', [medicationId]);
  }
  await pool.query('DELETE FROM users WHERE username = $1', [USERNAME]);
  await pool.end();
});

function auth(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('Medications flow', () => {
  test('create medication with initial stock 30 -> green', async () => {
    const res = await auth(request(app).post('/api/medications')).send({
      name: MED_NAME,
      currentStock: 30,
      alertThresholdDays: 5,
      department: DEPT,
    });

    expect(res.status).toBe(201);
    expect(res.body.medication).toMatchObject({ name: MED_NAME, currentStock: 30, status: 'green' });
    medicationId = res.body.medication.medicationId;
  });

  test('create medication with zero initial stock -> red', async () => {
    const res = await auth(request(app).post('/api/medications')).send({
      name: `${MED_NAME}_zero`,
      currentStock: 0,
      department: DEPT,
    });

    expect(res.status).toBe(201);
    expect(res.body.medication.status).toBe('red');

    // clean up this one immediately, it's not tracked by the outer medicationId
    await pool.query('DELETE FROM medications WHERE medication_id = $1', [res.body.medication.medicationId]);
  });

  test('list includes the newly created medication, filterable by department', async () => {
    const res = await auth(request(app).get('/api/medications')).query({ department: DEPT });
    expect(res.status).toBe(200);
    expect(res.body.medications.some((m) => m.medicationId === medicationId)).toBe(true);
  });

  test('withdraw reduces stock and records a transaction (no department in the request)', async () => {
    const res = await auth(request(app).post(`/api/medications/${medicationId}/withdraw`)).send({
      quantity: 10,
    });

    expect(res.status).toBe(200);
    expect(res.body.medication.currentStock).toBe(20);
    expect(res.body.medication.totalWithdrawn30d).toBe(10);
  });

  test('withdraw ignores a department sent in the body and defaults to the medication\'s own department', async () => {
    // Isolated medication so this doesn't perturb the stock/threshold numbers
    // the rest of this describe block depends on.
    const create = await auth(request(app).post('/api/medications')).send({
      name: `${MED_NAME}_dept_ignore`,
      currentStock: 10,
      department: DEPT,
    });
    const isolatedId = create.body.medication.medicationId;

    const res = await auth(request(app).post(`/api/medications/${isolatedId}/withdraw`)).send({
      quantity: 1,
      department: 'SomeOtherDept',
    });
    expect(res.status).toBe(200);

    const { rows } = await pool.query(
      'SELECT department FROM withdrawal_transactions WHERE medication_id = $1 ORDER BY created_at DESC LIMIT 1',
      [isolatedId]
    );
    expect(rows[0].department).toBe(DEPT);

    await pool.query('DELETE FROM withdrawal_transactions WHERE medication_id = $1', [isolatedId]);
    await pool.query('DELETE FROM medications WHERE medication_id = $1', [isolatedId]);
  });

  test('withdraw enough to cross the alert threshold flips status to yellow', async () => {
    // Medication has alertThresholdDays=5. After a 10-unit withdrawal, total30d=10,
    // dailyRate=10/30=0.333, stock=20 -> daysRemaining=60 (green still). Withdraw 15 more:
    // total30d=25, dailyRate=25/30=0.833, stock=5 -> daysRemaining=6 (still green).
    // Withdraw down to stock=3: daysRemaining=3/0.833=3.6 <= 5 -> yellow.
    let res = await auth(request(app).post(`/api/medications/${medicationId}/withdraw`)).send({
      quantity: 15,
    });
    expect(res.status).toBe(200);
    expect(res.body.medication.currentStock).toBe(5);

    res = await auth(request(app).post(`/api/medications/${medicationId}/withdraw`)).send({
      quantity: 2,
    });
    expect(res.status).toBe(200);
    expect(res.body.medication.currentStock).toBe(3);
    expect(res.body.medication.status).toBe('yellow');
  });

  test('withdraw more than current stock is rejected with 400 and stock is unchanged', async () => {
    const before = await auth(request(app).get('/api/medications')).query({ department: DEPT });
    const stockBefore = before.body.medications.find((m) => m.medicationId === medicationId).currentStock;

    const res = await auth(request(app).post(`/api/medications/${medicationId}/withdraw`)).send({
      quantity: 999999,
    });
    expect(res.status).toBe(400);

    const after = await auth(request(app).get('/api/medications')).query({ department: DEPT });
    const stockAfter = after.body.medications.find((m) => m.medicationId === medicationId).currentStock;
    expect(stockAfter).toBe(stockBefore);
  });

  test('restock increases stock and can clear the yellow alert', async () => {
    const res = await auth(request(app).post(`/api/medications/${medicationId}/restock`)).send({
      quantity: 500,
      department: DEPT,
    });

    expect(res.status).toBe(200);
    expect(res.body.medication.currentStock).toBe(503);
    expect(res.body.medication.status).toBe('green');
  });

  test('appears in /alerts while yellow, disappears once restocked to green', async () => {
    // Push it back into yellow territory first.
    await auth(request(app).post(`/api/medications/${medicationId}/withdraw`)).send({
      quantity: 490,
    });

    let alertsRes = await auth(request(app).get('/api/medications/alerts'));
    expect(alertsRes.body.alerts.some((a) => a.medicationId === medicationId)).toBe(true);

    await auth(request(app).post(`/api/medications/${medicationId}/restock`)).send({
      quantity: 1000,
      department: DEPT,
    });

    alertsRes = await auth(request(app).get('/api/medications/alerts'));
    expect(alertsRes.body.alerts.some((a) => a.medicationId === medicationId)).toBe(false);
  });

  test('reject invalid withdraw payload (non-positive quantity)', async () => {
    const res = await auth(request(app).post(`/api/medications/${medicationId}/withdraw`)).send({
      quantity: 0,
    });
    expect(res.status).toBe(400);
  });

  test('delete soft-deletes the medication (disappears from list, history preserved)', async () => {
    const res = await auth(request(app).delete(`/api/medications/${medicationId}`));
    expect(res.status).toBe(204);

    const list = await auth(request(app).get('/api/medications')).query({ department: DEPT });
    expect(list.body.medications.some((m) => m.medicationId === medicationId)).toBe(false);

    const { rows } = await pool.query('SELECT is_active FROM medications WHERE medication_id = $1', [medicationId]);
    expect(rows[0].is_active).toBe(false);

    const { rows: txRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM withdrawal_transactions WHERE medication_id = $1',
      [medicationId]
    );
    expect(txRows[0].count).toBeGreaterThan(0);
  });

  test('unauthenticated requests are rejected', async () => {
    const res = await request(app).get('/api/medications');
    expect(res.status).toBe(401);
  });
});
