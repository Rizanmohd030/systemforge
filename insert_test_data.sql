INSERT INTO refined_ideas (session_id, product_name, description, target_users, core_features, full_data) 
VALUES (
  'test-session-id',
  'Project Manager',
  'A tool to manage projects',
  '["small teams", "enterprises"]'::jsonb,
  '[{"name": "Auth", "description": "User authentication"}, {"name": "Dashboard", "description": "Main dashboard"}]'::jsonb,
  '{}'::jsonb
);
