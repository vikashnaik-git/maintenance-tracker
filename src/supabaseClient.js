
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://mhlvtyafgtqhhmqglgqk.supabase.co'
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obHZ0eWFmZ3RxaGhtcWdsZ3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMzUsImV4cCI6MjA3NzYyNzMzNX0.pArTk0JpcBD-lIu-B_oj80_K-OT13An7laDHt7-h9yU
const supabase = createClient(supabaseUrl, supabaseKey)
