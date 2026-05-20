import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Participant } from '../models/participant.model';

const STORAGE_KEY = 'sidequest_current_participant';

/**
 * Manages which participant the current browser session is acting as.
 *
 * Because SideQuest has no auth, identity is stored in sessionStorage so it
 * persists across page reloads within the same tab but is forgotten when the
 * tab is closed. A participant must be selected (or created) each visit.
 *
 * Usage:
 *   - On group entry: call setCurrentParticipant(participant)
 *   - Everywhere else: inject this service and read currentParticipant$
 */
@Injectable({ providedIn: 'root' })
export class CurrentParticipantService {

  private _current$ = new BehaviorSubject<Participant | null>(
    this.loadFromStorage(),
  );

  /** Observable stream of the currently selected participant. */
  readonly currentParticipant$ = this._current$.asObservable();

  /** Synchronous snapshot — useful in guards and one-shot reads. */
  get currentParticipant(): Participant | null {
    return this._current$.value;
  }

  /** Call this when the user picks their name on the group page. */
  setCurrentParticipant(participant: Participant): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      id: participant.id,
      name: participant.name,
      createdAt: participant.createdAt.toISOString(),
    }));
    this._current$.next(participant);
  }

  /** Call this to forget the current participant (e.g. "Switch participant"). */
  clearCurrentParticipant(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this._current$.next(null);
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private loadFromStorage(): Participant | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id,
        name: parsed.name,
        createdAt: new Date(parsed.createdAt),
      };
    } catch {
      return null;
    }
  }
}