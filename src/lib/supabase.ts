import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://jiewqmiloeccdhzepzet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZXdxbWlsb2VjY2RoemVwemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczOTIxMzEsImV4cCI6MjA4Mjk2ODEzMX0.NBf8MdW726nGu1hzRcAbWUATb1JAw4iUu7ZooMNeTOE';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

