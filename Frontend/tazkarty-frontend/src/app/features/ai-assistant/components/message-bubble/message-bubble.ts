import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.html',
  styleUrls: ['./message-bubble.scss'],
})
export class MessageBubbleComponent {
  @Input() text = '';
  @Input() timestamp!: Date;
  @Input() sender: 'user' | 'ai' = 'user';
  @Input() typing = false;
}
