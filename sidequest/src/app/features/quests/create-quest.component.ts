import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QuestService } from '../../core/services/quest.service';
import { ParticipantService } from '../../core/services/participant.service';
import { CurrentParticipantService } from '../../core/services/current-participant.service';
import { Participant } from '../../core/models/participant.model';

@Component({
  selector: 'app-create-quest',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a class="back-link" [routerLink]="['/group', groupId, 'quests']">← Back</a>

      <h1 class="sq-page-title">New Quest</h1>
      <p class="sq-page-sub">Create a challenge for a party member.</p>

      @if (!currentParticipant) {
        <div class="sq-error">
          You need to select who you are first.
          <a [routerLink]="['/group', groupId]">Go back →</a>
        </div>
      } @else {
        @if (error())   { <div class="sq-error">{{ error() }}</div> }
        @if (success()) { <div class="sq-success">Quest created! ⚔️</div> }

        <div class="stack-lg">

          <div>
            <label class="sq-label">Assign to</label>
            <div class="cq-participant-grid">
              @for (p of others(); track p.id) {
                <button
                  class="cq-participant"
                  [class.cq-participant--selected]="assignedToId === p.id"
                  (click)="assignedToId = p.id">
                  <span class="cq-avatar" [class.cq-avatar--selected]="assignedToId === p.id">
                    {{ initials(p.name) }}
                  </span>
                  <span>{{ p.name }}</span>
                </button>
              }
              @if (others().length === 0) {
                <p style="color:var(--text-3);font-size:.9rem">No other participants yet.</p>
              }
            </div>
          </div>

          <div>
            <label class="sq-label">Quest title</label>
            <input type="text" placeholder="Run 5km without stopping" [(ngModel)]="title" />
          </div>

          <div>
            <label class="sq-label">Description (optional)</label>
            <textarea
              rows="3"
              placeholder="Any extra context or rules…"
              [(ngModel)]="description"
              style="resize:vertical"></textarea>
          </div>

          <button class="sq-btn sq-btn--primary"
                  (click)="create()"
                  [disabled]="loading() || !assignedToId || !title.trim()">
            @if (loading()) { Creating… } @else { ⚔️ &nbsp; Send Quest }
          </button>
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

    textarea {
      font-family: inherit;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      padding: 12px 14px;
      width: 100%;
      font-size: 1rem;
      transition: border-color .2s;
    }
    textarea:focus {
      outline: none;
      border-color: var(--amber);
    }
    textarea::placeholder {
      color: var(--text-3);
    }

    .cq-participant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      margin-top: 8px;
    }

    .cq-participant {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px 10px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      color: var(--text-2);
      font-size: .9rem;
      font-weight: 500;
      transition: all .15s;
    }
    .cq-participant:hover {
      border-color: var(--border-light);
      color: var(--text);
    }
    .cq-participant--selected {
      border-color: var(--amber);
      background: var(--amber-glow);
      color: var(--amber);
    }

    .cq-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-3);
      border: 1.5px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: .85rem;
      color: var(--text-2);
    }
    .cq-avatar--selected {
      background: var(--amber-glow);
      border-color: var(--amber);
      color: var(--amber);
    }
  `],
})
export class CreateQuestComponent implements OnInit {
  groupId!: string;
  others = signal<Participant[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal(false);

  title = '';
  description = '';
  assignedToId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questService: QuestService,
    private participantService: ParticipantService,
    private cpService: CurrentParticipantService,
  ) {}

  get currentParticipant() { return this.cpService.currentParticipant; }

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.load();
  }

  async load() {
    const all  = await this.participantService.getParticipants(this.groupId);
    const myId = this.currentParticipant?.id;
    this.others.set(all.filter(p => p.id !== myId));
  }

  async create() {
    const cp = this.currentParticipant;
    if (!cp || !this.assignedToId || !this.title.trim()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.questService.createQuest(this.groupId, {
        title: this.title.trim(),
        description: this.description.trim(),
        assignedToParticipantId: this.assignedToId,
        createdByParticipantId: cp.id,
      });
      this.success.set(true);
      this.title = '';
      this.description = '';
      this.assignedToId = '';
      setTimeout(() => this.router.navigate(['/group', this.groupId, 'quests']), 1200);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to create quest.');
    } finally {
      this.loading.set(false);
    }
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}