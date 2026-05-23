export type QuestStatus = 'pending' | 'completed' | 'failed';

export interface Quest {
  id: string;
  title: string;
  description: string;
  assignedToParticipantId: string;
  createdByParticipantId: string;
  month: string;            // format: "YYYY-MM"
  status: QuestStatus;
  proofPhotoUrl: string | null;
  proofPhotoUrls?: string[];
  proofComment?: string;
  completedAt: Date | null;
  createdAt: Date;
}