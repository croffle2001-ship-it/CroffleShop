import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drraaczkqfeytsunvcud.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmFhY3prcWZleXRzdW52Y3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODM3MDksImV4cCI6MjA5OTE1OTcwOX0.iOQZdyIju8dVM72N2OsWM0qeG0tUwK2-YclmK1U1gQA';

export const supabase = createClient(supabaseUrl, supabaseKey);