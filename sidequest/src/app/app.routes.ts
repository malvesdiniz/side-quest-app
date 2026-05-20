import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'group/:groupId',
    loadComponent: () =>
      import('./features/group/group-dashboard.component').then(m => m.GroupDashboardComponent),
  },
  {
    path: 'group/:groupId/participants',
    loadComponent: () =>
      import('./features/participants/participants.component').then(m => m.ParticipantsComponent),
  },
  {
    path: 'group/:groupId/quests',
    loadComponent: () =>
      import('./features/quests/quest-list.component').then(m => m.QuestListComponent),
  },
  {
    path: 'group/:groupId/quests/new',
    loadComponent: () =>
      import('./features/quests/create-quest.component').then(m => m.CreateQuestComponent),
  },
  {
    path: 'group/:groupId/quests/:questId',
    loadComponent: () =>
      import('./features/quests/quest-detail.component').then(m => m.QuestDetailComponent),
  },
  {
    path: 'group/:groupId/consequences',
    loadComponent: () =>
      import('./features/consequences/consequences.component').then(m => m.ConsequencesComponent),
  },
  { path: '**', redirectTo: '' },
];