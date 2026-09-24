/// <reference types="vite/client" />

declare module '*update-adoption.mjs' {
  export const CURRENT_FILE: string;
  export const HISTORY_FILE: string;
  export function validatePlausibility(newValue: number, previousValue?: number): { valid: boolean; reason?: string };
  export function recordHistoryEntry(history: any[], dateString: string, sourceKey: string, value: number): any[];
  export function processAdoptionUpdate(currentData: any, historyData: any[], options?: any): Promise<any>;
}
