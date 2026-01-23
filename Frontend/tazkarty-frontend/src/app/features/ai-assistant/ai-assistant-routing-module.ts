
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatInterfaceComponent } from './components/chat-interface/chat-interface';
import { RecommendationsComponent } from './components/recommendations/recommendations';

const routes: Routes = [
  {
    path: '',
    component: ChatInterfaceComponent
  },
  {
    path: 'recommendations',
    component: RecommendationsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AiAssistantRoutingModule { }