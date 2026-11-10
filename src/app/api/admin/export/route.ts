import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isStaffRole } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) {
    return new Response("Доступ запрещён", { status: 403 });
  }

  const bookings = await prisma.booking.findMany({
    include: {
      user: true,
      training: { include: { trainer: true, room: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "booking_id",
    "created_at",
    "status",
    "client",
    "phone",
    "training",
    "direction",
    "trainer",
    "room",
    "starts_at",
    "price_rub",
    "checked_in_at",
  ];

  const rows = bookings.map((booking) => [
    booking.id,
    booking.createdAt.toISOString(),
    booking.status,
    booking.user.name,
    booking.user.phone,
    booking.training.title,
    booking.training.direction,
    booking.training.trainer.name,
    booking.training.room.name,
    booking.training.startsAt.toISOString(),
    booking.training.priceCents / 100,
    booking.checkedInAt ? booking.checkedInAt.toISOString() : null,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sportbook-bookings-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
