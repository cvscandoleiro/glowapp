import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Appointment {
  id: string;
  clientId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: string;
  title: string;
  clientName: string;
  location?: string;
  clientAvatar?: string;
  color: string;
  status: 'confirmado' | 'em_andamento' | 'concluido' | 'pendente' | 'cancelado';
  notes?: string;
  price?: number;
  services?: {
    id: string;
    name: string;
    price: number;
    category?: string;
  }[];
}


function mapFromDb(row: any): Appointment {
  return {
    id: row.id,
    clientId: row.client_id || '',
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category || 'Geral',
    title: row.title || 'Agendamento',
    clientName: row.client_name || '',
    location: row.location || '',
    clientAvatar: row.client_avatar || '',
    color: row.color || '#8b5cf6',
    status: row.status || 'confirmado',
    notes: row.notes || '',
    price: row.price || 0,
    services: row.services || [],
  };
}

function mapToDb(appointment: Appointment) {
  return {
    id: appointment.id,
    client_id: appointment.clientId || null,
    date: appointment.date,
    start_time: appointment.startTime,
    end_time: appointment.endTime,
    category: appointment.category,
    title: appointment.title,
    client_name: appointment.clientName,
    location: appointment.location,
    client_avatar: appointment.clientAvatar,
    color: appointment.color,
    status: appointment.status,
    notes: appointment.notes,
    price: appointment.price || 0,
    services: appointment.services || [],
    updated_at: new Date().toISOString(),
  };
}

export const appointmentService = {
  // Fetch all appointments directly from Supabase database
  async getAppointments(): Promise<Appointment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('date', { ascending: true });

        if (error) {
          console.error('Erro ao buscar agendamentos do Supabase:', error);
          return [];
        }

        if (data && Array.isArray(data)) {
          return data.map(mapFromDb);
        }
      } catch (err) {
        console.error('Falha de conexão com o banco de dados ao buscar agendamentos:', err);
      }
    }

    return [];
  },

  // Save or update an appointment directly in Supabase
  async saveAppointment(appointment: Appointment): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('appointments')
          .upsert(mapToDb(appointment), { onConflict: 'id' });

        if (error) {
          console.error('Erro ao salvar agendamento no Supabase:', error);
        }
      } catch (err) {
        console.error('Falha de conexão com o Supabase ao salvar agendamento:', err);
      }
    }
  },

  // Delete an appointment directly in Supabase
  async deleteAppointment(appointmentId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointmentId);

        if (error) {
          console.error('Erro ao deletar agendamento no Supabase:', error);
        }
      } catch (err) {
        console.error('Erro ao deletar agendamento no Supabase:', err);
      }
    }
  }
};
