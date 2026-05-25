import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DayStats = {
  total: number;
  countries: Record<string, number>;
};

type AnalyticsData = {
  days: Record<string, DayStats>;
};

const analyticsFilePath = path.join(process.cwd(), "data", "analytics.json");
let writeQueue: Promise<void> = Promise.resolve();

function getIstanbulDate() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getCountry(headers: Headers) {
  const rawCountry =
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("cloudfront-viewer-country") ||
    headers.get("x-country-code") ||
    "Unknown";

  const country = rawCountry.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : "Unknown";
}

async function readAnalytics(): Promise<AnalyticsData> {
  try {
    const content = await fs.readFile(analyticsFilePath, "utf8");
    return JSON.parse(content) as AnalyticsData;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { days: {} };
    }
    throw err;
  }
}

async function writeAnalytics(data: AnalyticsData) {
  await fs.mkdir(path.dirname(analyticsFilePath), { recursive: true });
  const tempPath = `${analyticsFilePath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, analyticsFilePath);
}

async function recordVisit(country: string) {
  const data = await readAnalytics();
  const date = getIstanbulDate();
  const dayStats = data.days[date] ?? { total: 0, countries: {} };

  dayStats.total += 1;
  dayStats.countries[country] = (dayStats.countries[country] ?? 0) + 1;
  data.days[date] = dayStats;

  await writeAnalytics(data);
}

export async function POST(request: Request) {
  const country = getCountry(request.headers);

  writeQueue = writeQueue.then(
    () => recordVisit(country),
    () => recordVisit(country),
  );
  await writeQueue;

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  const data = await readAnalytics();

  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
