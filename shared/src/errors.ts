/**
 * The reject codes of the shared contract.
 *
 * This file is a contract only. It contains no rules and no network code.
 * The server rejects an illegal action with one of these codes.
 */

/**
 * The reject codes.
 * The key is the camelCase name.
 * The value is the code that the server sends.
 */
export const RejectCode = {
  /** The action is not for the current player. */
  notYourTurn: 'NOT_YOUR_TURN',
  /** The action is not legal in the current phase. */
  wrongPhase: 'WRONG_PHASE',
  /** The selected space is not legal for the selected card. */
  illegalSpace: 'ILLEGAL_SPACE',
  /** The selected space already has an agent. */
  spaceOccupied: 'SPACE_OCCUPIED',
  /** The player cannot pay the cost of the space or card. */
  missingCost: 'MISSING_COST',
  /** The player does not meet the requirement of the space or card. */
  missingRequirement: 'MISSING_REQUIREMENT',
  /** The selected card is not known to the server. */
  unknownCard: 'UNKNOWN_CARD',
  /** The action is not legal at all. */
  illegalAction: 'ILLEGAL_ACTION',
} as const;

/** One reject code. */
export type RejectCode = (typeof RejectCode)[keyof typeof RejectCode];

/**
 * The list of all reject codes in canonical order.
 */
export const REJECT_CODES: readonly RejectCode[] = [
  RejectCode.notYourTurn,
  RejectCode.wrongPhase,
  RejectCode.illegalSpace,
  RejectCode.spaceOccupied,
  RejectCode.missingCost,
  RejectCode.missingRequirement,
  RejectCode.unknownCard,
  RejectCode.illegalAction,
];

/**
 * True when the value is one of the reject codes.
 */
export function isRejectCode(value: unknown): value is RejectCode {
  return typeof value === 'string' && (REJECT_CODES as readonly string[]).includes(value);
}