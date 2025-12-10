import { supabase } from '../supabaseClient';

/**
 * Criar uma nova recompensa para um item
 * @param {string} itemId - ID do item
 * @param {Object} rewardData - Dados da recompensa
 * @returns {Object} Recompensa criada
 */
export async function createReward(itemId, rewardData) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { amount, currency = 'BRL', description = '', expiresAt = null } = rewardData;

  if (!amount || amount <= 0) {
    throw new Error('O valor da recompensa deve ser maior que 0');
  }

  const rewardPayload = {
    item_id: itemId,
    owner_id: user.id,
    amount: parseFloat(amount),
    currency,
    description,
    status: 'active',
    expires_at: expiresAt,
  };

  console.log('[createReward] Criando recompensa:', rewardPayload);

  const { data, error } = await supabase
    .from('rewards')
    .insert([rewardPayload])
    .select();

  if (error) {
    console.error('[createReward] Erro:', error);
    throw new Error(error.message || 'Erro ao criar recompensa');
  }

  console.log('[createReward] Recompensa criada com sucesso:', data[0]);
  return data[0];
}

/**
 * Atualizar uma recompensa existente
 * @param {string} rewardId - ID da recompensa
 * @param {Object} updateData - Dados a atualizar
 * @returns {Object} Recompensa atualizada
 */
export async function updateReward(rewardId, updateData) {
  const { data, error } = await supabase
    .from('rewards')
    .update(updateData)
    .eq('id', rewardId)
    .select();

  if (error) {
    throw new Error(error.message || 'Erro ao atualizar recompensa');
  }

  return data[0];
}

/**
 * Obter recompensa de um item
 * @param {string} itemId - ID do item
 * @returns {Object|null} Recompensa ou null
 */
export async function getRewardByItemId(itemId) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('item_id', itemId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('[getRewardByItemId] Erro:', error);
    return null;
  }

  return data || null;
}

/**
 * Listar recompensas do usuário (como proprietário)
 * @returns {Array} Lista de recompensas
 */
export async function getUserRewards() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('rewards')
    .select(`
      *,
      items (id, title, status),
      reward_claims (id, status, claimer_id, created_at, message)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Erro ao listar recompensas');
  }

  return data || [];
}

/**
 * Deletar uma recompensa
 * @param {string} rewardId - ID da recompensa
 * @returns {Object} Recompensa deletada
 */
export async function deleteReward(rewardId) {
  const { data, error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', rewardId)
    .select();

  if (error) {
    throw new Error(error.message || 'Erro ao deletar recompensa');
  }

  return data;
}

/**
 * Criar reclamação de recompensa
 * @param {string} rewardId - ID da recompensa
 * @param {Object} claimData - Dados da reclamação
 * @returns {Object} Reclamação criada
 */
export async function createRewardClaim(rewardId, claimData) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { message = '', evidenceNotes = '' } = claimData;

  // Verificar se já existe reclamação ativa
  const { data: existingClaims } = await supabase
    .from('reward_claims')
    .select('id')
    .eq('reward_id', rewardId)
    .eq('claimer_id', user.id)
    .eq('status', 'pending');

  if (existingClaims && existingClaims.length > 0) {
    throw new Error('Você já tem uma reclamação pendente para esta recompensa');
  }

  const claimPayload = {
    reward_id: rewardId,
    claimer_id: user.id,
    message,
    evidence_notes: evidenceNotes,
    status: 'pending',
  };

  console.log('[createRewardClaim] Criando reclamação:', claimPayload);

  const { data, error } = await supabase
    .from('reward_claims')
    .insert([claimPayload])
    .select();

  if (error) {
    console.error('[createRewardClaim] Erro:', error);
    throw new Error(error.message || 'Erro ao criar reclamação');
  }

  console.log('[createRewardClaim] Reclamação criada com sucesso:', data[0]);
  return data[0];
}

/**
 * Listar reclamações de recompensas do usuário
 * @returns {Array} Lista de reclamações
 */
export async function getUserRewardClaims() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('reward_claims')
    .select(`
      *,
      rewards (id, amount, currency, item_id, items (id, title))
    `)
    .eq('claimer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Erro ao listar reclamações');
  }

  return data || [];
}

/**
 * Listar reclamações para uma recompensa (para o proprietário do item)
 * @param {string} rewardId - ID da recompensa
 * @returns {Array} Lista de reclamações
 */
export async function getRewardClaimsForReward(rewardId) {
  const { data, error } = await supabase
    .from('reward_claims')
    .select(`
      *,
      claimer:claimer_id (id, email, user_metadata)
    `)
    .eq('reward_id', rewardId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Erro ao listar reclamações');
  }

  return data || [];
}

/**
 * Aprovar reclamação de recompensa
 * @param {string} claimId - ID da reclamação
 * @returns {Object} Reclamação atualizada
 */
export async function approveRewardClaim(claimId) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  // Buscar a reclamação e recompensa associada
  const { data: claim, error: claimError } = await supabase
    .from('reward_claims')
    .select('reward_id')
    .eq('id', claimId)
    .single();

  if (claimError) {
    throw new Error('Reclamação não encontrada');
  }

  // Verificar se o usuário é o proprietário da recompensa
  const { data: reward, error: rewardError } = await supabase
    .from('rewards')
    .select('owner_id, claimed_by')
    .eq('id', claim.reward_id)
    .single();

  if (rewardError || reward.owner_id !== user.id) {
    throw new Error('Não autorizado para aprovar esta reclamação');
  }

  if (reward.claimed_by && reward.claimed_by !== claim.claimer_id) {
    throw new Error('Esta recompensa já foi reivindicada por outro usuário');
  }

  // Atualizar reclamação e recompensa em transação
  const { data: updatedClaim, error: updateError } = await supabase
    .from('reward_claims')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', claimId)
    .select();

  if (updateError) {
    throw new Error(updateError.message || 'Erro ao aprovar reclamação');
  }

  // Atualizar recompensa como reclamada
  await updateReward(claim.reward_id, {
    status: 'claimed',
    claimed_at: new Date().toISOString(),
    claimed_by: updatedClaim[0].claimer_id,
  });

  return updatedClaim[0];
}

/**
 * Rejeitar reclamação de recompensa
 * @param {string} claimId - ID da reclamação
 * @param {string} reason - Motivo da rejeição (opcional)
 * @returns {Object} Reclamação atualizada
 */
export async function rejectRewardClaim(claimId, reason = '') {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  // Buscar a reclamação
  const { data: claim, error: claimError } = await supabase
    .from('reward_claims')
    .select('reward_id')
    .eq('id', claimId)
    .single();

  if (claimError) {
    throw new Error('Reclamação não encontrada');
  }

  // Verificar permissão
  const { data: reward, error: rewardError } = await supabase
    .from('rewards')
    .select('owner_id')
    .eq('id', claim.reward_id)
    .single();

  if (rewardError || reward.owner_id !== user.id) {
    throw new Error('Não autorizado para rejeitar esta reclamação');
  }

  const { data: updatedClaim, error: updateError } = await supabase
    .from('reward_claims')
    .update({
      status: 'rejected',
      evidence_notes: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', claimId)
    .select();

  if (updateError) {
    throw new Error(updateError.message || 'Erro ao rejeitar reclamação');
  }

  return updatedClaim[0];
}

/**
 * Cancelar recompensa
 * @param {string} rewardId - ID da recompensa
 * @returns {Object} Recompensa atualizada
 */
export async function cancelReward(rewardId) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se o usuário é o proprietário
  const { data: reward, error: rewardError } = await supabase
    .from('rewards')
    .select('owner_id, status')
    .eq('id', rewardId)
    .single();

  if (rewardError || reward.owner_id !== user.id) {
    throw new Error('Não autorizado para cancelar esta recompensa');
  }

  if (reward.status === 'claimed') {
    throw new Error('Não é possível cancelar uma recompensa já reivindicada');
  }

  return updateReward(rewardId, { status: 'cancelled' });
}

/**
 * Obter estatísticas de recompensas do usuário
 * @returns {Object} Estatísticas
 */
export async function getUserRewardStats() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: rewards, error } = await supabase
    .from('rewards')
    .select('status, amount')
    .eq('owner_id', user.id);

  if (error) {
    throw new Error('Erro ao buscar estatísticas');
  }

  const stats = {
    totalActive: 0,
    totalClaimed: 0,
    totalAmount: 0,
    claimedAmount: 0,
  };

  rewards?.forEach(reward => {
    if (reward.status === 'active') {
      stats.totalActive++;
      stats.totalAmount += reward.amount;
    } else if (reward.status === 'claimed') {
      stats.totalClaimed++;
      stats.claimedAmount += reward.amount;
    }
  });

  return stats;
}
