import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuestService } from '../../core/services/quest.service';
import { ParticipantService } from '../../core/services/participant.service';
import { CurrentParticipantService } from '../../core/services/current-participant.service';
import { Quest } from '../../core/models/quest.model';
import { Participant } from '../../core/models/participant.model';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-quest-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <a class="back-link" [routerLink]="['/group', groupId, 'quests']">← Back to quests</a>

      @if (loading()) {
        <div class="sq-spinner"></div>
      } @else if (!quest()) {
        <div class="sq-empty"><div class="icon">🗺️</div><h2>Quest not found</h2></div>
      } @else {
        <div class="row row--between" style="margin-bottom:6px">
          <span class="sq-badge" [ngClass]="'sq-badge--' + quest()!.status">{{ quest()!.status }}</span>
          <span class="qd-month">{{ quest()!.month }}</span>
        </div>

        <h1 class="sq-page-title" style="margin-bottom:8px">{{ quest()!.title }}</h1>

        @if (quest()!.description) {
          <p class="qd-desc">{{ quest()!.description }}</p>
        }

        <div class="qd-meta-grid">
          <div class="qd-meta-cell">
            <span class="sq-label">Assigned to</span>
            <span class="qd-meta-val">{{ participantName(quest()!.assignedToParticipantId) }}</span>
          </div>
          <div class="qd-meta-cell">
            <span class="sq-label">Created by</span>
            <span class="qd-meta-val">{{ participantName(quest()!.createdByParticipantId) }}</span>
          </div>
          <div class="qd-meta-cell">
            <span class="sq-label">Created</span>
            <span class="qd-meta-val">{{ quest()!.createdAt | date:'mediumDate' }}</span>
          </div>
          @if (quest()!.completedAt) {
            <div class="qd-meta-cell">
              <span class="sq-label">Completed</span>
              <span class="qd-meta-val">{{ quest()!.completedAt | date:'mediumDate' }}</span>
            </div>
          }
        </div>

        <!-- Proof photo already uploaded -->
        @if (quest()!.proofPhotoUrl) {
          <div class="qd-proof">
            <div class="sq-label" style="margin-bottom:10px">Proof photo</div>
            <img [src]="quest()!.proofPhotoUrl!" class="qd-proof-img" alt="Proof" />
          </div>
        }

        <!-- Complete quest section -->
        @if (quest()!.status === 'pending' && isAssignee()) {
          <hr class="sq-divider">
          <div class="sq-section-title">Complete this quest</div>

          @if (error())         { <div class="sq-error">{{ error() }}</div> }
          @if (uploadSuccess()) { <div class="sq-success">Quest completed! 🎉</div> }

          <div class="qd-upload-zone"
               [class.qd-upload-zone--preview]="previewUrl()"
               (click)="fileInput.click()">
            @if (previewUrl()) {
              <img [src]="previewUrl()!" class="qd-preview-img" alt="Preview" />
              <div class="qd-preview-overlay">Tap to change</div>
            } @else {
              <div class="qd-upload-icon">📸</div>
              <div class="qd-upload-label">Tap to select proof photo</div>
              <div class="qd-upload-hint">JPG, PNG, WEBP — max 10 MB</div>
            }
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none"
                 (change)="onFileSelected($event)" />

          <button class="sq-btn sq-btn--primary" style="margin-top:14px"
                  [disabled]="!selectedFile() || uploading()"
                  (click)="complete()">
            @if (uploading()) {
              <span class="qd-upload-progress">{{ uploadProgress() }}%</span>&nbsp;Uploading…
            } @else {
              ✅ &nbsp; Submit Proof
            }
          </button>
        }

        @if (quest()!.status === 'pending' && !isAssignee()) {
          <div class="sq-card qd-waiting" style="margin-top:24px">
            <div style="font-size:1.5rem;margin-bottom:8px">⏳</div>
            <p>Waiting for <strong>{{ participantName(quest()!.assignedToParticipantId) }}</strong> to complete this quest.</p>
          </div>
        }
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

    .qd-month {
      font-family: 'DM Mono', monospace;
      font-size: .78rem;
      color: var(--text-3);
    }

    .qd-desc {
      color: var(--text-2);
      margin-bottom: 24px;
      line-height: 1.7;
    }

    .qd-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 24px;
    }

    .qd-meta-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .qd-meta-val {
      font-weight: 600;
      color: var(--text);
      font-size: .95rem;
    }

    .qd-proof { margin-bottom: 24px; }

    .qd-proof-img {
      width: 100%;
      max-height: 320px;
      object-fit: cover;
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }

    /* Upload zone — default state */
    .qd-upload-zone {
      position: relative;
      border: 2px dashed var(--border-light);
      border-radius: var(--radius);
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      overflow: hidden;
    }
    .qd-upload-zone:hover {
      border-color: var(--amber);
      background: var(--amber-glow);
    }

    /* Upload zone — preview state */
    .qd-upload-zone--preview {
      padding: 0;
      border-style: solid;
      border-color: var(--border);
    }

    .qd-upload-icon  { font-size: 2.5rem; margin-bottom: 10px; }
    .qd-upload-label { font-weight: 600; color: var(--text-2); margin-bottom: 4px; }
    .qd-upload-hint  { font-size: .78rem; color: var(--text-3); }

    .qd-preview-img {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      display: block;
    }

    .qd-preview-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,.4);
      color: #fff;
      font-weight: 600;
      opacity: 0;
      transition: opacity .2s;
    }
    .qd-upload-zone:hover .qd-preview-overlay { opacity: 1; }

    .qd-upload-progress {
      font-family: 'DM Mono', monospace;
      font-size: .9rem;
    }

    .qd-waiting {
      text-align: center;
      color: var(--text-2);
    }
    .qd-waiting strong { color: var(--text); }
  `],
})
export class QuestDetailComponent implements OnInit {
  groupId!: string;
  questId!: string;
  quest = signal<Quest | null>(null);
  participants = signal<Participant[]>([]);
  loading = signal(true);
  uploading = signal(false);
  uploadProgress = signal(0);
  uploadSuccess = signal(false);
  error = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private questService: QuestService,
    private participantService: ParticipantService,
    private cpService: CurrentParticipantService,
  ) {}

  get currentParticipant() { return this.cpService.currentParticipant; }

  isAssignee(): boolean {
    return this.quest()?.assignedToParticipantId === this.currentParticipant?.id;
  }

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.questId = this.route.snapshot.paramMap.get('questId')!;
    this.load();
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async load() {
    this.loading.set(true);
    const [quests, participants] = await Promise.all([
      this.questService.getQuestsByMonth(this.groupId, this.currentMonth()),
      this.participantService.getParticipants(this.groupId),
    ]);
    this.quest.set(quests.find(q => q.id === this.questId) ?? null);
    this.participants.set(participants);
    this.loading.set(false);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async complete() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.error.set('');
    this.uploadProgress.set(0);
    try {
      const url = await this.uploadToCloudinary(file);
      await this.questService.completeQuest(this.groupId, this.questId, url);
      this.quest.update(q =>
        q ? { ...q, status: 'completed', proofPhotoUrl: url, completedAt: new Date() } : q,
      );
      this.uploadSuccess.set(true);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Upload failed. Please try again.');
    } finally {
      this.uploading.set(false);
    }
  }

  private uploadToCloudinary(file: File): Promise<string> {
    const cloudName    = environment.cloudinary.cloudName;
    const uploadPreset = environment.cloudinary.uploadPreset;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `sidequest/${this.groupId}`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          this.uploadProgress.set(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload  = () => xhr.status === 200
        ? resolve(JSON.parse(xhr.responseText).secure_url)
        : reject(new Error('Cloudinary upload failed.'));
      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(formData);
    });
  }

  participantName(id: string): string {
    return this.participants().find(p => p.id === id)?.name ?? '—';
  }
}