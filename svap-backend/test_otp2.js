require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const email = 'tosevo6397@diarshop.com';
  
  // 1. Generate link
  console.log('Generating link...');
  const { data: linkData, error: linkError } = await sbAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });
  
  if (linkError) {
    console.error('Link Error:', linkError);
    return;
  }
  
  console.log('Action Link:', linkData.properties.action_link);
  
  const url = new URL(linkData.properties.action_link);
  const token = url.searchParams.get('token');
  const token_hash = url.searchParams.get('token_hash');
  
  console.log('Extracted token:', token);
  console.log('Extracted token_hash:', token_hash);
  
  // 2. Verify using token
  console.log('\nVerifying token...');
  const { data: sessionData, error: sessionError } = await sbAdmin.auth.verifyOtp({
    email,
    token,
    type: 'magiclink',
  });
  
  if (sessionError) {
    console.error('Verify Error with token:', sessionError);
  } else {
    console.log('Success with token!', sessionData.user?.id);
  }

  // 3. Verify using token_hash
  if (sessionError && token_hash) {
    console.log('\nVerifying token_hash...');
    const { data: sessionData2, error: sessionError2 } = await sbAdmin.auth.verifyOtp({
      email,
      token_hash: token_hash,
      type: 'magiclink',
    });
    
    if (sessionError2) {
      console.error('Verify Error with token_hash:', sessionError2);
    } else {
      console.log('Success with token_hash!', sessionData2.user?.id);
    }
  }
}

test();
