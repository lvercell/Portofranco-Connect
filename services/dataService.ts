import { User, Booking, Announcement } from '../types';
import { supabase } from './supabaseClient';

// Helper to check if Supabase is connected
const isSupabaseConfigured = () => {
    return !!supabase;
};

export const dataService = {
  
  // --- USERS ---

  createUser: async (user: User): Promise<User | null> => {
    if (!isSupabaseConfigured()) throw new Error("Supabase not connected");
    
    // We insert into the 'public.users' table. 
    // The 'id' MUST match the auth.uid() from the registered user in AuthContext.
    const { data, error } = await supabase!
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getUserById: async (id: string): Promise<User | null> => {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) return null;
    return data;
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
     if (!isSupabaseConfigured()) return null;
     const { data, error } = await supabase!
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();

    if (error) return null;
    return data;
  },

  getAllUsers: async (): Promise<User[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase!.from('users').select('*');
    return data || [];
  },

  toggleLeaderStatus: async (userId: string, currentStatus: boolean) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('users').update({ is_leader: !currentStatus }).eq('id', userId);
  },

  // --- BOOKINGS ---

  getBookings: async (): Promise<Booking[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase!
        .from('bookings')
        .select('*');
    if (error) console.error(error);
    return data || [];
  },

  createBooking: async (student: User, subjectId: string, date: string) => {
    if (!isSupabaseConfigured()) return;

    // 1. Check constraints
    const { data: studentBookings } = await supabase!
        .from('bookings')
        .select('*')
        .eq('student_id', student.id)
        .eq('date', date);
    
    if (studentBookings && studentBookings.length >= 2) {
        throw new Error("MAX_SUBJECTS");
    }

    if (studentBookings?.find(b => b.subjectId === subjectId)) {
        throw new Error("DUPLICATE_SUBJECT");
    }

    const newBooking = {
      student_id: student.id,
      student_name: student.name,
      subject_id: subjectId, // maps to subjectId col in DB
      date: date
    };

    // Note: ensure DB columns are snake_case: student_id, etc.
    // I am mapping the object keys to snake_case for Supabase if needed, 
    // but usually it's easier to keep TS types matching DB or map them.
    // For this prototype, I will assume the DB columns created in SQL match the keys here 
    // OR I will map them explicitly.
    const { error } = await supabase!.from('bookings').insert([{
        student_id: student.id,
        student_name: student.name,
        subject_id: subjectId,
        date: date
    }]);

    if (error) throw error;
  },

  cancelBooking: async (bookingId: string) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('bookings').delete().eq('id', bookingId);
  },

  claimBooking: async (bookingId: string, teacher: User) => {
    if (!isSupabaseConfigured()) return;
    
    // Check if already claimed
    const { data: booking } = await supabase!
        .from('bookings')
        .select('teacher_id')
        .eq('id', bookingId)
        .single();
        
    if (booking?.teacher_id) throw new Error("Already claimed");

    await supabase!.from('bookings').update({
        teacher_id: teacher.id,
        teacher_name: teacher.name
    }).eq('id', bookingId);
  },

  unclaimBooking: async (bookingId: string) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('bookings').update({
        teacher_id: null,
        teacher_name: null
    }).eq('id', bookingId);
  },

  updateBookingNotes: async (bookingId: string, notes: string) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('bookings').update({ notes }).eq('id', bookingId);
  },

  // --- ANNOUNCEMENTS ---

  getAnnouncements: async (): Promise<Announcement[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase!
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
    return data || [];
  },

  createAnnouncement: async (announcement: Announcement) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('announcements').insert([{
        title: announcement.title,
        content: announcement.content,
        author_name: announcement.authorName,
        date: announcement.date
    }]);
  },

  // --- UTILS ---

  getAvailableDates: (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 15; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = d.getDay();
      if (day === 2 || day === 4) { // Tuesday (2) & Thursday (4)
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    return dates;
  }
};
