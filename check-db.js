const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching modules...");
  const { data: modules, error: modErr } = await supabase
    .from('content_modules')
    .select('*')
    .order('ordre');
  
  if (modErr) {
    console.error("Error modules:", modErr);
  } else {
    console.log("Modules in DB:", modules);
  }

  console.log("\nCounting content items by type...");
  const { data: counts, error: countErr } = await supabase
    .from('content_items')
    .select('type')
  
  if (countErr) {
    console.error("Error items count:", countErr);
  } else {
    const tally = {};
    counts.forEach(item => {
      tally[item.type] = (tally[item.type] || 0) + 1;
    });
    console.log("Content items tally:", tally);
  }
}

main().catch(console.error);
