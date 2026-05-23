export interface Group {
  id: string;
  name: string;
  createdAt: Date;
  minQuestsToComplete: number; // default: 5
  maxQuestsPerParticipant: number;

  ownerParticipantId?: string | null;
  ownerUserId?: string | null;
}
