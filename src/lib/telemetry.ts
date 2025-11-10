/**
 * Telemetry Utility
 * 
 * Centralized telemetry/analytics event tracking
 */

export type TelemetryEvent =
  | { type: 'table.preview_opened'; tableId: string; recordId: string }
  | { type: 'table.configure_opened'; tableId: string }
  | { type: 'table.import_clicked'; tableId: string }
  | { type: 'table.export_clicked'; tableId: string }
  | { type: 'table.configure'; tableId: string; changes: Record<string, any> }

/**
 * Track a telemetry event
 */
export function trackEvent(event: TelemetryEvent): void {
  // In production, this would send to your analytics service
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Telemetry]', event)
  }

  // TODO: Integrate with your analytics service
  // Example:
  // analytics.track(event.type, {
  //   ...event,
  //   timestamp: new Date().toISOString(),
  //   userId: getCurrentUserId(),
  // })
}

