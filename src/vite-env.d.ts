/// <reference types="vite/client" />

declare module '*update-adoption.mjs' {
  export const CURRENT_FILE: string;
  export const HISTORY_FILE: string;
  export function validatePlausibility(newValue: number, previousValue?: number): { valid: boolean; reason?: string };
  export function validateTelemetryBasic(value: any, effectiveDate: string, previousDate?: string): { valid: boolean; reason?: string };
  export function detectAnomaly(newValue: number, previousValue: number, currentMetric?: string, previousMetric?: string): {
    anomaly: boolean;
    changeAbsolute: number | null;
    changePercent: number | null;
    anomalyReason: string | null;
    anomalyReasonEn: string | null;
    verificationStatus: 'normal' | 'anomaly-unexplained' | 'source-methodology-change' | 'externally-confirmed';
  };
  export function recordHistoryEntry(history: any[], dateString: string, sourceKey: string, value: number, metadata?: any): any[];
  export function parseDomainsMonitorHtml(html: string): { count: number; sourceDate: string } | null;
  export function processAdoptionUpdate(currentData: any, historyData: any[], options?: any): Promise<any>;
}

