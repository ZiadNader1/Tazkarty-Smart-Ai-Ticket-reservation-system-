import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

export interface AiMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string | Date;
}

export interface AiConversationResponse {
  message: string;
  userMessage: AiMessage;
  aiMessage: AiMessage;
  conversation: {
    session_id: string;
    messages: AiMessage[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly GUEST_SESSION_KEY = 'tazkarty_guest_session';

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) { }

  getCurrentUserId(): string | null {
    const user = this.auth.currentUser();
    return user?._id || null;
  }

  /**
   * Create a new AI chat session for current user
   */
  createSession(): Observable<{ session_id: string }> {
    const user = this.auth.currentUser();
    const userId = user?._id;
    return this.api.post<any>('ai-conversation/create', { user_id: userId })
      .pipe(
        map(res => ({
          session_id: res.session_id || res.conversation?.session_id
        }))
      );
  }

  /**
   * Send message within a session and get AI reply
   */
  sendMessage(sessionId: string, text: string, lang: string = 'en'): Observable<AiConversationResponse> {
    return this.api.post<AiConversationResponse>(`ai-conversation/${sessionId}/message`, { text, lang });
  }

  /**
   * Get full conversation history for a session
   */
  getConversation(sessionId: string): Observable<AiMessage[]> {
    return this.api.get<any>(`ai-conversation/${sessionId}`)
      .pipe(
        map(res => res.messages || [])
      );
  }

  /**
   * Get all sessions for current user (most recent first)
   */
  /**
   * Get all sessions for current user (most recent first)
   */
  getUserSessions(): Observable<any[]> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      // Check for guest session
      const guestSessionId = this.getGuestSession();
      if (guestSessionId) {
        return new Observable(observer => {
          observer.next([{ session_id: guestSessionId }]);
          observer.complete();
        });
      }
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    return this.api.get<any[]>(`ai-conversation/user/${userId}`);
  }

  saveGuestSession(sessionId: string): void {
    localStorage.setItem(this.GUEST_SESSION_KEY, sessionId);
  }

  getGuestSession(): string | null {
    return localStorage.getItem(this.GUEST_SESSION_KEY);
  }

  clearGuestSession(): void {
    localStorage.removeItem(this.GUEST_SESSION_KEY);
  }

  /**
   * Generate recommendations for current user (server-side)
   */
  generateRecommendations(limit = 6): Observable<any> {
    const user = this.auth.currentUser();
    const userId = user?._id;
    return this.api.post<any>(`recommendations/generate/${userId}?limit=${limit}`, {});
  }

  /**
   * Load saved recommendations for current user
   */
  getUserRecommendations(): Observable<any> {
    const user = this.auth.currentUser();
    const userId = user?._id;
    return this.api.get<any>(`recommendations/user/${userId}`);
  }
}
