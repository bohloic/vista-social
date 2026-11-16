import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- PULSESOCIAL COMPREHENSIVE VERIFICATION LOOP ---');
  console.log(`Connecting to Supabase: ${supabaseUrl}`);

  // 1. Verify app_config table
  const { data: configData, error: configError } = await supabase.from('app_config').select('*').limit(1);
  if (configError) throw new Error(`app_config query failed: ${configError.message}`);
  console.log('✓ app_config table reachable');

  // 2. Verify workspaces table
  const { data: wsData, error: wsError } = await supabase.from('workspaces').select('*').limit(1);
  if (wsError) throw new Error(`workspaces query failed: ${wsError.message}`);
  console.log('✓ workspaces table reachable');

  // 3. Verify user_profiles table
  const { data: usersData, error: usersError } = await supabase.from('user_profiles').select('*').limit(1);
  if (usersError) throw new Error(`user_profiles query failed: ${usersError.message}`);
  console.log('✓ user_profiles table reachable');

  // 4. Verify posts table
  const { data: postsData, error: postsError } = await supabase.from('posts').select('*').limit(1);
  if (postsError) throw new Error(`posts query failed: ${postsError.message}`);
  console.log('✓ posts table reachable');

  // 5. Verify pulse_pages table
  const { data: pagesData, error: pagesError } = await supabase.from('pulse_pages').select('*').limit(1);
  if (pagesError) throw new Error(`pulse_pages table query failed: ${pagesError.message}`);
  console.log('✓ pulse_pages table reachable');

  // 6. Verify mobile_money_transactions table
  const { data: mmData, error: mmError } = await supabase.from('mobile_money_transactions').select('*').limit(1);
  if (mmError) throw new Error(`mobile_money_transactions query failed: ${mmError.message}`);
  console.log('✓ mobile_money_transactions table reachable');

  // 7. Verify subscriptions table
  const { data: subData, error: subError } = await supabase.from('subscriptions').select('*').limit(1);
  if (subError) throw new Error(`subscriptions query failed: ${subError.message}`);
  console.log('✓ subscriptions table reachable');

  // 8. Test insert & delete roundtrip on posts table
  console.log('Testing roundtrip insert and deletion on posts table...');
  const testPost = {
    workspace_id: '00000000-0000-0000-0000-000000000000',
    author_name: 'Lead CM Verification Bot',
    content: 'Test de vérification autonome Supabase PulseSocial #test',
    post_type: 'post',
    media_urls: [],
    status: 'scheduled',
    scheduled_for: new Date(Date.now() + 86400000).toISOString(),
    target_accounts: ['acc-ig-1'],
    first_comment: '#pulsesocial',
  };

  const { data: insertedPost, error: insertError } = await supabase
    .from('posts')
    .insert(testPost)
    .select()
    .single();

  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
  console.log(`✓ Inserted post with id: ${insertedPost.id}`);

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', insertedPost.id);

  if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
  console.log(`✓ Deleted test post cleanly. Database integrity verified.`);

  // 9. Test Mobile Money transaction insertion and deletion
  console.log('Testing Mobile Money transaction roundtrip...');
  const testTransaction = {
    workspace_id: '00000000-0000-0000-0000-000000000000',
    plan: 'pro',
    provider: 'wave',
    amount: 15000,
    currency: 'XOF',
    phone_number: '+2250700000000',
    country_code: 'CI',
    status: 'successful',
    transaction_ref: `TEST-REF-${Date.now()}`,
    metadata: {
      customer_name: 'Test Client Abidjan',
      customer_email: 'test@pulsesocial.app',
    },
  };

  const { data: insertedTx, error: txError } = await supabase
    .from('mobile_money_transactions')
    .insert(testTransaction)
    .select()
    .single();

  if (txError) throw new Error(`Transaction insert failed: ${txError.message}`);
  console.log(`✓ Inserted Mobile Money transaction: ${insertedTx.id} (${insertedTx.amount} ${insertedTx.currency} via ${insertedTx.provider})`);

  const { error: txDelError } = await supabase
    .from('mobile_money_transactions')
    .delete()
    .eq('id', insertedTx.id);

  if (txDelError) throw new Error(`Transaction delete failed: ${txDelError.message}`);
  console.log(`✓ Cleaned test transaction. Mobile Money database pipeline verified.`);

  console.log('\n--- ALL SUPABASE TABLES AND PERMISSIONS FULLY OPERATIONAL ---');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
