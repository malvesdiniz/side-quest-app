import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  DocumentData,
  DocumentSnapshot,
} from 'firebase/firestore';

import { firestore } from '../firebase/firebase';
import { toDate } from '../utils/date.utils';
import { Group } from '../models/group.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private col = collection(firestore, 'groups');

  private fromDoc(snap: DocumentSnapshot<DocumentData>): Group {
    const d = snap.data();

    if (!d) {
      throw new Error('Group document has no data');
    }

    return {
      id: snap.id,
      name: d['name'],
      createdAt: toDate(d['createdAt']),
      minQuestsToComplete: d['minQuestsToComplete'] ?? 5,
      maxQuestsPerParticipant: d['maxQuestsPerParticipant'] ?? 10,
    };
  }

  async getGroup(groupId: string): Promise<Group | null> {
    console.log('[GroupService] Looking for group:', groupId);

    const ref = doc(this.col, groupId);
    console.log('[GroupService] Firestore path:', ref.path);

    const snap = await getDoc(ref);

    console.log('[GroupService] Exists?', snap.exists());
    console.log('[GroupService] Data:', snap.data());

    if (!snap.exists()) {
      return null;
    }

    return this.fromDoc(snap);
  }

  async createGroup(
    name: string,
    minQuestsToComplete = 5,
    maxQuestsPerParticipant = 10,
  ): Promise<string> {
    const ref = await addDoc(this.col, {
      name,
      minQuestsToComplete,
      maxQuestsPerParticipant,
      createdAt: serverTimestamp(),
    });

    console.log('[GroupService] Created group:', ref.id);

    return ref.id;
  }

  async updateGroup(
    groupId: string,
    changes: Partial<Pick<Group, 'name' | 'minQuestsToComplete' | 'maxQuestsPerParticipant'>>,
  ): Promise<void> {
    await updateDoc(doc(this.col, groupId), { ...changes });
  }
}