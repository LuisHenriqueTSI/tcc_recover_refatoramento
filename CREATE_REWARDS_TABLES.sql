-- ============================================
-- CRIAR TABELAS PARA SISTEMA DE RECOMPENSA
-- ============================================
-- Execute isto no Supabase SQL Editor

-- Tabela de Recompensas
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'BRL',
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'cancelled')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  claimed_at TIMESTAMP,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP
);

-- Tabela de Reclamações de Recompensa
CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  claimer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  message TEXT,
  evidence_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rewards_item_id ON rewards(item_id);
CREATE INDEX IF NOT EXISTS idx_rewards_owner_id ON rewards(owner_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward_id ON reward_claims(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_claimer_id ON reward_claims(claimer_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_status ON reward_claims(status);

-- Habilitar RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para rewards
CREATE POLICY "users_can_view_active_rewards"
  ON rewards FOR SELECT
  USING (status = 'active' OR owner_id = auth.uid());

CREATE POLICY "users_can_create_rewards"
  ON rewards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users_can_update_their_rewards"
  ON rewards FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "users_can_delete_their_rewards"
  ON rewards FOR DELETE
  USING (auth.uid() = owner_id AND status IN ('active', 'expired'));

-- Políticas de RLS para reward_claims
CREATE POLICY "users_can_view_their_claims"
  ON reward_claims FOR SELECT
  USING (auth.uid() = claimer_id OR auth.uid() IN (SELECT owner_id FROM rewards WHERE id = reward_id));

CREATE POLICY "users_can_create_claims"
  ON reward_claims FOR INSERT
  WITH CHECK (auth.uid() = claimer_id);

CREATE POLICY "users_can_view_their_claim_details"
  ON reward_claims FOR SELECT
  USING (
    auth.uid() = claimer_id OR 
    auth.uid() = (SELECT owner_id FROM rewards WHERE id = reward_id)
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_rewards()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rewards_update_timestamp
BEFORE UPDATE ON rewards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_rewards();

CREATE TRIGGER reward_claims_update_timestamp
BEFORE UPDATE ON reward_claims
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_rewards();

-- Função para marcar recompensas expiradas
CREATE OR REPLACE FUNCTION mark_expired_rewards()
RETURNS void AS $$
BEGIN
  UPDATE rewards
  SET status = 'expired'
  WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
