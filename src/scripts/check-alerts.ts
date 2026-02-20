/**
 * Run every minute (e.g. cron or Vercel Cron) to check alerts and send notifications.
 * Usage: npm run alerts:check
 * Or call POST /api/cron/check-alerts with CRON_SECRET header in production.
 */
import { prisma } from "../lib/prisma";
import { getQuote } from "../lib/finnhub";

async function checkAlerts() {
  const alerts = await prisma.alert.findMany({
    where: { triggered: false },
    include: { user: true },
  });

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

      // TODO: Send web push and email via Resend
      // await sendEmail(alert.user.email, `${alert.symbol} alert`, `Price ${alert.type} by ${alert.percent}%...`);
      console.log(
        `Triggered alert ${alert.id}: ${alert.symbol} ${alert.type} ${alert.percent}% (user ${alert.userId})`
      );
    }
  }
}

checkAlerts()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
