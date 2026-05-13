import { queryOne } from './src/lib/db/index.js';

const sessionId = '26d258e5-6525-4d01-bb10-eb998496610e';

const result = await queryOne(
  `INSERT INTO refined_ideas (session_id, product_name, description, target_users, core_features)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *`,
  [
    sessionId,
    'Project Manager',
    'A tool to manage projects',
    JSON.stringify(['small teams', 'enterprises']),
    JSON.stringify([
      { name: 'Auth', description: 'User authentication' },
      { name: 'Dashboard', description: 'Main dashboard' }
    ]),
  ]
);

console.log('Inserted:', result);
