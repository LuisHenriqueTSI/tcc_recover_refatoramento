import { supabase } from '../supabaseClient';

/**
 * Obter notificações do usuário
 */
export async function getNotifications(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        item_id,
        related_user_id,
        read,
        email_sent,
        created_at,
        profiles:related_user_id(name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao obter notificações:', error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro em getNotifications:', error);
    return { success: false, error, data: [] };
  }
}

/**
 * Obter contagem de notificações não lidas
 */
export async function getUnreadNotificationsCount() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false);

    if (error) {
      console.error('Erro ao obter contagem:', error);
      throw error;
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Erro em getUnreadNotificationsCount:', error);
    return { success: false, error, count: 0 };
  }
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro em markNotificationAsRead:', error);
    return { success: false, error };
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead() {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro em markAllNotificationsAsRead:', error);
    return { success: false, error };
  }
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao deletar notificação:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro em deleteNotification:', error);
    return { success: false, error };
  }
}

/**
 * Enviar email de notificação via Resend
 * Nota: Esta função deve ser chamada de uma Edge Function do Supabase
 */
export async function sendEmailNotification(notificationId) {
  try {
    // Buscar notificação
    const { data: notification, error: notifyError } = await supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        user_id,
        created_at
      `)
      .eq('id', notificationId)
      .single();

    if (notifyError) {
      console.error('Erro ao buscar notificação:', notifyError);
      return { success: false, error: notifyError };
    }

    // Buscar email do usuário
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(notification.user_id);

    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError);
      return { success: false, error: userError };
    }

    // Chamar Edge Function para enviar email
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-email-notification', {
      body: {
        notificationId: notification.id,
        userEmail: user.email,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.created_at
      }
    });

    if (emailError) {
      console.error('Erro ao enviar email:', emailError);
      return { success: false, error: emailError };
    }

    // Marcar como email enviado
    await supabase
      .from('notifications')
      .update({ email_sent: true })
      .eq('id', notificationId);

    return { success: true, data: emailResponse };
  } catch (error) {
    console.error('Erro em sendEmailNotification:', error);
    return { success: false, error };
  }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(userId, onNotification) {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new);
      }
    )
    .subscribe();

  return subscription;
}
