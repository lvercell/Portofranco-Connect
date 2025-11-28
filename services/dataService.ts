
import { User, Booking, Announcement, Holiday } from '../types';
import { supabase } from './supabaseClient';

const isSupabaseConfigured = () => !!supabase;
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const dataService = {
  
  // --- USERS ---

  createUser: async (user: User): Promise<User | null> => {
    if (!isSupabaseConfigured()) throw new Error("Supabase not connected");
    const { data, error } = await supabase!
      .from('users')
      .upsert([{
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          age: user.age,
          dob: user.dob,
          parent_name: user.parentName,
          parent_email: user.parentEmail,
          status: 'PENDING'
      }], { onConflict: 'id' })
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
    return {
        ...data,
        parentName: data.parent_name,
        parentEmail: data.parent_email,
        isAdmin: data.is_admin,
        isLeader: data.is_leader
    };
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
     if (!isSupabaseConfigured()) return null;
     const { data, error } = await supabase!
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();
    if (error) return null;
    return {
        ...data,
        parentName: data.parent_name,
        parentEmail: data.parent_email,
        isAdmin: data.is_admin,
        isLeader: data.is_leader
    };
  },

  getAllUsers: async (): Promise<User[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase!.from('users').select('*').order('name');
    return (data || []).map((u: any) => ({
        ...u,
        parentName: u.parent_name,
        parentEmail: u.parent_email,
        isAdmin: u.is_admin,
        isLeader: u.is_leader
    }));
  },

  getPendingUsers: async (): Promise<User[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase!
        .from('users')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
    return (data || []).map((u: any) => ({
        ...u,
        parentName: u.parent_name,
        parentEmail: u.parent_email,
        isAdmin: u.is_admin,
        isLeader: u.is_leader
    }));
  },

  toggleLeaderStatus: async (userId: string, currentStatus: boolean) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('users').update({ is_leader: !currentStatus }).eq('id', userId);
  },

  approveUser: async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('users').update({ status: 'APPROVED' }).eq('id', userId);
  },

  // --- AUTH UTILS ---
  sendPasswordReset: async (email: string) => {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  },

  updatePassword: async (password: string) => {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase!.auth.updateUser({ password });
    if (error) throw error;
  },

  // --- BOOKINGS ---
  getBookings: async (): Promise<Booking[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase!.from('bookings').select('*');
    if (error) console.error(error);
    return (data || []).map((b: any) => ({
        ...b,
        studentId: b.student_id,
        studentName: b.student_name,
        subjectId: b.subject_id,
        teacherId: b.teacher_id,
        teacherName: b.teacher_name
    }));
  },

  createBooking: async (student: User, subjectId: string, date: string) => {
    if (!isSupabaseConfigured()) return;
    const { data: studentBookings } = await supabase!
        .from('bookings')
        .select('*')
        .eq('student_id', student.id)
        .eq('date', date);
    
    if (studentBookings && studentBookings.length >= 2) throw new Error("MAX_SUBJECTS");
    if (studentBookings?.find(b => b.subject_id === subjectId)) throw new Error("DUPLICATE_SUBJECT");

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
    return (data || []).map((a: any) => ({ ...a, authorName: a.author_name }));
  },

  createAnnouncement: async (announcement: Announcement) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('announcements').insert([{
        title: announcement.title,
        content: announcement.content,
        author_name: announcement.authorName,
        created_at: new Date().toISOString()
    }]);
  },

  // --- HOLIDAYS ---
  getHolidays: async (): Promise<Holiday[]> => {
      if (!isSupabaseConfigured()) return [];
      const { data } = await supabase!.from('holidays').select('*').order('date');
      return data || [];
  },

  createHoliday: async (date: string, reason: string) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('holidays').insert([{ date, reason }]);
  },

  deleteHoliday: async (id: string) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('holidays').delete().eq('id', id);
  },

  // --- SYSTEM SETTINGS ---
  getSystemSettings: async (key: string): Promise<string | null> => {
      if (!isSupabaseConfigured()) return null;
      const { data } = await supabase!
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();
      return data?.value || null;
  },

  setSystemSettings: async (key: string, value: string) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('system_settings').upsert([{ key, value }]);
  },

  // --- UTILS ---
  generateId,
  getAvailableDates: (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) { // Extended to 30 days
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
