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
import { Group } from '../models/group.model';
import { GroupService } from './group.service';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  constructor(private groupService: GroupService) {}
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

  async removeParticipantAndTransferOwnership(
    groupId: string,
    participantIdToRemove: string,
    currentParticipant: Participant,
    group: Group,
  ): Promise<void> {
    const isOwner = group.ownerParticipantId === currentParticipant.id;
    const isSelf = currentParticipant.id === participantIdToRemove;

    if (!isSelf && !isOwner) {
      throw new Error('You are not allowed to remove this participant.');
    }

    const participants = await this.getParticipants(groupId);
    await this.removeParticipant(groupId, participantIdToRemove);

    if (participantIdToRemove === group.ownerParticipantId) {
      const remaining = participants.filter((p) => p.id !== participantIdToRemove);
      if (remaining.length > 0) {
        const newOwner = remaining[0];
        await this.groupService.updateGroupOwner(groupId, newOwner.id, newOwner.userId ?? null);
      } else {
        await this.groupService.updateGroupOwner(groupId, null, null);
      }
    }
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

    const group = await this.groupService.getGroup(groupId);
    if (!group?.ownerParticipantId) {
      await this.groupService.updateGroupOwner(groupId, ref.id, user.uid);
    }

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
