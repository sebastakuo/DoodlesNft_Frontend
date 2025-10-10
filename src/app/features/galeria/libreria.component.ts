import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-libreria',
	templateUrl: './libreria.component.html',
	styleUrls: ['./libreria.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
		standalone: true,
		imports: [CommonModule],
})
export class LibreriaComponent {
	imagenes = signal<string[]>(this.cargarImagenes());
	zoomImg = signal<string|null>(null);

	cargarImagenes(): string[] {
		const data = localStorage.getItem('libreriaImagenes');
		return data ? JSON.parse(data) : [];
	}

	eliminarImagen(idx: number) {
		const nuevas = this.imagenes().filter((_, i) => i !== idx);
		this.imagenes.set(nuevas);
		localStorage.setItem('libreriaImagenes', JSON.stringify(nuevas));
	}

	abrirZoom(img: string) {
		this.zoomImg.set(img);
	}

	cerrarZoom() {
		this.zoomImg.set(null);
	}
}
