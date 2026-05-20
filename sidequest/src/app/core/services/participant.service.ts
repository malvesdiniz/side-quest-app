import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { User } from 'firebase/auth';

import { firestore } from '../firebase/firebase';
import { toDate } from '../utils/date.utils';
import { Participant } from '../models/participant.model';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private col(groupId: string) {
    return collection(firestore, 'groups', groupId, 'participants');
  }

  private fromDoc(groupId: string, snap: QueryDocumentSnapshot<DocumentData>): Participant {
    const d = snap.data();

    return {
      id: snap.id,
      groupId,
      name: d['name'],
      createdAt: toDate(d['createdAt']),
      userId: d['userId'] ?? undefined,
      email: d['email'] ?? undefined,
      photoUrl: d['photoUrl'] ?? undefined,
    };
  }

  async getParticipants(groupId: string): Promise<Participant[]> {
    const q = query(this.col(groupId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);

    return snap.docs.map((d) => this.fromDoc(groupId, d as QueryDocumentSnapshot<DocumentData>));
  }

  async addParticipant(groupId: string, name: string): Promise<string> {
    const ref = await addDoc(this.col(groupId), {
      name,
      createdAt: serverTimestamp(),
    });

    return ref.id;
  }

  async removeParticipant(groupId: string, participantId: string): Promise<void> {
    await deleteDoc(doc(this.col(groupId), participantId));
  }

  async getParticipantByUserId(groupId: string, userId: string): Promise<Participant | null> {
    const q = query(this.col(groupId), where('userId', '==', userId));
    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    return this.fromDoc(groupId, snap.docs[0] as QueryDocumentSnapshot<DocumentData>);
  }

  async joinGroupWithUser(groupId: string, user: User): Promise<string> {
    const existing = await this.getParticipantByUserId(groupId, user.uid);

    if (existing) {
      return existing.id;
    }

    const ref = await addDoc(this.col(groupId), {
      name: user.displayName ?? user.email ?? 'Unknown',
      userId: user.uid,
      email: user.email ?? null,
      photoUrl: user.photoURL ?? null,
      createdAt: serverTimestamp(),
    });

    return ref.id;
  }

  async linkParticipantToUser(groupId: string, participantId: string, user: User): Promise<void> {
    const ref = doc(this.col(groupId), participantId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return;
    }

    const existing = snap.data()['userId'];

    if (existing) {
      return;
    }

    await updateDoc(ref, {
      userId: user.uid,
      email: user.email ?? null,
      photoUrl: user.photoURL ?? null,
    });
  }
}
