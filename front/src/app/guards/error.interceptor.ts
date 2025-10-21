import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpErrorResponse,
  } from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import { Observable, catchError, throwError } from 'rxjs';
  import { AlertController } from '@ionic/angular';
  
  @Injectable()
  export class ErrorInterceptor implements HttpInterceptor {
    constructor(private alertController: AlertController) {}
  
    intercept(
      req: HttpRequest<any>,
      next: HttpHandler
    ): Observable<HttpEvent<any>> {
      // Solo interceptar métodos POST, PUT y DELETE
      const method = req.method.toUpperCase();
      const interceptar = ['POST', 'PUT', 'DELETE'].includes(method);
  
      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
        console.log('Error Interceptor:', error);
        
          if (interceptar && error.status >= 400) {
            console.log(error.message);
            this.showAlert('', error.error || 'Error desconocido');
          }
  
          return throwError(() => error);
        })
      );
    }
  
    private async showAlert(subTitle: string, error: string) {
      const alert = await this.alertController.create({
        header: 'Atención',
        subHeader: 'Algo salió mal',
        message: subTitle + error,
        buttons: ['OK'],
      });
  
      await alert.present();
    }
  }
  