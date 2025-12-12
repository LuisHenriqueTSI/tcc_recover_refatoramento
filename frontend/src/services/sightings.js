import supabase from '../supabaseClient';

/**
 * Criar um novo avistamento
 */
export async function createSighting({
  itemId,
  userId,
  location,
  description,
  contactInfo,
  photo = null
}) {
  try {
    let photoUrl = null;

    // Upload da foto se fornecida
    if (photo) {
      const fileName = `${itemId}/${Date.now()}-${photo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, photo);

      if (uploadError) {
        console.error('Erro ao fazer upload da foto:', uploadError);
        throw uploadError;
      }

      // Obter URL pública da foto
      const { data } = supabase.storage
        .from('item-photos')
        .getPublicUrl(fileName);

      photoUrl = data.publicUrl;
    }

    // Inserir avistamento no banco de dados
    const { data, error } = await supabase
      .from('sightings')
      .insert([
        {
          item_id: itemId,
          user_id: userId,
          location,
          description,
          contact_info: contactInfo,
          photo_url: photoUrl
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao criar avistamento:', error);
      throw error;
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro em createSighting:', error);
    return { success: false, error };
  }
}

/**
 * Obter avistamentos de um item
 */
export async function getSightings(itemId) {
  try {
    const { data, error } = await supabase
      .from('sightings')
      .select(`
        id,
        location,
        description,
        photo_url,
        contact_info,
        created_at,
        user_id,
        profiles (name, avatar_url)
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao obter avistamentos:', error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro em getSightings:', error);
    return { success: false, error, data: [] };
  }
}

/**
 * Deletar um avistamento
 */
export async function deleteSighting(sightingId) {
  try {
    const { error } = await supabase
      .from('sightings')
      .delete()
      .eq('id', sightingId);

    if (error) {
      console.error('Erro ao deletar avistamento:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro em deleteSighting:', error);
    return { success: false, error };
  }
}

/**
 * Obter estatísticas de avistamentos de um item
 */
export async function getSightingStats(itemId) {
  try {
    const { data, error } = await supabase
      .from('sightings')
      .select('id', { count: 'exact' })
      .eq('item_id', itemId);

    if (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Erro em getSightingStats:', error);
    return { success: false, error, count: 0 };
  }
}
