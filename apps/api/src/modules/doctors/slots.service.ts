import { prisma } from "../../lib/prisma";

function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (current + duration <= endMin) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += duration;
  }
  return slots;
}

export class SlotsService {
  async getAvailableSlots(doctorId: string, date: string) {
    // Parse date as local to avoid timezone shift (e.g. "2026-03-16" → Monday)
    const [y, m, d] = date.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    const schedule = await prisma.schedule.findFirst({
      where: { doctorId, dayOfWeek, isActive: true },
    });
    if (!schedule) return [];

    const slots = generateTimeSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);

    const booked = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(y, m - 1, d),
        status: { not: "CANCELLED" as any },
      },
      select: { timeSlot: true },
    });
    const bookedSet = new Set(booked.map((a: any) => a.timeSlot));

    return slots.map((slot) => ({
      time: slot,
      available: !bookedSet.has(slot),
      scheduleId: schedule.id,
    }));
  }
}

export const slotsService = new SlotsService();
