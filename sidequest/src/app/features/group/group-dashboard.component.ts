import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GroupService } from '../../core/services/group.service';
import { ParticipantService } from '../../core/services/participant.service';
import { QuestService } from '../../core/services/quest.service';
import { CurrentParticipantService } from '../../core/services/current-participant.service';
import { Group } from '../../core/models/group.model';
import { Participant } from '../../core/models/participant.model';
import { Quest } from '../../core/models/quest.model';
import { getCurrentMonth, formatMonth } from '../../core/utils/date.utils';

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
          <div class="dash__share" (click)="copyLink()" title="Copy invite link">
            @if (copied()) { ✅ } @else { 🔗 }
          </div>
        </div>

        <!-- Participant selector -->
        <div class="sq-card dash__who">
          <div class="sq-label">You are</div>
          @if (currentParticipant()) {
            <div class="dash__who-selected">
              <span class="dash__avatar">
              <span class="dash__avatar-emoji">🧙‍♀️</span>
              <span class="dash__avatar-initial">{{ initials(currentParticipant()!.name) }}</span>
            </span>
              <span class="dash__who-name">{{ currentParticipant()!.name }}</span>
              <button class="sq-btn sq-btn--ghost dash__switch" (click)="clearParticipant()">Switch</button>
            </div>
          } @else {
            <p class="dash__who-prompt">Pick your name to get started</p>
            <div class="stack" style="margin-top:12px">
              @for (p of participants(); track p.id) {
                <button class="sq-btn sq-btn--ghost" (click)="selectParticipant(p)">
                  {{ p.name }}
                </button>
              }
              @if (participants().length === 0) {
                <p class="dash__no-party">
                  No participants yet.
                  <a [routerLink]="['/group', groupId, 'participants']">Add your party →</a>
                </p>
              }
            </div>
          }
        </div>

        <hr class="sq-divider">

        <!-- Monthly progress -->
        <div class="sq-section-title">This month's progress</div>
        <div class="stack-lg">
          @for (p of participants(); track p.id) {
            <div class="sq-card dash__prog-card">
              <div class="row row--between" style="margin-bottom:10px">
                <div class="row" style="gap:10px">
                  <span class="dash__avatar dash__avatar--sm">
  <span class="dash__avatar-emoji">{{ avatarEmoji(p.name) }}</span>
  <span class="dash__avatar-initial">{{ initials(p.name) }}</span>
</span>
                  <span class="dash__prog-name">{{ p.name }}</span>
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
              <p>Add participants to track progress.</p>
              <a [routerLink]="['/group', groupId, 'participants']" style="margin-top:12px;display:block">
                + Add party members
              </a>
            </div>
          }
        </div>

        <hr class="sq-divider">

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
  styles: [`
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
      transition: transform .15s;
    }
    .dash__share:hover { transform: scale(1.15); }

    .dash__who { margin-bottom: 8px; }

    .dash__who-selected {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .dash__who-name {
      font-size: 1.1rem;
      font-weight: 600;
      flex: 1;
    }

    .dash__switch {
      width: auto;
      padding: 8px 14px;
      font-size: .8rem;
    }

    .dash__who-prompt { color: var(--text-2); font-size: .9rem; margin-top: 4px; }
    .dash__no-party   { color: var(--text-3); font-size: .9rem; }

    .dash__avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 30% 20%, #fff8dd 0, #fff8dd 28%, transparent 29%),
    linear-gradient(135deg, #fff3c4, #ffd76b);
  border: 2px solid #fff7df;
  box-shadow: 0 10px 22px rgba(178, 122, 20, .18);
  color: #7a5210;
  font-weight: 800;
  font-size: .7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.dash__avatar-emoji {
  font-size: 1.45rem;
  line-height: 1;
  transform: translateY(-1px);
}

.dash__avatar-initial {
  position: absolute;
  right: -2px;
  bottom: -2px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #ead9bd;
  color: #a96f00;
  font-size: .62rem;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dash__avatar--sm {
  width: 38px;
  height: 38px;
  border-radius: 14px;
}

.dash__avatar--sm .dash__avatar-emoji {
  font-size: 1.1rem;
}

.dash__avatar--sm .dash__avatar-initial {
  min-width: 17px;
  height: 17px;
  font-size: .52rem;
}

.dash__avatar--xs {
  width: 34px;
  height: 34px;
  border-radius: 13px;
}

.dash__avatar--xs .dash__avatar-emoji {
  font-size: 1rem;
}

.dash__avatar--xs .dash__avatar-initial {
  display: none;
}

.dash__participant-option {
  justify-content: flex-start;
  gap: 12px;
  text-align: left;
}

    .dash__avatar--sm {
      width: 32px;
      height: 32px;
      font-size: .75rem;
    }

    .dash__prog-name { font-weight: 600; }
    .dash__prog-card { padding: 16px; }
  `],
})
export class GroupDashboardComponent implements OnInit {
  groupId!: string;
  group = signal<Group | null>(null);
  participants = signal<Participant[]>([]);
  quests = signal<Quest[]>([]);
  loading = signal(true);
  copied = signal(false);
  currentMonthLabel = formatMonth(getCurrentMonth());

  private _currentParticipant = signal<import('../../core/models/participant.model').Participant | null>(null);

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private participantService: ParticipantService,
    private questService: QuestService,
    private cpService: CurrentParticipantService,
  ) {}

  currentParticipant() { return this._currentParticipant(); }

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.cpService.currentParticipant$.subscribe(p => this._currentParticipant.set(p));
    this.load();
  }

  async load() {
  this.loading.set(true);

  console.log('[Dashboard] Loading groupId:', this.groupId);

  try {
    const group = await this.groupService.getGroup(this.groupId);

    console.log('[Dashboard] group:', group);

    this.group.set(group);

    if (!group) {
      console.warn('[Dashboard] Group not found');
      return;
    }

    try {
      const participants = await this.participantService.getParticipants(this.groupId);
      console.log('[Dashboard] participants:', participants);
      this.participants.set(participants);
    } catch (err) {
      console.error('[Dashboard] Error loading participants:', err);
      this.participants.set([]);
    }

    try {
      const quests = await this.questService.getQuestsByMonth(this.groupId, getCurrentMonth());
      console.log('[Dashboard] quests:', quests);
      this.quests.set(quests);
    } catch (err) {
      console.error('[Dashboard] Error loading quests:', err);
      this.quests.set([]);
    }

  } catch (err) {
    console.error('[Dashboard] Error loading group:', err);
    this.group.set(null);
  } finally {
    this.loading.set(false);
  }
}

  completedCount(participantId: string): number {
    return this.quests().filter(
      q => q.assignedToParticipantId === participantId && q.status === 'completed',
    ).length;
  }

  progressPct(participantId: string): number {
    const min = this.group()?.minQuestsToComplete ?? 5;
    return Math.min(100, (this.completedCount(participantId) / min) * 100);
  }

  progressBadge(participantId: string): string {
    const done = this.completedCount(participantId);
    const min  = this.group()?.minQuestsToComplete ?? 5;
    if (done >= min) return 'sq-badge--completed';
    if (done > 0)    return 'sq-badge--pending';
    return 'sq-badge--failed';
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  selectParticipant(p: Participant)  { this.cpService.setCurrentParticipant(p); }
  clearParticipant()                 { this.cpService.clearCurrentParticipant(); }

  copyLink() {
    const url = `${window.location.origin}/group/${this.groupId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
  avatarEmoji(name: string): string {
  const emojis = ['🧙‍♀️', '🧝‍♀️', '🧚‍♀️', '🦊', '🐻', '🐸', '🐱', '🐼', '🌙', '⭐'];
  const sum = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return emojis[sum % emojis.length];
}
}