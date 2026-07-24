require('dotenv').config({ path: 'e:/broshtech/SVAP/svap-backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sbAdmin.from('orders').select('*').limit(1).then(({ data, error }) => {
  if (error) console.error('Error:', error);
  else console.log('Columns:', data);
});
