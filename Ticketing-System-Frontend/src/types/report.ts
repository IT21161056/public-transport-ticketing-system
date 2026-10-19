/**
 * Manager report types, mirroring the backend ReportDtos.
 */
export interface ReportPeriod {
  from: string;
  to: string;
  timeZone: string;
}

export interface CountByLabel {
  label: string;
  count: number;
}

export interface RevenueByLabel {
  label: string;
  amount: number;
  journeys: number;
}

export interface EvasionByLabel {
  label: string;
  inspections: number;
  invalid: number;
  ratePercent: number;
}

export interface RidershipReport {
  period: ReportPeriod;
  totalJourneys: number;
  localJourneys: number;
  guestJourneys: number;
  incompleteJourneys: number;
  byStation: CountByLabel[];
  byHourOfDay: CountByLabel[];
  byDayOfWeek: CountByLabel[];
}

export interface RevenueReport {
  period: ReportPeriod;
  totalFareRevenue: number;
  completedJourneys: number;
  averageFare: number;
  byDay: RevenueByLabel[];
  byStation: RevenueByLabel[];
  notes: string[];
}

export interface FareEvasionReport {
  period: ReportPeriod;
  totalInspections: number;
  invalidInspections: number;
  evasionRatePercent: number;
  byReason: CountByLabel[];
  byLocation: EvasionByLabel[];
  byTokenType: EvasionByLabel[];
  byHourOfDay: EvasionByLabel[];
}
