
import { User, Booking, Announcement, Role } from '../types';

// Robust ID Generator
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Feature detection for LocalStorage
const isLocalStorageAvailable = () => {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
};

const useMemory = !isLocalStorageAvailable();
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    if (useMemory) return memoryStore.get(key) || null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (useMemory) {
        memoryStore.set(key, value);
    } else {
        localStorage.setItem(key, value);
    }
  }
};

// Mock Data Initialization
const initData = () => {
  let users: User[] = JSON.parse(safeStorage.getItem('users') || '[]');

  // 1. Ensure Admin exists
  const adminEmail = 'lvercell@gmail.com';
  const adminUser: User = {
    id: 'admin-seed-id',
    name: 'Sistema Admin',
    email: adminEmail,
    password: '060696Satanas', 
    phone: '+39 000 000 0000',
    role: Role.TEACHER, 
    age: 40,
    isAdmin: true,
    isLeader: true,
    subjects: []
  };

  const existingAdminIndex = users.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase());
  if (existingAdminIndex !== -1) {
    users[existingAdminIndex] = { ...users[existingAdminIndex], ...adminUser };
  } else {
    users.push(adminUser);
    console.log(`System Admin initialized: ${adminEmail}`);
  }

  // 2. Ensure Seed Student exists
  const studentEmail = 'student@doposcuola.com';
  const existingStudent = users.find(u => u.email.toLowerCase() === studentEmail);
  if (!existingStudent) {
    const studentUser: User = {
        id: 'student-seed-id',
        name: 'Mario Rossi',
        email: studentEmail,
        password: '1234',
        phone: '123456789',
        role: Role.STUDENT,
        age: 15,
        parentName: 'Luigi Rossi',
        parentEmail: 'papa@rossi.com',
        subjects: []
    };
    users.push(studentUser);
    console.log(`Seed Student initialized: ${studentEmail}`);
  }

  // Persist users back
  safeStorage.setItem('users', JSON.stringify(users));

  if (!safeStorage.getItem('bookings')) safeStorage.setItem('bookings', '[]');
  if (!safeStorage.getItem('announcements')) safeStorage.setItem('announcements', '[]');
};

initData();

export const dataService = {
  generateId, 

  // User Methods
  getUsers: (): User[] => JSON.parse(safeStorage.getItem('users') || '[]'),
  
  createUser: (user: User) => {
    const users = dataService.getUsers();
    
    if (user.email.toLowerCase() === 'lvercell@gmail.com') {
        user.isAdmin = true;
        user.isLeader = true; 
    }

    if (!user.id) user.id = generateId();

    users.push(user);
    safeStorage.setItem('users', JSON.stringify(users));
    return user;
  },

  getUserByEmail: (email: string): User | undefined => {
    const users = dataService.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  toggleLeaderStatus: (userId: string) => {
    const users = dataService.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].isLeader = !users[index].isLeader;
        safeStorage.setItem('users', JSON.stringify(users));
    }
  },

  // Booking Methods
  getBookings: (): Booking[] => JSON.parse(safeStorage.getItem('bookings') || '[]'),

  createBooking: (student: User, subjectId: string, date: string) => {
    const bookings = dataService.getBookings();
    
    const studentDailyBookings = bookings.filter(b => b.studentId === student.id && b.date === date);
    if (studentDailyBookings.length >= 2) {
      throw new Error("MAX_SUBJECTS");
    }
    
    if (studentDailyBookings.find(b => b.subjectId === subjectId)) {
      throw new Error("DUPLICATE_SUBJECT");
    }

    const newBooking: Booking = {
      id: generateId(),
      studentId: student.id,
      studentName: student.name,
      subjectId,
      date,
    };
    
    bookings.push(newBooking);
    safeStorage.setItem('bookings', JSON.stringify(bookings));
  },

  cancelBooking: (bookingId: string) => {
    let bookings = dataService.getBookings();
    bookings = bookings.filter(b => b.id !== bookingId);
    safeStorage.setItem('bookings', JSON.stringify(bookings));
  },

  claimBooking: (bookingId: string, teacher: User) => {
    const bookings = dataService.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    
    if (index === -1) throw new Error("Booking not found");
    if (bookings[index].teacherId) throw new Error("Already claimed");

    const teacherDailyBookings = bookings.filter(b => b.teacherId === teacher.id && b.date === bookings[index].date);
    
    bookings[index].teacherId = teacher.id;
    bookings[index].teacherName = teacher.name;
    
    safeStorage.setItem('bookings', JSON.stringify(bookings));
  },

  unclaimBooking: (bookingId: string) => {
    const bookings = dataService.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
        delete bookings[index].teacherId;
        delete bookings[index].teacherName;
        safeStorage.setItem('bookings', JSON.stringify(bookings));
    }
  },

  updateBookingNotes: (bookingId: string, notes: string) => {
    const bookings = dataService.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      bookings[index].notes = notes;
      safeStorage.setItem('bookings', JSON.stringify(bookings));
    }
  },

  // Announcement Methods
  getAnnouncements: (): Announcement[] => JSON.parse(safeStorage.getItem('announcements') || '[]'),

  createAnnouncement: (announcement: Announcement) => {
    const list = dataService.getAnnouncements();
    if (!announcement.id) announcement.id = generateId();
    list.unshift(announcement); 
    safeStorage.setItem('announcements', JSON.stringify(list));
  },

  getAvailableDates: (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 15; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = d.getDay();
      if (day === 2 || day === 4) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    return dates;
  }
};
