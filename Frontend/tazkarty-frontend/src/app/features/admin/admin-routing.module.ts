import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminEventCreate } from './components/event-create/event-create';

const routes: Routes = [
    {
        path: 'events/new',
        component: AdminEventCreate
    },
    {
        path: 'seat-editor',
        loadComponent: () => import('./components/seat-editor/seat-editor').then(m => m.SeatEditorComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
