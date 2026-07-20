interface LogEvent {
  id: string;
  timestamp: string;
  type: string;
  message: string;
}

const logs: LogEvent[] = [];
const MAX_LOGS = 100;

export function addLog(type: string, message: string) {
  const log: LogEvent = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: type.toUpperCase(),
    message,
  };
  logs.unshift(log);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
}

export function getLogs() {
  return logs;
}
