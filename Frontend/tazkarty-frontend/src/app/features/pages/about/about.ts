
import { LanguageService } from '../../../core/services/language.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.html',
    styles: []
})
export class AboutComponent {

    constructor(public langService: LanguageService) { }

    get developer() {
        return {
            name: 'Ziad Nader',
            role: this.langService.translate('about.role'),
            bio: this.langService.translate('about.bio'),
            image: 'https://ui-avatars.com/api/?name=Ziad+Nader&background=0D8ABC&color=fff&size=200',
            social: {
                facebook: 'https://www.facebook.com/ziad.naderii',
                instagram: 'https://www.instagram.com/ziadnaderii/',
                linkedin: 'https://www.linkedin.com/in/ziad-nader-5b86a2303/',
                github: 'https://github.com/ZiadNader1'
            }
        };
    }

    supporters = [
        'Nada Essam',
        'Abdelrahman Mohamed',
        'Ahmed Bahy',
        'Ahmed Hambuta',
        'Yousef Abotaleb'
    ];

}
