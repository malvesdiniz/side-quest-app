import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Participant } from '../models/participant.model';

/**
 * Returns the sessionStorage key scoped to a specific group.
 * Using per-group keys means visiting group A and group B in the same
 * browser session keeps their identities independent.
 */
function storageKey(groupId: string): string {
  return `sidequest_participant_${groupId}`;
}

/**
 * Manages which participant the current browser session is acting as,
 * scoped per group.
 *
 * Identity is stored in sessionStorage so it persists across page reloads
 * within the same tab but is forgotten when the tab is closed.
 *
 * All public methods require a groupId so the stored value is isolated
 * per group — visiting two different groups won't overwrite each other.
 */
@Injectable({ providedIn: 'root' })
export class CurrentParticipantService {
  private _current$ = new BehaviorSubject<Participant | null>(null);

  /** Observable stream of the currently active participant for the active group. */
  readonly currentParticipant$ = this._current$.asObservable();

  /** Synchronous snapshot — useful in guards and one-shot reads. */
  get currentParticipant(): Participant | null {
    return this._current$.value;
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /** Persist and broadcast the chosen participant for a specific group. */
  setCurrentParticipant(participant: Participant, groupId: string): void {
    const stored: Record<string, unknown> = {
      id: participant.id,
      groupId: groupId,
      name: participant.name,
      createdAt: participant.createdAt.toISOString(),
    };

    if (participant.userId) stored['userId'] = participant.userId;
    if (participant.email) stored['email'] = participant.email;
    if (participant.photoUrl) stored['photoUrl'] = participant.photoUrl;

    sessionStorage.setItem(storageKey(groupId), JSON.stringify(stored));
    this._current$.next({ ...participant, groupId });
  }

  /**
   * Load the stored participant for a group into the active stream.
   * Call this in the dashboard's ngOnInit so the BehaviorSubject is
   * populated with the right group's data before auth resolves.
   * Returns the participant if one was found in storage, otherwise null.
   */
  loadForGroup(groupId: string): Participant | null {
    const participant = this.readFromStorage(groupId);
    this._current$.next(participant);
    return participant;
  }

  /** Forget the current participant for a specific group. */
  clearCurrentParticipant(groupId: string): void {
    sessionStorage.removeItem(storageKey(groupId));
    this._current$.next(null);
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  private readFromStorage(groupId: string): Participant | null {
    try {
      const raw = sessionStorage.getItem(storageKey(groupId));
      if (!raw) return null;

      const p = JSON.parse(raw);

      return {
        id: p.id,
        groupId: p.groupId ?? groupId,
        name: p.name,
        createdAt: new Date(p.createdAt),
        userId: p.userId ?? undefined,
        email: p.email ?? undefined,
        photoUrl: p.photoUrl ?? undefined,
      };
    } catch {
      return null;
    }
  }
}
