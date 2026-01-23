
import { LanguageService } from '../../../core/services/language.service';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './contact.html',
    styles: []
})
export class ContactComponent {

    constructor(public langService: LanguageService) { }

    formData = {
        name: '',
        email: '',
        subject: '',
        message: ''
    };

    loading = signal(false);
    success = signal(false);

    onSubmit() {
        this.loading.set(true);

        // Simulate API call
        setTimeout(() => {

            this.loading.set(false);
            this.success.set(true);
            this.resetForm();

            // Auto hire success message after 5 seconds
            setTimeout(() => this.success.set(false), 5000);
        }, 1500);
    }

    resetForm() {
        this.formData = {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
    }

}
