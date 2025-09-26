import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.css'],
	standalone: true,
})
export class FooterComponent {
	@Input() footerLogoUrl: string = '/assets/logotipo.png';
}
