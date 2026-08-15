export function recordAdminActivity(action, entityType, entityId, metadata = null) {
  fetch('/api/admin/activity-logs/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, entityType, entityId, metadata }),
    keepalive: true,
  }).catch(() => {});
}
