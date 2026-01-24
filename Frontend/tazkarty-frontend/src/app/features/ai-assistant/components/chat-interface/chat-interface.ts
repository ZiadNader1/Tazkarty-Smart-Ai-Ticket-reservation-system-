// =====================================================
// FILE: src/app/features/ai-assistant/components/chat-interface/chat-interface.ts
// Nada - AI Assistant
// =====================================================

import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AiService, AiMessage } from '../../services/ai';
import { LanguageService } from '../../../../core/services/language.service';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  typing?: boolean;
}

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-interface.html'
})
export class ChatInterfaceComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages = signal<Message[]>([]);
  userInput = '';
  isTyping = signal(false);
  error = signal<string | null>(null);
  private sessionId: string | null = null;
  private shouldScroll = false;

  quickSuggestions = computed(() => [
    this.langService.translate('ai.suggestion.movies'),
    this.langService.translate('ai.suggestion.concerts'),
    this.langService.translate('ai.suggestion.alex_train'),
    this.langService.translate('ai.suggestion.tomorrow_trains'),
    this.langService.translate('ai.suggestion.carriage'),
    this.langService.translate('ai.suggestion.train_seats'),
    this.langService.translate('ai.suggestion.recommendations')
  ]);

  exampleQuestions = computed(() => [
    this.langService.translate('ai.example.today'),
    this.langService.translate('ai.example.weekend'),
    this.langService.translate('ai.example.aswan'),
    this.langService.translate('ai.example.sports'),
    this.langService.translate('ai.example.train_how'),
    this.langService.translate('ai.example.recommend')
  ]);

  constructor(
    private aiService: AiService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadLastSessionOrStart();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isTyping()) return;

    // Add user message
    this.addUserMessage(this.userInput);
    const userQuestion = this.userInput;
    this.userInput = '';

    if (!this.sessionId) {
      this.startSession(userQuestion);
    } else {
      this.sendToBackend(this.sessionId, userQuestion);
    }
  }

  sendQuickMessage(message: string): void {
    this.userInput = message;
    this.sendMessage();
  }

  addUserMessage(text: string): void {
    const id = `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.messages.update(msgs => [...msgs, {
      id,
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
    this.shouldScroll = true;
  }

  addAIMessage(text: string): void {
    const id = `ai-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.messages.update(msgs => [...msgs, {
      id,
      text,
      sender: 'ai',
      timestamp: new Date()
    }]);
    this.shouldScroll = true;
  }

  private loadLastSessionOrStart(): void {
    this.error.set(null);
    const userId = this.aiService.getCurrentUserId();

    // If no logged-in user, check if we have a persisted guest session
    if (!userId) {
      const guestSession = this.aiService.getGuestSession();
      if (guestSession) {
        this.sessionId = guestSession;
        this.loadConversation(guestSession);
        return;
      }

      this.addAIMessage(
        this.langService.translate('ai.welcome_guest')
      );
      return this.startSession();
    }

    this.isTyping.set(true);
    this.aiService.getUserSessions().subscribe({
      next: (sessions) => {
        if (sessions && sessions.length > 0) {
          const latest = sessions[0];
          this.sessionId = latest.session_id;
          this.loadConversation(this.sessionId!);
        } else {
          this.isTyping.set(false);
          this.startSession();
        }
      },
      error: (err) => {
        console.error('Load sessions error:', err);
        this.error.set(this.langService.translate('ai.error_session'));
        this.isTyping.set(false);
        this.startSession();
      }
    });
  }

  private startSession(initialQuestion?: string): void {
    this.error.set(null);
    this.isTyping.set(true);
    this.aiService.createSession().subscribe({
      next: (res) => {
        this.sessionId = res.session_id;

        // Save guest session if not logged in (FIX: Persistence)
        if (!this.aiService.getCurrentUserId()) {
          this.aiService.saveGuestSession(this.sessionId!);
        }

        // Welcome message from backend-style assistant
        this.addAIMessage(
          this.langService.translate('ai.welcome_auth')
        );
        this.isTyping.set(false);

        if (initialQuestion) {
          this.sendToBackend(this.sessionId!, initialQuestion);
        }
      },
      error: (err) => {
        console.error('AI session error:', err);
        this.addAIMessage(this.langService.translate('ai.error_session'));
        this.error.set(this.langService.translate('ai.error_session'));
        this.isTyping.set(false);
      }
    });
  }

  private sendToBackend(sessionId: string, question: string): void {
    // Add typing indicator
    this.isTyping.set(true);
    const typingId = `typing-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.messages.update(msgs => [...msgs, {
      id: typingId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      typing: true
    }]);
    this.shouldScroll = true;

    this.aiService.sendMessage(sessionId, question, this.langService.currentLang()).subscribe({
      next: (res) => {
        // Remove typing indicator
        this.messages.update(msgs => msgs.filter(m => m.id !== typingId));

        const aiMsg: AiMessage = res.aiMessage;
        this.addAIMessage(aiMsg.text);
        this.isTyping.set(false);
      },
      error: (err) => {
        console.error('AI message error:', err);
        this.messages.update(msgs => msgs.filter(m => m.id !== typingId));
        this.addAIMessage(this.langService.translate('ai.error_message'));
        this.isTyping.set(false);
      }
    });
  }

  startNewChat(): void {
    if (this.messages().length > 0) {
      if (confirm(this.langService.translate('ai.confirm_new_chat'))) {
        // Clear guest session from persistence
        if (!this.aiService.getCurrentUserId()) {
          this.aiService.clearGuestSession();
        }

        this.messages.set([]);
        this.sessionId = null;
        this.startSession();
      }
    } else {
      // Even if empty, force new session if requested
      if (!this.aiService.getCurrentUserId()) {
        this.aiService.clearGuestSession();
      }
      this.startSession();
    }
  }

  private loadConversation(sessionId: string): void {
    this.isTyping.set(true);
    this.aiService.getConversation(sessionId).subscribe({
      next: (msgs) => {
        const mapped: Message[] = (msgs || []).map((m: any, index: number) => ({
          id: `msg-${index}-${m.time || Date.now()}-${Math.floor(Math.random() * 1000)}`,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.time || new Date())
        }));

        this.messages.set(mapped);
        this.isTyping.set(false);
        this.shouldScroll = true;
      },
      error: (err) => {
        console.error('Load conversation error:', err);
        // If guest session is invalid, clear it
        if (!this.aiService.getCurrentUserId()) {
          this.aiService.clearGuestSession();
        }
        this.error.set(this.langService.translate('ai.error_session'));
        this.messages.set([]);
        this.isTyping.set(false);
        this.startSession();
      }
    });
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }
}