import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  // Signal para controlar qué vista mostrar: 'none' | 'login' | 'register'
  viewState = signal<'none' | 'login' | 'register'>('none');

  // Funciones para los botones
  toggleLogin() {
    // Si ya está en login, lo oculta. Si no, lo muestra.
    this.viewState.update(current => current === 'login' ? 'none' : 'login');
  }

  toggleRegister() {
    // Si ya está en registro, lo oculta. Si no, lo muestra.
    this.viewState.update(current => current === 'register' ? 'none' : 'register');
  }

  // Aquí iría la lógica real de conexión con el backend más adelante
  onSubmitLogin() {
    console.log('Procesando Login...');
  }

  onSubmitRegister() {
    console.log('Procesando Registro...');
  }
}