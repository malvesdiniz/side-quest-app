import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

import { toDate, getCurrentMonth } from '../utils/date.utils';
import { Consequence, DrawnConsequence } from '../models/consequence.model';

@Injectable({ providedIn: 'root' })
export class ConsequenceService {

  // ── Helpers ──────────────────────────────────────────────────────────────

  private consequencesCol(groupId: string) {
    return collection(firestore, 'groups', groupId, 'consequences');
  }

  private drawnCol(groupId: string) {
    return collection(firestore, 'groups', groupId, 'drawnConsequences');
  }

  private consequenceFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Consequence {
    const d = snap.data();
    return {
      id: snap.id,
      text: d['text'],
      createdAt: toDate(d['createdAt']),
    };
  }

  private drawnFromDoc(snap: QueryDocumentSnapshot<DocumentData>): DrawnConsequence {
    const d = snap.data();
    return {
      id: snap.id,
      participantId: d['participantId'],
      month: d['month'],
      consequenceText: d['consequenceText'],
      drawnAt: toDate(d['drawnAt']),
    };
  }

  // ── Consequence pool ─────────────────────────────────────────────────────

  /** All consequences in the group's pool, ordered by creation time. */
  async getConsequences(groupId: string): Promise<Consequence[]> {
    const q = query(this.consequencesCol(groupId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.consequenceFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  /** Add a consequence to the pool. Returns its generated ID. */
  async addConsequence(groupId: string, text: string): Promise<string> {
    const ref = await addDoc(this.consequencesCol(groupId), {
      text,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Remove a consequence from the pool. */
  async removeConsequence(groupId: string, consequenceId: string): Promise<void> {
    await deleteDoc(doc(this.consequencesCol(groupId), consequenceId));
  }

  // ── Drawn consequences ───────────────────────────────────────────────────

  /**
   * Draw a random consequence for a participant who failed to meet the quota.
   * Picks randomly from the pool and saves the result to Firestore.
   * Returns null if the pool is empty.
   */
  async drawConsequenceForParticipant(
    groupId: string,
    participantId: string,
    month = getCurrentMonth(),
  ): Promise<DrawnConsequence | null> {
    const pool = await this.getConsequences(groupId);
    if (pool.length === 0) return null;

    const picked = pool[Math.floor(Math.random() * pool.length)];

    const ref = await addDoc(this.drawnCol(groupId), {
      participantId,
      month,
      consequenceText: picked.text,
      drawnAt: serverTimestamp(),
    });

    return {
      id: ref.id,
      participantId,
      month,
      consequenceText: picked.text,
      drawnAt: new Date(),
    };
  }

  /** All drawn consequences for a given month. */
  async getDrawnConsequencesByMonth(
    groupId: string,
    month = getCurrentMonth(),
  ): Promise<DrawnConsequence[]> {
    const q = query(
      this.drawnCol(groupId),
      where('month', '==', month),
      orderBy('drawnAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => this.drawnFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  /** Drawn consequences for a specific participant this month. */
  async getDrawnConsequencesForParticipant(
    groupId: string,
    participantId: string,
    month = getCurrentMonth(),
  ): Promise<DrawnConsequence[]> {
    const q = query(
      this.drawnCol(groupId),
      where('participantId', '==', participantId),
      where('month', '==', month),
      orderBy('drawnAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => this.drawnFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }
}