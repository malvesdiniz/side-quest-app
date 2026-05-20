import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { toDate } from '../utils/date.utils';
import { Participant } from '../models/participant.model';

@Injectable({ providedIn: 'root' })
export class ParticipantService {

  // ── Helpers ──────────────────────────────────────────────────────────────

  private col(groupId: string) {
    return collection(firestore, 'groups', groupId, 'participants');
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): Participant {
    const d = snap.data();
    return {
      id: snap.id,
      name: d['name'],
      createdAt: toDate(d['createdAt']),
    };
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Return all participants in a group, ordered by creation time. */
  async getParticipants(groupId: string): Promise<Participant[]> {
    const q = query(this.col(groupId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.fromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  /** Add a new participant to the group. Returns the generated participant ID. */
  async addParticipant(groupId: string, name: string): Promise<string> {
    const ref = await addDoc(this.col(groupId), {
      name,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Remove a participant from a group. */
  async removeParticipant(groupId: string, participantId: string): Promise<void> {
    await deleteDoc(doc(this.col(groupId), participantId));
  }
}