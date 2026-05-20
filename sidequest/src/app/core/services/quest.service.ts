import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { toDate, getCurrentMonth } from '../utils/date.utils';
import { Quest, QuestStatus } from '../models/quest.model';

@Injectable({ providedIn: 'root' })
export class QuestService {

  // ── Helpers ──────────────────────────────────────────────────────────────

  private col(groupId: string) {
    return collection(firestore, 'groups', groupId, 'quests');
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): Quest {
    const d = snap.data();
    return {
      id: snap.id,
      title: d['title'],
      description: d['description'],
      assignedToParticipantId: d['assignedToParticipantId'],
      createdByParticipantId: d['createdByParticipantId'],
      month: d['month'],
      status: d['status'] as QuestStatus,
      proofPhotoUrl: d['proofPhotoUrl'] ?? null,
      completedAt: d['completedAt'] ? toDate(d['completedAt']) : null,
      createdAt: toDate(d['createdAt']),
    };
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** All quests in a group for a given month, ordered by creation time. */
  async getQuestsByMonth(groupId: string, month: string): Promise<Quest[]> {
  console.log('[QuestService] getQuestsByMonth:', { groupId, month });

  const questsRef = collection(firestore, `groups/${groupId}/quests`);

  const q = query(
    questsRef,
    where('month', '==', month)
  );

  const snapshot = await getDocs(q);

  const quests = snapshot.docs.map(docSnap => this.fromDoc(docSnap));

  return quests.sort((a, b) => {
    const aTime = a.createdAt?.getTime?.() ?? 0;
    const bTime = b.createdAt?.getTime?.() ?? 0;
    return bTime - aTime;
  });
}
  /** Quests assigned to a specific participant for a given month. */
  async getQuestsForParticipant(
    groupId: string,
    participantId: string,
    month = getCurrentMonth(),
  ): Promise<Quest[]> {
    const q = query(
      this.col(groupId),
      where('assignedToParticipantId', '==', participantId),
      where('month', '==', month),
      orderBy('createdAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => this.fromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  /** Create a new quest. Returns the generated quest ID. */
  async createQuest(
    groupId: string,
    payload: {
      title: string;
      description: string;
      assignedToParticipantId: string;
      createdByParticipantId: string;
    },
  ): Promise<string> {
    const ref = await addDoc(this.col(groupId), {
      ...payload,
      month: getCurrentMonth(),
      status: 'pending' satisfies QuestStatus,
      proofPhotoUrl: null,
      completedAt: null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  /**
   * Mark a quest as completed and store the Cloudinary proof photo URL.
   * Call this after the Cloudinary upload succeeds and you have the URL.
   */
  async completeQuest(
    groupId: string,
    questId: string,
    proofPhotoUrl: string,
  ): Promise<void> {
    await updateDoc(doc(this.col(groupId), questId), {
      status: 'completed' satisfies QuestStatus,
      proofPhotoUrl,
      completedAt: serverTimestamp(),
    });
  }

  /** Mark a quest as failed (e.g. at end-of-month sweep). */
  async failQuest(groupId: string, questId: string): Promise<void> {
    await updateDoc(doc(this.col(groupId), questId), {
      status: 'failed' satisfies QuestStatus,
    });
  }

  /**
   * How many quests has a participant completed this month?
   * Useful for checking if the minimum threshold is met.
   */
  async countCompletedQuests(
    groupId: string,
    participantId: string,
    month = getCurrentMonth(),
  ): Promise<number> {
    const q = query(
      this.col(groupId),
      where('assignedToParticipantId', '==', participantId),
      where('month', '==', month),
      where('status', '==', 'completed'),
    );
    const snap = await getDocs(q);
    return snap.size;
  }
}