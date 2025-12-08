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
      await supabase.from('profiles').upsert({ id: user.id, name }).eq('id', user.id);
    }
  } catch (e) {
    // Do not fail signup if profile insert fails; log to console
    console.debug('Failed to upsert profile after signUp', e);
  }

  return res;
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user;
}

export async function signOut() {
  return await supabase.auth.signOut();
}
