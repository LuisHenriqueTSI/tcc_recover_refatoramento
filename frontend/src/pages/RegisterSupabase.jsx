import SimpleSidebar from '../components/SimpleSidebar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn } from '../services/supabaseAuth';

export default function RegisterSupabase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!name || name.trim() === '') {
      setError('Por favor, informe seu nome');
      setLoading(false);
      return;
    }
    const res = await signUp(email, password, name);
    if (res?.error) {
      setError(res.error.message || 'Erro ao registrar');
      setLoading(false);
      return;
    }

    // Try to sign in immediately to obtain token and sync profile via backend
    try {
      const signin = await signIn(email, password);
      const token = signin?.data?.session?.access_token || signin?.data?.access_token || signin?.access_token;
      if (token) {
        await fetch('http://localhost:8000/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name })
        });
      }
    } catch (e) {
      // ignore sync errors, user can login later
      console.debug('sync-profile failed', e);
    }

    navigate('/login');
    setLoading(false);
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background-dark">
      <SimpleSidebar onCollapseChange={setSidebarCollapsed} />
      <div className={`flex items-center justify-center p-4 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
        <div className="max-w-md w-full bg-surface-dark rounded-xl p-8 border border-white/10">
        <h2 className="text-3xl font-bold mb-6 text-white text-center">📝 Registrar Usuário</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-text-primary-dark mb-2">Nome</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="form-input px-4 py-2 rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-white/10 bg-surface-dark h-11 placeholder:text-text-secondary-dark text-sm font-normal"
              placeholder="Seu nome"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-text-primary-dark mb-2">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="form-input px-4 py-2 rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-white/10 bg-surface-dark h-11 placeholder:text-text-secondary-dark text-sm font-normal"
              placeholder="seu@email.com"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-text-primary-dark mb-2">Senha</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="form-input px-4 py-2 rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-white/10 bg-surface-dark h-11 placeholder:text-text-secondary-dark text-sm font-normal"
              placeholder="••••••••"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold transition-colors"
            >
              {loading ? '⏳ Registrando...' : '✅ Registrar'}
            </button>
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 px-6 py-3 rounded-lg bg-surface-dark/60 hover:bg-surface-dark border border-white/10 hover:border-white/20 text-text-primary-dark font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
        {error && <div className="mt-4 text-red-400 text-sm text-center bg-red-500/20 border border-red-500/50 rounded-lg p-3 font-semibold">{error}</div>}
        <div className="mt-6 text-center text-text-secondary-dark text-sm">
          Já tem conta? <button onClick={() => navigate('/login')} className="text-primary hover:text-primary/80 font-semibold transition">Entrar</button>
        </div>
        </div>
      </div>
    </div>
  );
}
