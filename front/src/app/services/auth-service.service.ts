import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Preferences } from '@capacitor/preferences';

import { HTTP } from '@ionic-native/http/ngx';  
import { Platform } from '@ionic/angular';
import { LoginResponse } from '../models/interfaces';



export interface JwtClaims {
  IDUsuario: number;
  IDComedor: number;
  Nombre: string;
  Activo: boolean;
  TipoUsuario: number;
  Usuario: string;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  API_URL: BehaviorSubject<string> = new BehaviorSubject<string>(environment.API_URL);

  constructor(private httpNative: HTTP, private http:HttpClient, private router: Router,   private platform: Platform  ) {
    this.refreshAPIURL();
  }

  // Métodos para manejar la URL base de la API
  setApiUrl(url: string) {
    this.API_URL.next(url);
  }

  getApiUrl() {
    return this.API_URL.asObservable();
  }

  getValueApiUrl() {
    return this.API_URL.getValue();
  }

  // Método para hacer login
  userLogin(req: { usuario: string; password: string }):Observable<LoginResponse>{
    const url = `${this.getValueApiUrl()}/user/login`;
    console.log("URL de login:", url);
    
  
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      console.log("Usando HTTP Native para login en dispositivo móvil");

      this.httpNative.setDataSerializer('json');

      const headers = { 'Content-Type': 'application/json' };
  
      return from(this.httpNative.post(url, req, headers)).pipe(switchMap(response => {
          // Convertimos la respuesta a un objeto LoginResponse
          console.log("Respuesta total:", response);
          const loginResponse: LoginResponse = JSON.parse(response.data);
          console.log("Respuesta de login:", loginResponse);
          
          // Guardamos el token en Preferences
          this.setToken(loginResponse.jwt);
          
          // Redirigimos al usuario a la página principal
          this.router.navigate(['/comedor/abm/login'], {
            replaceUrl: true,
          });

          return [loginResponse]; // Retornamos el observable con la respuesta
        }
      ))
    } else {
      console.log("Usando HttpClient para login en navegador");
      
      return this.http.post<LoginResponse>(url, req);
    }
  }

  // Métodos para manejar el token con Capacitor Preferences
  async getToken(): Promise<string | null> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {

      const { value } = await Preferences.get({ key: 'token' });
      return value;
    }else{
      // En el navegador, usamos localStorage como alternativa
      return  localStorage.getItem('token');
    }
  }

  async setToken(token: string): Promise<void> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      // Guardar el token en Preferences
      await Preferences.set({ key: 'token', value: token });
    } else {
      // En el navegador, usamos localStorage
      localStorage.setItem('token', token);
    }
  }

  // Decodificación del JWT (sin cambios)
  async decodeToken(): Promise<JwtClaims | null> {
    const token = await this.getToken();
    if (!token) {
      return null;
    }
    const payload = token.split('.')[1];
    try {
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload as JwtClaims;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  // Guardar host y puerto en almacenamiento nativo
  async setHostAndPort(host: string, port: string): Promise<void> {
    await Preferences.set({ key: 'host', value: host.trim() });
    await Preferences.set({ key: 'port', value: port.trim() });

    //Actualizo tambien en LocalStorage para compatibilidad con navegadores
    localStorage.setItem('host', host.trim());
    localStorage.setItem('port', port.trim());
    await this.refreshAPIURL(); // refrescar después de setear
  }

  // Refrescar la URL base usando los datos guardados
  async refreshAPIURL(): Promise<void> {
    const host = (await Preferences.get({ key: 'host' })).value;
    const port = (await Preferences.get({ key: 'port' })).value;

    if (host && port) {
      this.setApiUrl(`http://${host}:${port}/api/1/comedor`);
      console.log("API URL actualizada:", this.getValueApiUrl());
    }
  }

  // Logout: elimina el token y redirige
  async logout(): Promise<void> {
    await Preferences.remove({ key: 'token' });
    this.router.navigate(['/login'], {
      replaceUrl: true,
    });
  }
}
