
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './faq.html',
    styles: []
})
export class FaqComponent {
    openIndex = signal<number | null>(0);

    constructor(public langService: LanguageService) { }

    get faqs() {
        return [
            {
                question: this.langService.translate('faq.q1'),
                answer: this.langService.translate('faq.a1')
            },
            {
                question: this.langService.translate('faq.q2'),
                answer: this.langService.translate('faq.a2')
            },
            {
                question: this.langService.translate('faq.q3'),
                answer: this.langService.translate('faq.a3')
            },
            {
                question: this.langService.translate('faq.q4'),
                answer: this.langService.translate('faq.a4')
            },
            {
                question: this.langService.translate('faq.q5'),
                answer: this.langService.translate('faq.a5')
            },
            {
                question: this.langService.translate('faq.q6'),
                answer: this.langService.translate('faq.a6')
            }
        ];
    }

    toggle(index: number) {
        if (this.openIndex() === index) {
            this.openIndex.set(null);
        } else {
            this.openIndex.set(index);
        }
    }
}
