-- SystemForge Agentic Architecture Database Schema
-- Run this in pgAdmin on your systemforge_agentic database

-- 1. Conversational Sessions
CREATE TABLE IF NOT EXISTS conversational_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'active'
);

-- 2. Conversation History (each message in a session)
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES conversational_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' | 'ai' | 'system'
  message TEXT NOT NULL,
  intent JSONB, -- AI extracted intent
  action_executed JSONB, -- Backend action taken
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Action Log (tracks all executed actions)
CREATE TABLE IF NOT EXISTS action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversational_sessions(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'executing' | 'success' | 'failed'
  input_params JSONB,
  output_data JSONB,
  error_message TEXT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255)
);

-- 4. Capabilities Registry (what AI can do)
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module_name VARCHAR(50),
  params_schema JSONB NOT NULL, -- Zod schema as JSON
  requires_approval BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Log (who changed what)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL, -- 'create' | 'update' | 'delete'
  old_value JSONB,
  new_value JSONB,
  user_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tech Stack Templates (predefined stacks for deterministic recommendations)
CREATE TABLE IF NOT EXISTS tech_stack_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_name VARCHAR(100) NOT NULL,
  frontend VARCHAR(255),
  backend VARCHAR(255),
  database VARCHAR(255),
  description TEXT,
  why_preferred TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  cost_tier VARCHAR(20), -- 'free' | 'cheap' | 'moderate' | 'premium'
  performance_tier VARCHAR(20), -- 'low' | 'medium' | 'high'
  scalability_tier VARCHAR(20), -- 'limited' | 'moderate' | 'excellent'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Refined Ideas (cached refined product concepts)
CREATE TABLE IF NOT EXISTS refined_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversational_sessions(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  description TEXT,
  target_users JSONB, -- array of strings
  core_features JSONB, -- array of strings
  architect_advice JSONB, -- array of trade-off branches
  full_data JSONB, -- complete refined concept
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversation_history_session ON conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_action_log_session ON action_log(session_id);
CREATE INDEX IF NOT EXISTS idx_action_log_status ON action_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_refined_ideas_session ON refined_ideas(session_id);
