import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: string;
  title: string;
  clientName: string;
  location?: string;
  clientAvatar?: string;
  color: string;
  status: 'confirmado' | 'em_andamento' | 'concluido' | 'pendente';
  notes?: string;
}

const LOCAL_STORAGE_KEY = 'glowapp_appointments';

function mapFromDb(row: any): Appointment {
  return {
    id: row.id,
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
  };
}

function mapToDb(appointment: Appointment) {
  return {
    id: appointment.id,
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
    updated_at: new Date().toISOString(),
  };
}

export const appointmentService = {
  // Fetch all appointments
  async getAppointments(fallbackDefaults: Appointment[]): Promise<Appointment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('date', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapFromDb);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }

        // If table is empty in Supabase, seed defaults
        if (!error && data && data.length === 0 && fallbackDefaults.length > 0) {
          await this.seedAppointments(fallbackDefaults);
          return fallbackDefaults;
        }
      } catch (err) {
        console.warn('Erro ao buscar agendamentos do Supabase. Usando armazenamento local.', err);
      }
    }

    // LocalStorage Fallback
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler agendamentos do localStorage:', e);
    }

    return fallbackDefaults;
  },

  // Save or update an appointment
  async saveAppointment(appointment: Appointment): Promise<void> {
    // 1. Update local cache immediately
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      let list: Appointment[] = cached ? JSON.parse(cached) : [];
      const index = list.findIndex(a => a.id === appointment.id);
      if (index >= 0) {
        list[index] = appointment;
      } else {
        list.push(appointment);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao salvar agendamento localmente:', e);
    }

    // 2. Sync to Supabase
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

  // Delete an appointment
  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const list: Appointment[] = JSON.parse(cached);
        const filtered = list.filter(a => a.id !== appointmentId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').delete().eq('id', appointmentId);
      } catch (err) {
        console.error('Erro ao deletar agendamento no Supabase:', err);
      }
    }
  },

  // Seed initial appointments to Supabase
  async seedAppointments(appointments: Appointment[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase || appointments.length === 0) return;
    try {
      const rows = appointments.map(mapToDb);
      await supabase.from('appointments').upsert(rows, { onConflict: 'id' });
    } catch (err) {
      console.warn('Erro ao semear agendamentos no Supabase:', err);
    }
  }
};
