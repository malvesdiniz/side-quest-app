import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ParticipantService } from '../../core/services/participant.service';
import { Participant } from '../../core/models/participant.model';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a class="back-link" [routerLink]="['/group', groupId]">← Back</a>

      <h1 class="sq-page-title">Party Members</h1>
      <p class="sq-page-sub">Everyone who joins the adventure this month.</p>

      <!-- Add form -->
      <div class="sq-card" style="margin-bottom:28px">
        <div class="sq-label">Add participant</div>
        @if (error()) { <div class="sq-error">{{ error() }}</div> }
        <div class="pt-row">
          <input
            type="text"
            placeholder="Enter a name…"
            [(ngModel)]="newName"
            (keydown.enter)="add()" />
          <button class="sq-btn sq-btn--primary pt-add-btn" (click)="add()" [disabled]="adding()">
            @if (adding()) { … } @else { + Add }
          </button>
        </div>
      </div>

      <!-- List -->
      @if (loading()) {
        <div class="sq-spinner"></div>
      } @else if (participants().length === 0) {
        <div class="sq-empty">
          <div class="icon">👥</div>
          <p>No one here yet. Add the first member!</p>
        </div>
      } @else {
        <div class="sq-section-title">{{ participants().length }} members</div>
        <div class="stack">
          @for (p of participants(); track p.id) {
            <div class="sq-card pt-card">
              <div class="row row--between">
                <div class="row">
                  <span class="pt-avatar">{{ initials(p.name) }}</span>
                  <div>
                    <div class="pt-name">{{ p.name }}</div>
                    <div class="pt-date">Joined {{ p.createdAt | date:'mediumDate' }}</div>
                  </div>
                </div>
                <button class="pt-remove" (click)="remove(p)" title="Remove">✕</button>
              </div>
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

    .pt-row {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }

    .pt-add-btn {
      width: auto;
      white-space: nowrap;
      padding: 12px 18px;
    }

    .pt-card { padding: 14px 16px; }

    .pt-avatar {
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

    .pt-name { font-weight: 600; }
    .pt-date { font-size: .78rem; color: var(--text-3); }

    .pt-remove {
      background: none;
      color: var(--text-3);
      font-size: .9rem;
      padding: 6px 8px;
      border-radius: var(--radius-sm);
      transition: color .15s, background .15s;
    }
    .pt-remove:hover {
      color: var(--red);
      background: var(--red-dim);
    }
  `],
})
export class ParticipantsComponent implements OnInit {
  groupId!: string;
  participants = signal<Participant[]>([]);
  loading = signal(true);
  adding = signal(false);
  error = signal('');
  newName = '';

  constructor(
    private route: ActivatedRoute,
    private participantService: ParticipantService,
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.participants.set(await this.participantService.getParticipants(this.groupId));
    this.loading.set(false);
  }

  async add() {
    const name = this.newName.trim();
    if (!name) { this.error.set('Enter a name.'); return; }
    this.adding.set(true);
    this.error.set('');
    try {
      const id = await this.participantService.addParticipant(this.groupId, name);
      this.participants.update(list => [...list, { id, name, createdAt: new Date() }]);
      this.newName = '';
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to add participant.');
    } finally {
      this.adding.set(false);
    }
  }

  async remove(p: Participant) {
    if (!confirm(`Remove ${p.name}?`)) return;
    await this.participantService.removeParticipant(this.groupId, p.id);
    this.participants.update(list => list.filter(x => x.id !== p.id));
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}