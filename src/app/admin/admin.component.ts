import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {

  // Variables para los colores (conectadas a los inputs)
  colors = {
    primary: '#43ba7f',
    secondary: '#ff511a',
    accent: '#212741',
    neutral: '#ffffff'
  };

  ngOnInit() {
    // Al cargar el admin, recuperamos los colores guardados
    const saved = localStorage.getItem('admin_color_settings');
    if (saved) {
      try {
        this.colors = JSON.parse(saved);
      } catch (e) { console.error('Error cargando colores', e); }
    }
  }

  // Esta función se ejecuta al dar clic en "Aplicar Cambios"
  applyColors() {
    // 1. Guardar en memoria
    localStorage.setItem('admin_color_settings', JSON.stringify(this.colors));

    // 2. Aplicar los colores al Panel de Admin (para que veas el cambio ahí mismo)
    this.updateCssVariables(document, this.colors);

    // 3. Aplicar los colores al Iframe (Vista Previa)
    const iframe = document.getElementById('site-preview') as HTMLIFrameElement;
    if (iframe && iframe.contentDocument) {
      this.updateCssVariables(iframe.contentDocument, this.colors);
    }

    // 4. Mandar aviso a otras pestañas (si tienes la web abierta en otro lado)
    const bc = new BroadcastChannel('admin-colors');
    bc.postMessage({ type: 'colors-applied', colors: this.colors });

    alert('¡Colores aplicados correctamente!');
  }

  // Función auxiliar que inyecta las variables en el CSS
  updateCssVariables(doc: Document, colors: any) {
    const root = doc.documentElement;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--neutral-color', colors.neutral);
  }

  // Restablecer a los valores por defecto
  resetColors() {
    this.colors = {
      primary: '#43ba7f',
      secondary: '#ff511a',
      accent: '#212741',
      neutral: '#ffffff'
    };
  }

  logout() {
    window.location.href = '/';
  }
}