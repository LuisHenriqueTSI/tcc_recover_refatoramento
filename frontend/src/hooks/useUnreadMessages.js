import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Verifica a cada 15 segundos
    const interval = setInterval(fetchUnreadCount, 15000);
    
    // Escutar evento customizado de mensagens lidas
    const handleMessagesRead = () => {
      console.log('[useUnreadMessages] Messages read event received, refreshing count');
      fetchUnreadCount();
    };
    window.addEventListener('messages-read', handleMessagesRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-read', handleMessagesRead);
    };
  }, []);

  async function fetchUnreadCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (!error) {
        const count = data?.length || 0;
        console.log('[useUnreadMessages] Unread count:', count);
        setUnreadCount(count);
      } else {
        console.error('[useUnreadMessages] Error:', error);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('[useUnreadMessages] Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
}
