
export enum Role {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

// Subject is now a full object, not just an enum, to support the specific list from the image
export interface SubjectDef {
  id: string;
  translations: { [key in string]: string }; // Map lang code to name
  color: string;
  icon: string; // Emoji or icon name
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: Role;
  age: number;
  dob?: string;
  status?: string;
  isAdmin?: boolean;
  isLeader?: boolean;
  parentName?: string;
  parentEmail?: string;
  subjects?: string[]; // Array of Subject IDs
}

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string; // Reference to SubjectDef ID
  date: string; // ISO Date string (YYYY-MM-DD)
  teacherId?: string;
  teacherName?: string;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
}

export interface Holiday {
  id: string;
  date: string;
  reason: string;
}

export type Language = 'it' | 'es' | 'en' | 'fr' | 'de';

export const SUPPORTED_LANGUAGES: { [key in Language]: string } = {
  it: 'Italiano',
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch'
};
