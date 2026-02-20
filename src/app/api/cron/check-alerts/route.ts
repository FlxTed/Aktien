import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuote } from "@/lib/finnhub";

export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.alert.findMany({
    where: { triggered: false },
  });

  let triggered = 0;
  for (const alert of alerts) {
    const quote = await getQuote(alert.symbol);
    if (!quote) continue;

    const current = quote.c;
    const kind = alert.kind ?? "percent";
    let shouldTrigger = false;

    if (kind === "absolute" && alert.targetPrice != null) {
      shouldTrigger =
        (alert.type === "rise" && current >= alert.targetPrice) ||
        (alert.type === "drop" && current <= alert.targetPrice);
    } else if (alert.baseline != null && alert.percent != null) {
      const changeFromBaseline = ((current - alert.baseline) / alert.baseline) * 100;
      shouldTrigger =
        (alert.type === "rise" && changeFromBaseline >= alert.percent) ||
        (alert.type === "drop" && changeFromBaseline <= -alert.percent);
    }

    if (shouldTrigger) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { triggered: true, triggeredAt: new Date() },
      });
      triggered++;
    }
  }

  return NextResponse.json({ checked: alerts.length, triggered });
}
