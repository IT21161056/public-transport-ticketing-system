/**
 * Ticket inspection types, mirroring the backend InspectionDtos.
 */
export type InspectionResultCode =
  | 'Valid'
  | 'NoActiveJourney'
  | 'StaleJourney'
  | 'InvalidToken'
  | 'Expired'
  | 'AccountSuspended';

export interface InspectionJourney {
  id: string;
  tapInStation: string;
  tapInTimeUtc: string;
  minutesSinceTapIn: number;
}

export interface InspectionResponse {
  inspectionId: string;
  isValid: boolean;
  result: InspectionResultCode;
  message: string;
  tokenType: string;
  tokenIdentifier: string;
  inspectedAtUtc: string;
  isRepeatScan: boolean;
  journey: InspectionJourney | null;
}
