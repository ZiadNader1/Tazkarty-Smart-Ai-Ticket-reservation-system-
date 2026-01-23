import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Profile } from './profile';
import { MyBookings } from './components/my-bookings/my-bookings';
import { MyTickets } from './components/my-tickets/my-tickets';
import { ProfileSettings } from './components/profile-settings/profile-settings';
import { NotificationCenter } from './components/notification-center/notification-center';

const routes: Routes = [
  {
    path: '',
    component: Profile,
    children: [
      {
        path: 'bookings',
        component: MyBookings
      },
      {
        path: 'tickets',
        component: MyTickets
      },
      {
        path: 'settings',
        component: ProfileSettings
      },
      {
        path: 'notifications',
        component: NotificationCenter
      },
      {
        path: '',
        redirectTo: 'bookings',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }