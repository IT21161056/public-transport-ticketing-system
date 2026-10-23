/**
 * Bus boarding reader types, mirroring the backend TapDtos.
 */
export type TapAction = 'TapIn' | 'TapOut' | 'Rejected';

export type TapResultCode =
  | 'TapInAccepted'
  | 'TapOutCompleted'
  | 'JourneyCancelled'
  | 'InvalidToken'
  | 'PassExpired'
  | 'AccountSuspended'
  | 'InsufficientBalance';

export interface TapJourney {
  id: string;
  status: string;
  boardingStop: string;
  tapInTimeUtc: string;
  alightingStop: string | null;
  tapOutTimeUtc: string | null;
  stopsTravelled: number | null;
  fareCharged: number;
  farePolicy: string | null;
}

export interface TapResponse {
  action: TapAction;
  result: TapResultCode;
  accepted: boolean;
  message: string;
  tokenType: 'LOCAL' | 'GUEST' | 'Unknown';
  isRepeatTap: boolean;
  journey: TapJourney | null;
  balanceAfter: number | null;
  minimumBalance: number;
  passExpiresAtUtc: string | null;
  autoClosedJourney: TapJourney | null;
}

export interface TransitStop {
  id: string;
  code: string;
  name: string;
  zone: number;
  sequence: number;
  distanceFromStartKm: number;
}

export interface TransitBus {
  id: string;
  registrationNumber: string;
}

export interface TransitRoute {
  id: string;
  routeNumber: string;
  name: string;
  stops: TransitStop[];
  buses: TransitBus[];
}

export interface TransitNetwork {
  routes: TransitRoute[];
  farePolicy: string;
  minimumBalance: number;
}
