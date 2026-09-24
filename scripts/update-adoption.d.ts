export declare const CURRENT_FILE: string;
export declare const HISTORY_FILE: string;

export declare function validatePlausibility(
  newValue: number,
  previousValue?: number
): { valid: boolean; reason?: string };

export declare function recordHistoryEntry(
  history: Array<{ date: string; source: string; value: number }>,
  dateString: string,
  sourceKey: string,
  value: number
): Array<{ date: string; source: string; value: number }>;

export declare function processAdoptionUpdate(
  currentData: any,
  historyData: any[],
  options?: {
    fetcher?: (url: string, init?: any) => Promise<any>;
    today?: string;
    nowIso?: string;
  }
): Promise<{
  current: any;
  history: any[];
  changed: boolean;
  logs: string[];
}>;
