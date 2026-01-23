
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

@Component({
    selector: 'app-stores',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stores.html',
    styles: []
})
export class StoresComponent {
    constructor(public langService: LanguageService) { }

    get stores() {
        return [
            {
                name: this.langService.translate('store.cairo.name'),
                address: this.langService.translate('store.cairo.addr'),
                phone: '+20 100 123 4567',
                hours: '9:00 AM - 10:00 PM',
                mapUrl: 'https://maps.google.com',
                image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1000'
            },
            {
                name: this.langService.translate('store.alex.name'),
                address: this.langService.translate('store.alex.addr'),
                phone: '+20 100 987 6543',
                hours: '10:00 AM - 11:00 PM',
                mapUrl: 'https://maps.google.com',
                image: 'https://images.unsplash.com/photo-1580793241553-e9f1cce181af?auto=format&fit=crop&q=80&w=1000'
            },
            {
                name: this.langService.translate('store.giza.name'),
                address: this.langService.translate('store.giza.addr'),
                phone: '+20 111 222 3333',
                hours: '9:00 AM - 9:00 PM',
                mapUrl: 'https://maps.google.com',
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000'
            },
            {
                name: this.langService.translate('store.nasr.name'),
                address: this.langService.translate('store.nasr.addr'),
                phone: '+20 122 333 4444',
                hours: '10:00 AM - 12:00 AM',
                mapUrl: 'https://maps.google.com',
                image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000'
            }
        ];
    }
}
