import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envs: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) envs[key.trim()] = val.join('=').trim();
});

const url = envs['NEXT_PUBLIC_SUPABASE_URL'];
const key = envs['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(url, key);

async function checkHistories() {
  const { data, error } = await supabase.from('n8n_chat_histories').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('n8n_chat_histories Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No rows found');
    console.log('n8n_chat_histories Sample Data:', data);
  }
}

checkHistories();
