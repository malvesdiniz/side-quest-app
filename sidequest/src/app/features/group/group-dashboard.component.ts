import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { GroupService } from '../../core/services/group.service';
import { QuestService } from '../../core/services/quest.service';
import { CurrentParticipantService } from '../../core/services/current-participant.service';

import { Group } from '../../core/models/group.model';
import { Participant } from '../../core/models/participant.model';
import { Quest } from '../../core/models/quest.model';

import { getCurrentMonth, formatMonth } from '../../core/utils/date.utils';
import { ParticipantService } from '../../core/services/participant.service';

@Component({
  selector: 'app-group-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="sq-spinner"></div>
      } @else if (!group()) {
        <div class="sq-empty">
          <div class="icon">🗺️</div>
          <h2>Group not found</h2>
          <p>Check your link and try again.</p>
        </div>
      } @else {
        <!-- Header -->
        <div class="dash__header">
          <div>
            <div class="sq-label">{{ currentMonthLabel }}</div>
            <h1 class="sq-page-title">{{ group()!.name }}</h1>
          </div>

          <button class="dash__share" (click)="copyLink()" title="Copy invite link">
            @if (copied()) {
              ✅
            } @else {
              🔗
            }
          </button>
        </div>

        <!-- Identity card -->
        <div class="sq-card dash__who">
          <!-- Not signed in -->
          @if (!authService.currentUser()) {
            <div class="dash__auth-prompt">
              <div class="dash__auth-icon">🔐</div>
              <p class="dash__auth-title">Sign in to join this group</p>
              <p class="dash__auth-sub">Use your Google account to track your quests.</p>

              @if (authError()) {
                <div class="sq-error" style="margin-top:12px">
                  {{ authError() }}
                </div>
              }

              <button class="sq-btn dash__google-btn" (click)="signIn()" [disabled]="authLoading()">
                @if (authLoading()) {
                  <span class="dash__btn-spinner"></span>
                  Signing in…
                } @else {
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt=""
                    width="18"
                    height="18"
                  />
                  Sign in with Google
                }
              </button>
            </div>

            <!-- Signed in, but not yet participant -->
          } @else if (!currentParticipant()) {
            <div class="dash__auth-prompt">
              <div class="dash__google-user">
                @if (authService.currentUser()!.photoURL) {
                  <img
                    class="dash__google-photo"
                    [src]="authService.currentUser()!.photoURL!"
                    [alt]="authService.currentUser()!.displayName ?? ''"
                  />
                } @else {
                  <span class="dash__avatar">
                    {{
                      initials(
                        authService.currentUser()!.displayName ??
                          authService.currentUser()!.email ??
                          '?'
                      )
                    }}
                  </span>
                }

                <div class="dash__google-meta">
                  <span class="dash__google-name">
                    {{ authService.currentUser()!.displayName ?? 'Google user' }}
                  </span>
                  <span class="dash__google-email">
                    {{ authService.currentUser()!.email }}
                  </span>
                </div>

                <button class="dash__sign-out-link" (click)="signOut()">Sign out</button>
              </div>

              <p class="dash__auth-sub" style="margin-top:14px">
                You're not in this group yet. Join to start completing quests.
              </p>

              @if (authError()) {
                <div class="sq-error" style="margin-top:8px">
                  {{ authError() }}
                </div>
              }

              <button
                class="sq-btn sq-btn--primary dash__join-btn"
                (click)="joinGroup()"
                [disabled]="authLoading()"
              >
                @if (authLoading()) {
                  <span class="dash__btn-spinner"></span>
                  Joining…
                } @else {
                  👋 &nbsp; Join as {{ authService.currentUser()!.displayName ?? 'me' }}
                }
              </button>
            </div>

            <!-- Signed in and already participant -->
          } @else {
            <div class="dash__who-selected">
              @if (currentParticipant()!.photoUrl) {
                <img
                  class="dash__google-photo dash__google-photo--lg"
                  [src]="currentParticipant()!.photoUrl!"
                  [alt]="currentParticipant()!.name"
                />
              } @else {
                <span class="dash__avatar">
                  {{ initials(currentParticipant()!.name) }}
                </span>
              }

              <div class="dash__who-meta">
                <span class="dash__who-name">
                  {{ currentParticipant()!.name }}
                </span>

                @if (currentParticipant()!.email) {
                  <span class="dash__who-email">
                    {{ currentParticipant()!.email }}
                  </span>
                }
              </div>

              <button class="dash__sign-out-link" (click)="signOut()">Sign out</button>
            </div>
          }
        </div>

        <hr class="sq-divider" />

        <!-- Monthly progress -->
        <div class="sq-section-title">This month's progress</div>

        <div class="stack-lg">
          @for (p of participants(); track p.id) {
            <div class="sq-card dash__prog-card">
              <div class="row row--between" style="margin-bottom:10px">
                <div class="row" style="gap:10px">
                  @if (p.photoUrl) {
                    <img
                      class="dash__avatar dash__avatar--photo"
                      [src]="p.photoUrl"
                      [alt]="p.name"
                    />
                  } @else {
                    <span class="dash__avatar dash__avatar--sm">
                      {{ initials(p.name) }}
                    </span>
                  }

                  <span class="dash__prog-name">
                    {{ p.name }}
                  </span>
                </div>

                <span class="sq-badge" [ngClass]="progressBadge(p.id)">
                  {{ completedCount(p.id) }} / {{ group()!.minQuestsToComplete }}
                </span>
              </div>

              <div class="sq-progress">
                <div class="sq-progress__bar" [style.width]="progressPct(p.id) + '%'"></div>
              </div>
            </div>
          }

          @if (participants().length === 0) {
            <div class="sq-empty">
              <div class="icon">👥</div>
              <p>No one here yet.</p>
              <a
                [routerLink]="['/group', groupId, 'participants']"
                style="margin-top:12px;display:block"
              >
                + Add party members
              </a>
            </div>
          }
        </div>

        <hr class="sq-divider" />

        <!-- Quick actions -->
        <div class="sq-section-title">Actions</div>

        <div class="stack">
          <a class="sq-btn sq-btn--primary" [routerLink]="['/group', groupId, 'quests', 'new']">
            📜 &nbsp; Create a Quest
          </a>

          <a class="sq-btn sq-btn--ghost" [routerLink]="['/group', groupId, 'quests']">
            View all quests
          </a>

          <a class="sq-btn sq-btn--ghost" [routerLink]="['/group', groupId, 'consequences']">
            🎲 &nbsp; Draw consequences
          </a>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dash__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .dash__share {
        font-size: 1.5rem;
        cursor: pointer;
        padding: 8px;
        background: none;
        border: none;
        transition: transform 0.15s;
      }

      .dash__share:hover {
        transform: scale(1.15);
      }

      .dash__who {
        margin-bottom: 8px;
      }

      .dash__auth-prompt {
        text-align: center;
        padding: 8px 4px;
      }

      .dash__auth-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      .dash__auth-title {
        font-weight: 700;
        font-size: 1rem;
        color: var(--text);
        margin-bottom: 4px;
      }

      .dash__auth-sub {
        font-size: 0.875rem;
        color: var(--text-2);
        line-height: 1.5;
      }

      .dash__google-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 16px;
        background: #fff;
        border: 1.5px solid var(--border);
        color: var(--text);
        font-weight: 700;
        border-radius: 999px;
        padding: 12px 24px;
        width: 100%;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        transition:
          box-shadow 0.15s,
          border-color 0.15s;
      }

      .dash__google-btn:hover {
        border-color: #4285f4;
        box-shadow: 0 2px 10px rgba(66, 133, 244, 0.2);
      }

      .dash__google-btn:disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      .dash__join-btn {
        margin-top: 14px;
      }

      .dash__btn-spinner {
        display: inline-block;
        width: 15px;
        height: 15px;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.65s linear infinite;
      }

      .dash__google-user {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--bg-3, #f8f4ef);
        border-radius: 12px;
        padding: 10px 12px;
      }

      .dash__google-meta {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
        min-width: 0;
        text-align: left;
      }

      .dash__google-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dash__google-email {
        font-size: 0.75rem;
        color: var(--text-3);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dash__google-photo {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 2px solid var(--border);
      }

      .dash__google-photo--lg {
        width: 44px;
        height: 44px;
      }

      .dash__sign-out-link {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-3);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
        white-space: nowrap;
        flex-shrink: 0;
        transition: color 0.15s;
      }

      .dash__sign-out-link:hover {
        color: var(--coral, #f97066);
      }

      .dash__who-selected {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .dash__who-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .dash__who-name {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dash__who-email {
        font-size: 0.75rem;
        color: var(--text-3);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dash__avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--amber-light, #fff3cc);
        border: 2px solid var(--amber, #f0a500);
        color: var(--amber-dark, #b97d0a);
        font-weight: 800;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .dash__avatar--sm {
        width: 32px;
        height: 32px;
        font-size: 0.72rem;
      }

      .dash__avatar--photo {
        width: 32px;
        height: 32px;
        object-fit: cover;
        border: 2px solid var(--border);
        background: var(--surface-2);
      }

      .dash__prog-card {
        padding: 16px;
      }

      .dash__prog-name {
        font-weight: 600;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class GroupDashboardComponent implements OnInit {
  groupId!: string;

  group = signal<Group | null>(null);
  participants = signal<Participant[]>([]);
  quests = signal<Quest[]>([]);

  loading = signal(true);
  authLoading = signal(false);
  authError = signal('');
  copied = signal(false);

  currentMonthLabel = formatMonth(getCurrentMonth());

  private _currentParticipant = signal<Participant | null>(null);

  constructor(
    private route: ActivatedRoute,
    readonly authService: AuthService,
    private participantService: ParticipantService,
    private questService: QuestService,
    private groupService: GroupService,
    private cpService: CurrentParticipantService,
  ) {}

  ngOnInit(): void {
    this.init();
  }

  private async init(): Promise<void> {
    const routeGroupId = this.route.snapshot.paramMap.get('groupId');

    if (!routeGroupId) {
      console.error('[Dashboard] Missing groupId in route');
      this.loading.set(false);
      return;
    }

    this.groupId = routeGroupId;

    this.cpService.currentParticipant$.subscribe((p) => {
      this._currentParticipant.set(p);
    });

    await this.waitForAuth();
    await this.loadAll();
  }

  currentParticipant(): Participant | null {
    return this._currentParticipant();
  }

  private waitForAuth(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.authService.loading()) {
        resolve();
        return;
      }

      const interval = setInterval(() => {
        if (!this.authService.loading()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);

    try {
      const group = await this.groupService.getGroup(this.groupId);
      this.group.set(group);

      if (!group) {
        console.warn('[Dashboard] Group not found');
        return;
      }

      try {
        const participants = await this.participantService.getParticipants(this.groupId);
        this.participants.set(participants);
      } catch (err) {
        console.error('[Dashboard] Error loading participants:', err);
        this.participants.set([]);
      }

      try {
        const quests = await this.questService.getQuestsByMonth(this.groupId, getCurrentMonth());
        this.quests.set(quests);
      } catch (err) {
        console.error('[Dashboard] Error loading quests:', err);
        this.quests.set([]);
      }

      await this.resolveCurrentParticipant();
    } catch (err) {
      console.error('[Dashboard] Error loading group:', err);
      this.group.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async resolveCurrentParticipant(): Promise<void> {
    const user = this.authService.currentUser();

    if (!user) {
      return;
    }

    const current = this._currentParticipant();

    if (current && current.groupId === this.groupId && current.userId === user.uid) {
      return;
    }

    const existing = await this.participantService.getParticipantByUserId(this.groupId, user.uid);

    if (existing) {
      this.cpService.setCurrentParticipant(existing, this.groupId);
      this._currentParticipant.set(existing);
    } else {
      this.cpService.clearCurrentParticipant(this.groupId);
      this._currentParticipant.set(null);
    }
  }

  async signIn(): Promise<void> {
    this.authLoading.set(true);
    this.authError.set('');

    try {
      await this.authService.signInWithGoogle();
      await this.resolveCurrentParticipant();
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        this.authError.set(e?.message ?? 'Sign-in failed. Please try again.');
      }
    } finally {
      this.authLoading.set(false);
    }
  }

  async signOut(): Promise<void> {
    this.cpService.clearCurrentParticipant(this.groupId);
    this._currentParticipant.set(null);
    await this.authService.signOut();
  }

  async joinGroup(): Promise<void> {
    const user = this.authService.currentUser();

    if (!user) {
      return;
    }

    this.authLoading.set(true);
    this.authError.set('');

    try {
      const participantId = await this.participantService.joinGroupWithUser(this.groupId, user);

      const updated = await this.participantService.getParticipantByUserId(this.groupId, user.uid);

      if (updated) {
        this.cpService.setCurrentParticipant(updated, this.groupId);
        this._currentParticipant.set(updated);

        const alreadyListed = this.participants().some((p) => p.id === participantId);

        if (!alreadyListed) {
          this.participants.update((list) => [...list, updated]);
        }
      }
    } catch (e: any) {
      this.authError.set(e?.message ?? 'Could not join the group. Please try again.');
    } finally {
      this.authLoading.set(false);
    }
  }

  completedCount(participantId: string): number {
    return this.quests().filter(
      (q) => q.assignedToParticipantId === participantId && q.status === 'completed',
    ).length;
  }

  progressPct(participantId: string): number {
    const min = this.group()?.minQuestsToComplete ?? 5;
    return Math.min(100, (this.completedCount(participantId) / min) * 100);
  }

  progressBadge(participantId: string): string {
    const done = this.completedCount(participantId);
    const min = this.group()?.minQuestsToComplete ?? 5;

    if (done >= min) {
      return 'sq-badge--completed';
    }

    if (done > 0) {
      return 'sq-badge--pending';
    }

    return 'sq-badge--failed';
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  copyLink(): void {
    const url = `${window.location.origin}/group/${this.groupId}`;

    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);

      setTimeout(() => {
        this.copied.set(false);
      }, 2000);
    });
  }
}
