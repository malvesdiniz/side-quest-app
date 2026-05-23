import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';

import { firestore } from '../firebase/firebase';
import { UserGroup } from '../models/user-group.model';

@Injectable({ providedIn: 'root' })
export class UserGroupService {
  private col(userId: string) {
    return collection(firestore, 'users', userId, 'groups');
  }

  async addUserGroup(
    userId: string,
    groupId: string,
    groupName: string,
    participantId: string,
  ): Promise<void> {
    const path = `users/${userId}/groups/${groupId}`;
    console.log('[UserGroupService] addUserGroup →', path, { groupName, participantId });

    await setDoc(
      doc(this.col(userId), groupId),
      { groupId, groupName, participantId, joinedAt: new Date() },
      { merge: true },
    );
  }

  async getUserGroups(userId: string): Promise<UserGroup[]> {
    const path = `users/${userId}/groups`;
    console.log('[UserGroupService] getUserGroups →', path);

    const snap = await getDocs(this.col(userId));

    const groups: UserGroup[] = snap.docs.map((d) => {
      const data = d.data();
      const raw = data['joinedAt'];
      const joinedAt =
        raw instanceof Timestamp ? raw.toDate() : raw instanceof Date ? raw : new Date(raw);
      return {
        groupId: data['groupId'],
        groupName: data['groupName'],
        participantId: data['participantId'],
        joinedAt,
      };
    });

    groups.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    console.log('[UserGroupService] getUserGroups found', groups.length, 'group(s)');
    return groups;
  }

  async removeUserGroup(userId: string, groupId: string): Promise<void> {
    const path = `users/${userId}/groups/${groupId}`;
    console.log('[UserGroupService] removeUserGroup →', path);

    await deleteDoc(doc(this.col(userId), groupId));
  }
}
