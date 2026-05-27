const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking progress table...");
  const { data: prog, error: progErr } = await supabase.from('progress').select('*').limit(1);
  console.log("Progress:", progErr, prog);

  console.log("Checking children table...");
  const { data: child, error: childErr } = await supabase.from('children').select('*').limit(1);
  console.log("Children:", childErr, child);

  console.log("Checking content_items table...");
  const { data: items, error: itemsErr } = await supabase.from('content_items').select('*').limit(1);
  console.log("Content Items:", itemsErr, items);
}

main();
