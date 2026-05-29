import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hmtphoislgyutimqfysy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdHBob2lzbGd5dXRpbXFmeXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzMxMzEsImV4cCI6MjA5NDQ0OTEzMX0.Z2JqnIgtHFkZl4R59v3kqwEFKzIMchyidb9BUliY0CE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
