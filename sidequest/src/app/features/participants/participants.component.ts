import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ParticipantService } from '../../core/services/participant.service';
import { GroupService } from '../../core/services/group.service';
import { CurrentParticipantService } from '../../core/services/current-participant.service';
import { Participant } from '../../core/models/participant.model';
import { Group } from '../../core/models/group.model';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Users, X, Link, Check } from 'lucide-angular';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Users, X, Link, Check }) },
  ],
  template: `
    <div class="page">
      <a class="back-link" [routerLink]="['/group', groupId]">← Back</a>

      <h1 class="sq-page-title">Party Members</h1>
      <p class="sq-page-sub">Everyone who joined the adventure.</p>

      @if (loading()) {
        <div class="sq-spinner"></div>
      } @else if (participants().length === 0) {

        <!-- Empty state -->
        <div class="sq-empty">
          <div class="icon"><lucide-icon name="users" [size]="48" /></div>
          <h2>No members yet</h2>
          <p>Share the group link so people can join with Google.</p>
          <button class="sq-btn sq-btn--ghost pt-copy-btn" (click)="copyLink()">
            <lucide-icon [name]="copied() ? 'check' : 'link'" [size]="16" />
            {{ copied() ? 'Link copied!' : 'Copy invite link' }}
          </button>
        </div>

      } @else {

        <!-- Not-a-member hint -->
        @if (!currentParticipant()) {
          <div class="sq-card pt-hint">
            <p class="pt-hint-text">
              Join this group from the dashboard to become a member.
            </p>
            <a class="sq-btn sq-btn--ghost pt-hint-btn" [routerLink]="['/group', groupId]">
              ← Go to dashboard
            </a>
          </div>
        }

        <!-- Member list -->
        <div class="sq-section-title">{{ participants().length }} members</div>
        <div class="stack">
          @for (p of participants(); track p.id) {
            <div class="sq-card pt-card">
              <div class="row row--between">
                <div class="row">
                  @if (p.photoUrl) {
                    <img class="pt-avatar pt-avatar--photo" [src]="p.photoUrl" [alt]="p.name" />
                  } @else {
                    <span class="pt-avatar">{{ initials(p.name) }}</span>
                  }
                  <div>
                    <div class="pt-name">
                      {{ p.name }}
                      @if (p.id === group()?.ownerParticipantId) {
                        <span class="pt-owner-badge">Owner</span>
                      }
                    </div>
                    <div class="pt-date">Joined {{ p.createdAt | date: 'mediumDate' }}</div>
                  </div>
                </div>
                @if (canRemoveParticipant(p)) {
                  <button class="pt-remove" (click)="openRemoveModal(p)" title="Remove">
                    <lucide-icon name="x" [size]="14" />
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Confirm modal -->
      @if (showConfirmModal()) {
        <div class="pt-modal-backdrop" (click)="closeRemoveModal()">
          <div class="pt-modal" (click)="$event.stopPropagation()">
            <p class="pt-modal-msg">{{ confirmModalMessage }}</p>
            @if (removeError()) {
              <div class="sq-error" style="margin-bottom:16px">{{ removeError() }}</div>
            }
            <div class="pt-modal-actions">
              <button
                class="sq-btn sq-btn--ghost"
                (click)="closeRemoveModal()"
                [disabled]="removing()"
              >
                Cancel
              </button>
              <button
                class="sq-btn sq-btn--danger"
                (click)="confirmRemoveParticipant()"
                [disabled]="removing()"
              >
                @if (removing()) { Removing… } @else { Confirm }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .pt-card {
        padding: 14px 16px;
      }

      .pt-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--amber-light, #fff3cc);
        border: 2px solid var(--amber, #f0a500);
        color: var(--amber-dark, #b97d0a);
        font-weight: 800;
        font-size: 0.78rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .pt-avatar--photo {
        object-fit: cover;
        background: var(--surface-2);
        border-color: var(--border);
      }

      .pt-name {
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .pt-owner-badge {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: var(--amber-light);
        color: var(--amber-dark);
        border: 1px solid var(--amber);
        border-radius: var(--radius-pill);
        padding: 2px 8px;
      }

      .pt-date {
        font-size: 0.78rem;
        color: var(--text-3);
      }

      .pt-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        color: var(--text-3);
        padding: 6px 8px;
        border-radius: var(--radius-sm);
        transition: color 0.15s, background 0.15s;
      }

      .pt-remove:hover {
        color: var(--coral, #f97066);
        background: var(--coral-light, #ffe4e1);
      }

      /* ── Empty-state copy button ── */
      .pt-copy-btn {
        margin-top: 20px;
        width: auto;
        padding: 11px 20px;
      }

      /* ── Not-a-member hint ── */
      .pt-hint {
        margin-bottom: 24px;
        padding: 16px 20px;
        background: var(--bg-3);
      }

      .pt-hint-text {
        font-size: 0.9rem;
        color: var(--text-2);
        font-weight: 500;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .pt-hint-btn {
        width: auto;
        padding: 10px 18px;
        font-size: 0.875rem;
      }

      /* ── Confirm modal ── */
      .pt-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(45, 32, 19, 0.45);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .pt-modal {
        background: var(--surface);
        border: 1.5px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 28px 24px;
        width: 100%;
        max-width: 360px;
        box-shadow: var(--shadow-lg);
      }

      .pt-modal-msg {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text);
        line-height: 1.5;
        margin-bottom: 20px;
      }

      .pt-modal-actions {
        display: flex;
        gap: 10px;
      }

      .pt-modal-actions .sq-btn {
        flex: 1;
        padding: 13px;
      }
    `,
  ],
})
export class ParticipantsComponent implements OnInit {
  groupId!: string;
  group = signal<Group | null>(null);
  participants = signal<Participant[]>([]);
  loading = signal(true);
  copied = signal(false);

  private _currentParticipant = signal<Participant | null>(null);

  selectedParticipantToRemove = signal<Participant | null>(null);
  showConfirmModal = signal(false);
  removing = signal(false);
  removeError = signal('');

  constructor(
    private route: ActivatedRoute,
    private participantService: ParticipantService,
    private groupService: GroupService,
    private cpService: CurrentParticipantService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.cpService.currentParticipant$.subscribe((p) => this._currentParticipant.set(p));
    this.load();
  }

  currentParticipant(): Participant | null {
    return this._currentParticipant();
  }

  async load() {
    this.loading.set(true);
    const [group, participants] = await Promise.all([
      this.groupService.getGroup(this.groupId),
      this.participantService.getParticipants(this.groupId),
    ]);
    this.group.set(group);
    this.participants.set(participants);
    this.loading.set(false);
  }

  copyLink(): void {
    const url = `${window.location.origin}/group/${this.groupId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  canRemoveParticipant(p: Participant): boolean {
    const current = this._currentParticipant();
    if (!current) return false;
    return current.id === p.id || this.group()?.ownerParticipantId === current.id;
  }

  get confirmModalMessage(): string {
    const p = this.selectedParticipantToRemove();
    const current = this._currentParticipant();
    if (!p) return '';
    return p.id === current?.id
      ? 'Are you sure you want to leave this group?'
      : `Remove ${p.name} from this group?`;
  }

  openRemoveModal(p: Participant): void {
    this.selectedParticipantToRemove.set(p);
    this.showConfirmModal.set(true);
    this.removeError.set('');
  }

  closeRemoveModal(): void {
    this.showConfirmModal.set(false);
    this.selectedParticipantToRemove.set(null);
    this.removeError.set('');
  }

  async confirmRemoveParticipant(): Promise<void> {
    const p = this.selectedParticipantToRemove();
    const current = this._currentParticipant();
    const group = this.group();
    if (!p || !current || !group) return;

    this.removing.set(true);
    this.removeError.set('');
    try {
      await this.participantService.removeParticipantAndTransferOwnership(
        this.groupId,
        p.id,
        current,
        group,
      );

      const isSelf = p.id === current.id;
      this.closeRemoveModal();

      if (isSelf) {
        this.cpService.clearCurrentParticipant(this.groupId);
        this.router.navigate(['/group', this.groupId]);
      } else {
        await this.load();
      }
    } catch (e: any) {
      this.removeError.set(e?.message ?? 'Failed to remove participant.');
    } finally {
      this.removing.set(false);
    }
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
