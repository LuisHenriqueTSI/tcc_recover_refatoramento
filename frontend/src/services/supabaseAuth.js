import { supabase } from '../supabaseClient';

export async function signUp(email, password, name) {
  // Try to include user metadata on signup (SDK supports passing options/data in some versions)
  let res;
  try {
    // Preferred: pass metadata in options (SDK may accept second param with data)
    res = await supabase.auth.signUp({ email, password }, { data: { name } });
  } catch (e) {
    // Fallback: call signUp without metadata
    res = await supabase.auth.signUp({ email, password });
  }

  // If user object is present (immediate sign-up), upsert a profile row
  try {
    const user = res?.data?.user || res?.user;
    if (user && user.id) {
      await supabase
        .from('profiles')
        .upsert({ id: user.id, name }, { onConflict: 'id' });
    }
  } catch (e) {
    // Do not fail signup if profile insert fails; log to console
    console.debug('Failed to upsert profile after signUp', e);
  }

  return res;
}

export async function signIn(email, password) {
  // First, try to sign in
  const res = await supabase.auth.signInWithPassword({ email, password });
  
  // If there's an error from auth, return it immediately
  if (res?.error) {
    return res;
  }
  
  // If sign in was successful, check if account is deleted
  if (res?.data?.user) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', res.data.user.id)
        .single();
      
      if (error) {
        console.debug('[signIn] Error fetching profile status:', error);
        // If profile doesn't exist, allow login anyway
        return res;
      }
      
      // If account is marked as deleted, sign out and return error
      if (profile?.status === 'deleted') {
        console.warn('[signIn] User account is deleted:', res.data.user.id);
        await supabase.auth.signOut();
        // Return error object instead of throwing
        return {
          data: null,
          error: new Error('Não existe essa conta')
        };
      }
    } catch (e) {
      console.debug('[signIn] Error checking account status:', e);
      // Continue on other errors - don't block login for status check issues
    }
  }
  
  return res;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user;
}

export async function signOut() {
  return await supabase.auth.signOut();
}
