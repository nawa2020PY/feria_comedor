import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './auth/login/login.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutComponent } from './layout/layout.component';
import { ErrorInterceptor } from './guards/error.interceptor';
import { AuthInterceptor } from './guards/jwt-bearer.interceptor';
import { ExportConsumosModalComponent } from './layout/exportar-consumos-modal/exportar-consumos-modal.component';
import { HTTP } from '@ionic-native/http/ngx'; // Import HTTP for native requests
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';


@NgModule({
  declarations: [AppComponent, LoginComponent, LayoutComponent, ExportConsumosModalComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ReactiveFormsModule, HttpClientModule, FormsModule, ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, 
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    HTTP,
    FileOpener
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
