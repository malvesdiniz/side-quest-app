import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsequenceService } from '../../core/services/consequence.service';
import { QuestService } from '../../core/services/quest.service';
import { ParticipantService } from '../../core/services/participant.service';
import { GroupService } from '../../core/services/group.service';
import { Consequence, DrawnConsequence } from '../../core/models/consequence.model';
import { Participant } from '../../core/models/participant.model';
import { Group } from '../../core/models/group.model';
import { getCurrentMonth, formatMonth } from '../../core/utils/date.utils';

@Component({
  selector: 'app-consequences',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a class="back-link" [routerLink]="['/group', groupId]">← Back</a>

      <h1 class="sq-page-title">The Fates</h1>
      <p class="sq-page-sub">{{ currentMonthLabel }} · Consequences for those who failed.</p>

      <!-- Consequence pool -->
      <div class="sq-section-title">Consequence pool ({{ consequences().length }})</div>
      <div class="sq-card" style="margin-bottom:20px">
        <div class="row" style="gap:10px;margin-bottom:12px">
          <input type="text" placeholder="e.g. Wear a costume for a day"
                 [(ngModel)]="newConsequence" (keydown.enter)="addConsequence()" />
          <button class="sq-btn sq-btn--primary cn-add-btn"
                  (click)="addConsequence()" [disabled]="addingConsequence()">
            @if (addingConsequence()) { … } @else { + }
          </button>
        </div>
        @if (consequences().length === 0) {
          <p style="color:var(--text-3);font-size:.9rem">No consequences in the pool yet.</p>
        } @else {
          <div class="stack">
            @for (c of consequences(); track c.id) {
              <div class="cn-pool-item">
                <span class="cn-pool-text">{{ c.text }}</span>
                <button class="cn-remove" (click)="removeConsequence(c)">✕</button>
              </div>
            }
          </div>
        }
      </div>

      <hr class="sq-divider">

      <!-- Failed participants -->
      <div class="sq-section-title">Failed participants</div>

      @if (loading()) {
        <div class="sq-spinner"></div>
      } @else {
        <div class="stack">
          @for (p of participants(); track p.id) {
            <div class="sq-card cn-participant-card"
                 [class.cn-participant-card--failed]="completedCount(p.id) < (group()?.minQuestsToComplete ?? 5)">
              <div class="row row--between" style="margin-bottom:10px">
                <div class="row" style="gap:10px">
                  <span class="cn-avatar"
                        [class.cn-avatar--failed]="completedCount(p.id) < (group()?.minQuestsToComplete ?? 5)">
                    {{ initials(p.name) }}
                  </span>
                  <div>
                    <div class="cn-name">{{ p.name }}</div>
                    <div class="cn-count">
                      {{ completedCount(p.id) }} / {{ group()?.minQuestsToComplete ?? 5 }} quests completed
                    </div>
                  </div>
                </div>
                @if (completedCount(p.id) < (group()?.minQuestsToComplete ?? 5)) {
                  <span class="sq-badge sq-badge--failed">Failed</span>
                } @else {
                  <span class="sq-badge sq-badge--completed">Safe</span>
                }
              </div>

              @if (completedCount(p.id) < (group()?.minQuestsToComplete ?? 5)) {
                @if (drawnForParticipant(p.id); as drawn) {
                  <div class="cn-drawn">
                    <div class="sq-label">Drawn consequence</div>
                    <p class="cn-drawn-text">{{ drawn.consequenceText }}</p>
                    <div class="cn-drawn-date">Drawn {{ drawn.drawnAt | date:'short' }}</div>
                  </div>
                } @else {
                  <button class="sq-btn sq-btn--danger cn-draw-btn"
                          [disabled]="drawingFor() === p.id || consequences().length === 0"
                          (click)="drawConsequence(p)">
                    @if (drawingFor() === p.id) { Drawing… } @else { 🎲 &nbsp; Draw Consequence }
                  </button>
                  @if (consequences().length === 0) {
                    <p class="cn-no-pool">Add consequences to the pool first.</p>
                  }
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .back-link {
      display: inline-block;
      color: var(--text-2);
      margin-bottom: 20px;
      font-size: .9rem;
    }

    .cn-add-btn {
      width: auto;
      flex-shrink: 0;
      padding: 12px 18px;
    }

    .cn-pool-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .cn-pool-item:last-child { border-bottom: none; }

    .cn-pool-text { color: var(--text-2); font-size: .95rem; }

    .cn-remove {
      background: none;
      color: var(--text-3);
      font-size: .85rem;
      padding: 4px 7px;
      border-radius: var(--radius-sm);
      transition: color .15s, background .15s;
    }
    .cn-remove:hover {
      color: var(--red);
      background: var(--red-dim);
    }

    .cn-participant-card { background: var(--bg-2); }
    .cn-participant-card--failed {
      border-color: rgba(224,92,92,.3);
      background: rgba(224,92,92,.04);
    }

    .cn-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--amber-glow);
      border: 1.5px solid var(--amber-dim);
      color: var(--amber);
      font-weight: 700;
      font-size: .85rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cn-avatar--failed {
      background: var(--red-dim);
      border-color: var(--red);
      color: var(--red);
    }

    .cn-name  { font-weight: 600; }
    .cn-count { font-size: .8rem; color: var(--text-3); }

    .cn-draw-btn  { margin-top: 4px; }
    .cn-no-pool   { font-size: .8rem; color: var(--text-3); margin-top: 8px; }

    .cn-drawn {
      background: var(--bg-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      margin-top: 4px;
    }
    .cn-drawn-text { font-size: 1rem; font-weight: 600; color: var(--red); margin: 4px 0; }
    .cn-drawn-date { font-size: .75rem; color: var(--text-3); }
  `],
})
export class ConsequencesComponent implements OnInit {
  groupId!: string;
  group = signal<Group | null>(null);
  participants = signal<Participant[]>([]);
  consequences = signal<Consequence[]>([]);
  drawnConsequences = signal<DrawnConsequence[]>([]);
  completedCounts = signal<Map<string, number>>(new Map());
  loading = signal(true);
  addingConsequence = signal(false);
  drawingFor = signal<string | null>(null);
  currentMonthLabel = formatMonth(getCurrentMonth());
  newConsequence = '';

  constructor(
    private route: ActivatedRoute,
    private consequenceService: ConsequenceService,
    private questService: QuestService,
    private participantService: ParticipantService,
    private groupService: GroupService,
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.load();
  }

 async load() {
  this.loading.set(true);
  const month = getCurrentMonth();

  console.log('[Consequences] Loading groupId:', this.groupId);
  console.log('[Consequences] month:', month);

  try {
    const group = await this.groupService.getGroup(this.groupId);
    console.log('[Consequences] group:', group);
    this.group.set(group);

    if (!group) {
      console.warn('[Consequences] Group not found');
      return;
    }

    let participants: Participant[] = [];

    try {
      participants = await this.participantService.getParticipants(this.groupId);
      console.log('[Consequences] participants:', participants);
      this.participants.set(participants);
    } catch (err) {
      console.error('[Consequences] Error loading participants:', err);
      this.participants.set([]);
    }

    try {
      const consequences = await this.consequenceService.getConsequences(this.groupId);
      console.log('[Consequences] consequences:', consequences);
      this.consequences.set(consequences);
    } catch (err) {
      console.error('[Consequences] Error loading consequences:', err);
      this.consequences.set([]);
    }

    try {
      const drawn = await this.consequenceService.getDrawnConsequencesByMonth(this.groupId, month);
      console.log('[Consequences] drawn consequences:', drawn);
      this.drawnConsequences.set(drawn);
    } catch (err) {
      console.error('[Consequences] Error loading drawn consequences:', err);
      this.drawnConsequences.set([]);
    }

    const counts = new Map<string, number>();

    for (const p of participants) {
      try {
        const n = await this.questService.countCompletedQuests(this.groupId, p.id, month);
        counts.set(p.id, n);
      } catch (err) {
        console.error(`[Consequences] Error counting completed quests for ${p.name}:`, err);
        counts.set(p.id, 0);
      }
    }

    console.log('[Consequences] completed counts:', counts);
    this.completedCounts.set(counts);

  } catch (err) {
    console.error('[Consequences] Error loading page:', err);
    this.group.set(null);
  } finally {
    this.loading.set(false);
  }
}

  completedCount(participantId: string): number {
    return this.completedCounts().get(participantId) ?? 0;
  }

  drawnForParticipant(participantId: string): DrawnConsequence | null {
    return this.drawnConsequences().find(d => d.participantId === participantId) ?? null;
  }

  async addConsequence() {
    const text = this.newConsequence.trim();
    if (!text) return;
    this.addingConsequence.set(true);
    try {
      const id = await this.consequenceService.addConsequence(this.groupId, text);
      this.consequences.update(list => [...list, { id, text, createdAt: new Date() }]);
      this.newConsequence = '';
    } finally {
      this.addingConsequence.set(false);
    }
  }

  async removeConsequence(c: Consequence) {
    await this.consequenceService.removeConsequence(this.groupId, c.id);
    this.consequences.update(list => list.filter(x => x.id !== c.id));
  }

  async drawConsequence(p: Participant) {
    if (this.consequences().length === 0) return;
    this.drawingFor.set(p.id);
    try {
      const drawn = await this.consequenceService.drawConsequenceForParticipant(
        this.groupId, p.id, getCurrentMonth(),
      );
      if (drawn) this.drawnConsequences.update(list => [...list, drawn]);
    } finally {
      this.drawingFor.set(null);
    }
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}