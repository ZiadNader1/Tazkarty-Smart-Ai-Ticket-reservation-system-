import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = 0;
  public isLoading = signal<boolean>(false);

  show(): void {
    this.loadingCount++;
    this.isLoading.set(true);
  }

  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    if (this.loadingCount === 0) {
      // Small delay to avoid flickering
      setTimeout(() => {
        if (this.loadingCount === 0) {
          this.isLoading.set(false);
        }
      }, 100);
    }
  }

  reset(): void {
    this.loadingCount = 0;
    this.isLoading.set(false);
  }
}