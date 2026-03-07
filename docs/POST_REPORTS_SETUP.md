# Post Reports Feature Setup

The post overflow menu includes a **Report** action that submits to `POST /api/posts/[id]/report`. This requires a `post_reports` table in your database.

## Migration

If you use Supabase migrations (e.g. in a sibling `supabase` project), add a new migration file and run it. Otherwise run the following SQL in the Supabase SQL editor.

```sql
-- post_reports: store user reports for posts (for moderation)
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reporter_id ON post_reports(reporter_id);

-- RLS: users can insert their own reports; chapter admins could be allowed to select (add policies as needed)
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own report"
  ON post_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
```

After applying this migration, the Report action in the post "..." menu will work. Until then, the API will return 500 with a message to ensure the table exists.
