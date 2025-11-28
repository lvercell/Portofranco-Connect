
import { User, Booking, Announcement, Holiday, SubjectDef, AttendanceStatus } from '../types';
import { supabase } from './supabaseClient';
import { SUBJECTS_DATA as FALLBACK_SUBJECTS } from '../constants';

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
      }], { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .single();

    if (error) {
         if (error.code === '23505') return dataService.getUserById(user.id);
         throw error;
    }
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

  updateUser: async (id: string, updates: Partial<User>) => {
      if (!isSupabaseConfigured()) return;
      // Map frontend keys to DB keys
      const dbUpdates: any = { ...updates };
      if (updates.parentName) dbUpdates.parent_name = updates.parentName;
      if (updates.parentEmail) dbUpdates.parent_email = updates.parentEmail;
      if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
      if (updates.isLeader !== undefined) dbUpdates.is_leader = updates.isLeader;
      
      delete dbUpdates.parentName;
      delete dbUpdates.parentEmail;
      delete dbUpdates.isAdmin;
      delete dbUpdates.isLeader;

      await supabase!.from('users').update(dbUpdates).eq('id', id);
  },

  deleteUser: async (id: string) => {
      if (!isSupabaseConfigured()) return;
      // Also delete bookings to avoid constraint errors (or rely on cascade)
      await supabase!.from('bookings').delete().or(`student_id.eq.${id},teacher_id.eq.${id}`);
      await supabase!.from('users').delete().eq('id', id);
  },

  toggleLeaderStatus: async (userId: string, currentStatus: boolean) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('users').update({ is_leader: !currentStatus }).eq('id', userId);
  },

  approveUser: async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('users').update({ status: 'APPROVED' }).eq('id', userId);
  },

  // --- SUBJECTS (Dynamic) ---
  getSubjects: async (): Promise<SubjectDef[]> => {
      if (!isSupabaseConfigured()) return FALLBACK_SUBJECTS;
      const { data, error } = await supabase!.from('subjects').select('*').eq('active', true);
      
      if (error || !data || data.length === 0) return FALLBACK_SUBJECTS;
      return data;
  },

  createSubject: async (subject: SubjectDef) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('subjects').upsert([subject]);
  },

  deleteSubject: async (id: string) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('subjects').update({ active: false }).eq('id', id);
  },

  // --- BOOKINGS & ATTENDANCE ---
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
        teacherName: b.teacher_name,
        attendance: b.attendance || 'PENDING'
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
        date: date,
        attendance: 'PENDING'
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

  updateAttendance: async (bookingId: string, status: AttendanceStatus) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('bookings').update({ attendance: status }).eq('id', bookingId);
  },

  // --- ANNOUNCEMENTS, HOLIDAYS, AUTH ---
  getAnnouncements: async (): Promise<Announcement[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase!
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
    return (data || []).map((a: any) => ({ ...a, authorName: a.author_name }));
  },

  createAnnouncement: async (announcement: Announcement, sendEmail: boolean = false) => {
    if (!isSupabaseConfigured()) return;
    await supabase!.from('announcements').insert([{
        title: announcement.title,
        content: announcement.content,
        author_name: announcement.authorName,
        created_at: new Date().toISOString()
    }]);

    if (sendEmail) {
        // Here you would trigger an Edge Function or call an external API to send emails.
        // For MVP frontend-only: We can't safely send mass emails to all users from client.
        console.log("Email notification flag set for:", announcement.title);
    }
  },

  getHolidays: async (): Promise<Holiday[]> => {
      if (!isSupabaseConfigured()) return [];
      const { data } = await supabase!.from('holidays').select('*').order('date');
      return data || [];
  },

  createHoliday: async (date: string, reason: string) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('holidays').insert([{ date, reason }]);
  },

  createHolidayRange: async (startDate: string, endDate: string, reason: string) => {
      if (!isSupabaseConfigured()) return;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const holidays = [];

      for(let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)){
          holidays.push({
              date: new Date(dt).toISOString().split('T')[0],
              reason: reason
          });
      }
      // Bulk insert
      if(holidays.length > 0) {
          await supabase!.from('holidays').insert(holidays);
      }
  },

  deleteHoliday: async (id: string) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('holidays').delete().eq('id', id);
  },

  sendPasswordReset: async (email: string) => {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
    });
    if (error) throw error;
  },

  updatePassword: async (password: string) => {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase!.auth.updateUser({ password });
    if (error) throw error;
  },

  // --- SYSTEM SETTINGS (Dynamic Configuration) ---
  
  getClassDays: async (): Promise<number[]> => {
      if (!isSupabaseConfigured()) return [2, 4]; // Default Tue, Thu
      const { data } = await supabase!.from('system_settings').select('value').eq('key', 'class_days').single();
      if (data?.value) {
          try { return JSON.parse(data.value); } catch(e) { return [2, 4]; }
      }
      return [2, 4];
  },

  setClassDays: async (days: number[]) => {
      if (!isSupabaseConfigured()) return;
      await supabase!.from('system_settings').upsert({
          key: 'class_days',
          value: JSON.stringify(days)
      });
  },

  // --- UTILS ---
  generateId,
  
  getAvailableDates: (allowedDays: number[] = [2, 4]): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 60; i++) { // Extend to 60 days lookahead
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = d.getDay();
      if (allowedDays.includes(day)) { 
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    return dates;
  }
};
