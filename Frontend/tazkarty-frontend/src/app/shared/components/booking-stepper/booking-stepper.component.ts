import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LanguageService } from '../../../core/services/language.service';

@Component({
    selector: 'app-booking-stepper',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './booking-stepper.html'
})
export class BookingStepperComponent {
    @Input() currentStep: number = 1;
    @Output() onStepClick = new EventEmitter<number>();

    constructor(public langService: LanguageService) { }

    getProgressWidth(): string {
        switch (this.currentStep) {
            case 1: return '0%';
            case 2: return '50%';
            case 3: return '100%';
            default: return '0%';
        }
    }

    canNavigateTo(step: number): boolean {
        // Only allow navigating back to completed steps or current step
        return step < this.currentStep;
    }
}
