-- =============================================================================
-- Assign chapters to a governance user (table already exists)
-- =============================================================================
-- Replace REPLACE_WITH_GOVERNANCE_USER_UUID with your governance user's
-- profiles.id (e.g. from: SELECT id, email, chapter_id, role FROM profiles WHERE role = 'governance';)
-- =============================================================================

INSERT INTO governance_chapters (user_id, chapter_id)
VALUES
  ('REPLACE_WITH_GOVERNANCE_USER_UUID'::UUID, '94f00a0e-4148-4de0-8050-48ad13696ed6'::UUID),  -- Trailblaize Demo Chapter
  ('REPLACE_WITH_GOVERNANCE_USER_UUID'::UUID, '404e65ab-1123-44a0-81c7-e8e75118e741'::UUID),  -- Sigma Chi Eta (Ole Miss)
  ('REPLACE_WITH_GOVERNANCE_USER_UUID'::UUID, '1b3faaec-852d-4b0f-8474-db171dcffd57'::UUID)   -- Chapman Alpha Epsilon Pi (AEPi)
ON CONFLICT (user_id, chapter_id) DO NOTHING;
