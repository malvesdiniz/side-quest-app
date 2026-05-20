export interface Consequence {
  id: string;
  text: string;
  createdAt: Date;
}

export interface DrawnConsequence {
  id: string;
  participantId: string;
  month: string;           // format: "YYYY-MM"
  consequenceText: string;
  drawnAt: Date;
}