import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { moscowAt } from "../src/lib/time";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const TEMPLATES = [
  { title: "Йога для начинающих", direction: "Йога", price: 900 },
  { title: "Кроссфит", direction: "Кроссфит", price: 1200 },
  { title: "Бокс", direction: "Бокс", price: 1500 },
  { title: "Пилатес", direction: "Пилатес", price: 1000 },
  { title: "Силовая тренировка", direction: "Силовая", price: 1300 },
];

const TIMES = [9, 18, 20];

async function main() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.training.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.room.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { phone: "+79990000001", name: "Администратор", role: "ADMIN" },
  });

  const manager = await prisma.user.create({
    data: { phone: "+79990000002", name: "Менеджер", role: "MANAGER" },
  });

  const client = await prisma.user.create({
    data: {
      phone: "+79990000003",
      name: "Анна",
      email: "anna@example.com",
      role: "CLIENT",
    },
  });

  await prisma.subscription.create({
    data: {
      userId: client.id,
      planName: "8 занятий",
      total: 8,
      left: 8,
      validUntil: addDays(new Date(), 30),
    },
  });

  const trainers = await Promise.all([
    prisma.trainer.create({
      data: { name: "Ирина Соколова", specialization: "Йога, пилатес" },
    }),
    prisma.trainer.create({
      data: { name: "Максим Орлов", specialization: "Кроссфит, силовая" },
    }),
    prisma.trainer.create({
      data: { name: "Дмитрий Волков", specialization: "Бокс" },
    }),
  ]);

  const rooms = await Promise.all([
    prisma.room.create({ data: { name: "Зал A", capacity: 12 } }),
    prisma.room.create({ data: { name: "Зал B", capacity: 20 } }),
    prisma.room.create({ data: { name: "Качалка", capacity: 15 } }),
  ]);

  function pickRoom(direction: string) {
    if (direction === "Силовая" || direction === "Персональная") {
      return rooms[2];
    }
    if (direction === "Бокс" || direction === "Кроссфит") {
      return rooms[1];
    }
    return rooms[0];
  }

  let created = 0;

  for (let day = 0; day < 10; day += 1) {
    for (let index = 0; index < TIMES.length; index += 1) {
      const template = TEMPLATES[(day + index) % TEMPLATES.length];
      const trainer = trainers[(day + index) % trainers.length];
      const room = pickRoom(template.direction);

      const startsAt = moscowAt(day, TIMES[index]);

      if (startsAt.getTime() < Date.now()) continue;

      await prisma.training.create({
        data: {
          title: template.title,
          direction: template.direction,
          type: "GROUP",
          trainerId: trainer.id,
          roomId: room.id,
          startsAt,
          durationMin: 60,
          capacity: room.capacity,
          priceCents: template.price * 100,
        },
      });
      created += 1;
    }

    // Персональная тренировка в 12:00, одно место.
    const personalAt = moscowAt(day, 12);

    if (personalAt.getTime() > Date.now()) {
      await prisma.training.create({
        data: {
          title: "Персональная тренировка",
          direction: "Персональная",
          type: "PERSONAL",
          trainerId: trainers[day % trainers.length].id,
          roomId: rooms[2].id,
          startsAt: personalAt,
          durationMin: 60,
          capacity: 1,
          priceCents: 250000,
        },
      });
      created += 1;
    }
  }

  console.log(
    `seed ok: users=3 (${admin.phone}, ${manager.phone}, ${client.phone}), trainers=3, rooms=3, trainings=${created}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
