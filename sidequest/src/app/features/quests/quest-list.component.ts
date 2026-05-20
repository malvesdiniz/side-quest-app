import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestService } from '../../core/services/quest.service';
import { ParticipantService } from '../../core/services/participant.service';
import { CurrentParticipantService } from '../../core/services/current-participant.service';
import { Quest } from '../../core/models/quest.model';
import { Participant } from '../../core/models/participant.model';
import { getCurrentMonth, formatMonth } from '../../core/utils/date.utils';

type Filter = 'all' | 'mine' | 'pending' | 'completed';

@Component({
  selector: 'app-quest-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a class="back-link" [routerLink]="['/group', groupId]">← Back</a>

      <div class="row row--between" style="margin-bottom:4px">
        <h1 class="sq-page-title">Quests</h1>
        <a class="sq-btn sq-btn--primary ql-new-btn"
           [routerLink]="['/group', groupId, 'quests', 'new']">+ New</a>
      </div>
      <p class="sq-page-sub">{{ currentMonthLabel }}</p>

      <!-- Filters -->
      <div class="ql-filters">
        @for (f of filters; track f.value) {
          <button
            class="ql-filter"
            [class.ql-filter--active]="activeFilter() === f.value"
            (click)="activeFilter.set(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="sq-spinner"></div>
      } @else if (filtered().length === 0) {
        <div class="sq-empty">
          <div class="icon">📜</div>
          <p>No quests match this filter.</p>
          <a [routerLink]="['/group', groupId, 'quests', 'new']" style="margin-top:14px;display:block">
            Create the first quest →
          </a>
        </div>
      } @else {
        <div class="stack">
          @for (q of filtered(); track q.id) {
            <a class="sq-card sq-card--clickable ql-quest-card"
               [routerLink]="['/group', groupId, 'quests', q.id]">
              <div class="row row--between" style="margin-bottom:6px">
                <span class="sq-badge" [ngClass]="'sq-badge--' + q.status">{{ q.status }}</span>
                <span class="ql-month">{{ q.month }}</span>
              </div>
              <div class="ql-title">{{ q.title }}</div>
              <div class="ql-meta">
                <span>For: <strong>{{ participantName(q.assignedToParticipantId) }}</strong></span>
                <span>By: {{ participantName(q.createdByParticipantId) }}</span>
              </div>
              @if (q.proofPhotoUrl) {
                <div class="ql-proof-thumb">
                  <img [src]="q.proofPhotoUrl" alt="Proof" />
                </div>
              }
            </a>
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

    .ql-new-btn {
      width: auto;
      padding: 10px 18px;
      font-size: .85rem;
      white-space: nowrap;
    }

    .ql-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .ql-filter {
      padding: 7px 16px;
      border-radius: 99px;
      font-size: .82rem;
      font-weight: 600;
      background: var(--surface);
      color: var(--text-2);
      border: 1.5px solid var(--border);
      transition: all .15s;
    }

    .ql-filter--active {
      background: var(--amber-glow);
      border-color: var(--amber);
      color: var(--amber);
    }

    .ql-quest-card { text-decoration: none; display: block; }

    .ql-title {
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 6px;
      color: var(--text);
    }

    .ql-meta {
      display: flex;
      gap: 14px;
      font-size: .8rem;
      color: var(--text-3);
    }

    .ql-meta strong { color: var(--text-2); }

    .ql-month {
      font-family: 'DM Mono', monospace;
      font-size: .75rem;
      color: var(--text-3);
    }

    .ql-proof-thumb {
      margin-top: 10px;
    }

    .ql-proof-thumb img {
      width: 80px;
      height: 60px;
      object-fit: cover;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
  `],
})
export class QuestListComponent implements OnInit {
  groupId!: string;
  quests = signal<Quest[]>([]);
  participants = signal<Participant[]>([]);
  loading = signal(true);
  activeFilter = signal<Filter>('all');
  currentMonthLabel = formatMonth(getCurrentMonth());

  filters: { value: Filter; label: string }[] = [
    { value: 'all',       label: 'All' },
    { value: 'mine',      label: 'Mine' },
    { value: 'pending',   label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  filtered = computed(() => {
    const f    = this.activeFilter();
    const myId = this.cpService.currentParticipant?.id;
    return this.quests().filter(q => {
      if (f === 'mine')      return q.assignedToParticipantId === myId;
      if (f === 'pending')   return q.status === 'pending';
      if (f === 'completed') return q.status === 'completed';
      return true;
    });
  });

  constructor(
    private route: ActivatedRoute,
    private questService: QuestService,
    private participantService: ParticipantService,
    private cpService: CurrentParticipantService,
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.load();
  }

  async load() {
  this.loading.set(true);

  console.log('[QuestList] Loading groupId:', this.groupId);
 
  try {
    try {
      
      const participants = await this.participantService.getParticipants(this.groupId);
      console.log('[QuestList] participants:', participants);
      this.participants.set(participants);
    } catch (err) {
      console.error('[QuestList] Error loading participants:', err);
      this.participants.set([]);
    }

    try {
      const quests = await this.questService.getQuestsByMonth(this.groupId, getCurrentMonth());
      console.log('[QuestList] quests:', quests);
      this.quests.set(quests);
    } catch (err) {
      console.error('[QuestList] Error loading quests:', err);
      this.quests.set([]);
    }

  } finally {
    this.loading.set(false);
  }
}

  participantName(id: string): string {
    return this.participants().find(p => p.id === id)?.name ?? '—';
  }
}