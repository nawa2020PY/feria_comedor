import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';  
import { JwtHelperService } from '@auth0/angular-jwt';
import { AlertController } from '@ionic/angular';

export const jwtCheckGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthServiceService);
  const router = inject(Router);
  const jwtHelper = new JwtHelperService();

  const token = await authService.getToken();
  console.log(`Token: ${token}`);
  
  if (token && !jwtHelper.isTokenExpired(token)) {
    console.log('Token is valid');
    return true;
  }
  console.log('Token is invalid or expired');
  showAlert().then(() => {
    // Redirige a la ruta original después de mostrar la alerta
    // router.navigateByUrl(state.url);
  })

  // Redirige al login si no hay token o está vencido
  return router.createUrlTree(['/login']);
};

async function showAlert() {
  const alertController = inject(AlertController);
  const alert = await alertController.create({
    header: 'Atención',
    subHeader: 'Algo salió mal',
    message: 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.',
    buttons: ['OK'],
  });

  await alert.present();
}

