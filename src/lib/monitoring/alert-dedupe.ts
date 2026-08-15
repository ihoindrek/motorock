const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000;
const DEFAULT_HOURLY_LIMIT = 8;

type DedupeEntry = {
  lastSentAt: number;
};

const recentAlerts = new Map<string, DedupeEntry>();
let hourlySent = 0;
let hourlyWindowStartedAt = Date.now();

function resetHourlyWindowIfNeeded(now: number) {
  if (now - hourlyWindowStartedAt >= 60 * 60 * 1000) {
    hourlyWindowStartedAt = now;
    hourlySent = 0;
  }
}

export function shouldSendAlert(
  fingerprint: string,
  options: { cooldownMs?: number; hourlyLimit?: number } = {},
) {
  const now = Date.now();
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const hourlyLimit = options.hourlyLimit ?? DEFAULT_HOURLY_LIMIT;

  resetHourlyWindowIfNeeded(now);

  if (hourlySent >= hourlyLimit) {
    return false;
  }

  const previous = recentAlerts.get(fingerprint);
  if (previous && now - previous.lastSentAt < cooldownMs) {
    return false;
  }

  return true;
}

export function markAlertSent(fingerprint: string) {
  const now = Date.now();
  resetHourlyWindowIfNeeded(now);
  recentAlerts.set(fingerprint, { lastSentAt: now });
  hourlySent += 1;
}

/** @internal Test helper */
export function resetAlertDedupeForTests() {
  recentAlerts.clear();
  hourlySent = 0;
  hourlyWindowStartedAt = Date.now();
}
