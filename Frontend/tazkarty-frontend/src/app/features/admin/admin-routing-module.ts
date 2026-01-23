import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { EventManagementComponent } from './components/event-management/event-management';
import { VenueManagementComponent } from './components/venue-management/venue-management';
import { AdminShowManagement } from './components/show-management/show-management';
import { UserManagementComponent } from './components/user-management/user-management';
import { AnalyticsComponent } from './components/analytics/analytics';
import { StadiumManagementComponent } from './components/stadium-management/stadium-management';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'events',
    component: EventManagementComponent
  },
  {
    path: 'venues',
    component: VenueManagementComponent
  },
  {
    path: 'stadiums',
    component: StadiumManagementComponent
  },
  {
    path: 'shows',
    component: AdminShowManagement
  },
  {
    path: 'users',
    component: UserManagementComponent
  },
  {
    path: 'analytics',
    component: AnalyticsComponent
  },
  {
    path: 'halls/:id/seat-map',
    loadComponent: () => import('./components/seat-editor/seat-editor').then(m => m.SeatEditorComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }