export interface DailyAttendance {
  date: number; // 1-31
  checkIn: string | null; // e.g., "06:45", null if absent
  checkOut: string | null; // e.g., "15:30"
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Cuti' | 'Alpha' | 'Libur';
}

export interface EmployeeAttendance {
  id: string;
  name: string;
  role: 'Guru' | 'Karyawan';
  photoUrl: string;
  records: DailyAttendance[];
  summary: {
    hadir: number;
    sakit: number;
    izin: number;
    cuti: number;
    alpha: number;
  };
}

const generateRandomTime = (startHour: number, endHour: number) => {
  const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const generateMockRecords = (month: number, year: number): DailyAttendance[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const records: DailyAttendance[] = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      records.push({ date: i, checkIn: null, checkOut: null, status: 'Libur' });
      continue;
    }

    const rand = Math.random();
    if (rand < 0.85) {
      records.push({
        date: i,
        checkIn: generateRandomTime(6, 7), // 06:00 - 07:59
        checkOut: generateRandomTime(15, 16), // 15:00 - 16:59
        status: 'Hadir',
      });
    } else if (rand < 0.9) {
      records.push({ date: i, checkIn: null, checkOut: null, status: 'Sakit' });
    } else if (rand < 0.95) {
      records.push({ date: i, checkIn: null, checkOut: null, status: 'Izin' });
    } else {
      records.push({ date: i, checkIn: null, checkOut: null, status: 'Alpha' });
    }
  }
  return records;
};

export const names = [
  "Budi Santoso", "Siti Aminah", "Ahmad Fauzi", "Rina Wati", "Joko Widodo",
  "Dewi Lestari", "Agus Setiawan", "Sri Wahyuni", "Hendra Gunawan", "Maya Sari",
  "Eko Prasetyo", "Nurul Hidayah", "Rizky Ramadhan", "Dian Sastrowardoyo", "Andi Wijaya",
  "Fitriani", "Iwan Fals", "Ratna Galih", "Bambang Pamungkas", "Yuni Shara"
];

export const generateMockData = (month: number, year: number, category: 'Semua' | 'Guru' | 'Karyawan'): EmployeeAttendance[] => {
  let data: EmployeeAttendance[] = names.map((name, index) => {
    const role = index % 3 === 0 ? 'Karyawan' : 'Guru';
    const records = generateMockRecords(month, year);
    
    const summary = records.reduce((acc, curr) => {
      if (curr.status === 'Hadir') acc.hadir++;
      if (curr.status === 'Sakit') acc.sakit++;
      if (curr.status === 'Izin') acc.izin++;
      if (curr.status === 'Cuti') acc.cuti++;
      if (curr.status === 'Alpha') acc.alpha++;
      return acc;
    }, { hadir: 0, sakit: 0, izin: 0, cuti: 0, alpha: 0 });

    return {
      id: `EMP-${(index + 1).toString().padStart(3, '0')}`,
      name,
      role,
      photoUrl: `https://i.pravatar.cc/150?u=${index}`,
      records,
      summary,
    };
  });

  if (category !== 'Semua') {
    data = data.filter(emp => emp.role === category);
  }

  return data;
};
