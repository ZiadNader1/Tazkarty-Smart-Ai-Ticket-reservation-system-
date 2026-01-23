import { Injectable, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    constructor() {
        // Always enable dark mode
        effect(() => {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        });
    }
}
