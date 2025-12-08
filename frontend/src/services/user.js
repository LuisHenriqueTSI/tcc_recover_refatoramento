import { supabase } from '../supabaseClient';

// Serviço para obter dados do usuário autenticado
export async function getUser(token) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.debug('[getUser] error getting user', error);
    throw new Error('Não foi possível obter os dados do usuário');
  }
  
  // Buscar informações adicionais do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  const userData = {
    id: user.id,
    email: user.email,
    name: profile?.name || user.email?.split('@')[0] || 'Usuário',
    phone: profile?.phone,
    instagram: profile?.instagram,
    twitter: profile?.twitter,
    whatsapp: profile?.whatsapp,
    facebook: profile?.facebook,
    linkedin: profile?.linkedin,
    avatar: profile?.avatar
  };
  
  console.debug('[getUser] profile fetched', userData);
  return userData;
}
