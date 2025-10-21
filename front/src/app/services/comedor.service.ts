import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Comedor, Consumo, Empleado, PermisoComedor, Usuario } from '../models/interfaces';
import { AuthServiceService } from './auth-service.service';

import { HTTP } from '@ionic-native/http/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ComedorService {
  API_URL = environment.API_URL;

  actualizarConsumos:BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private http:HttpClient, private httpNative:HTTP, private authService:AuthServiceService, private platform: Platform) {
    this.refreshAPIURL();
  }
  refreshAPIURL(){
    //TODO: VER TEMA HTTPS O HTTP -------------------------------------------------------------------
    this.API_URL = "http://" + localStorage.getItem('host') + ':' + localStorage.getItem('port') + '/api/1/comedor';
  }

  ListUsuarios(): Observable<Usuario[]> {
    return this.get<Usuario[]>(`${this.authService.getValueApiUrl()}/users`);
  }

  CreateUsuario(usuario: Usuario): Observable<any> {
    return this.post<Usuario>(`${this.authService.getValueApiUrl()}/user`, usuario);
  }
  
  UpdateUsuario(usuario: Usuario): Observable<any> {
    return this.put<Usuario>(`${this.authService.getValueApiUrl()}/user/${usuario.IDUsuario}`, usuario);
  }
  

  ListConsumos(params:string = ""):Observable<Consumo[]> {
    if (params != "") {
      return this.get<Consumo[]>(`${this.authService.getValueApiUrl()}/consumos?${params}`);
    }else{
      return this.get<Consumo[]>(`${this.authService.getValueApiUrl()}/consumos`);

    }
  }

  updateConsumo(consumo: Consumo): Observable<any> {
    return this.put<Consumo>(`${this.authService.getValueApiUrl()}/consumo/${consumo.IDConsumo}`, consumo).pipe(tap(()=>{
      this.refreshConsumos();
    }));
  }

  createConsumo(consumo: Consumo): Observable<any> {
    return this.post<Consumo>(`${this.authService.getValueApiUrl()}/consumo`, consumo).pipe(tap(()=>{
      this.refreshConsumos();
    }));
  }

  ListEmpleados():Observable<Empleado[]> {
    return this.get<Empleado[]>(`${this.authService.getValueApiUrl()}/empleados`);
  }

  ListPermisosComedores():Observable<PermisoComedor[]> {
    return this.get<PermisoComedor[]>(`${this.authService.getValueApiUrl()}/permisosComedor`);
  }

  GetPermisoComedorByID(id: number): Observable<PermisoComedor> {
    return this.get<PermisoComedor>(`${this.authService.getValueApiUrl()}/permisoComedor/${id}`);
  }

  GetUsuarioByID(id: number): Observable<Usuario> {
    return this.get<Usuario>(`${this.authService.getValueApiUrl()}/user/${id}`);
  }

  GetComedorByID(id: number): Observable<Comedor> {
    return this.get<Comedor>(`${this.authService.getValueApiUrl()}/comedor/${id}`);
  }


  UpdateComedor(comedor: Comedor): Observable<any> {
    return this.put<Comedor>(`${this.authService.getValueApiUrl()}/comedor/${comedor.IDComedor}`, comedor)
  }

  CreateComedor(comedor: Comedor): Observable<any> {
    return this.post<Comedor>(`${this.authService.getValueApiUrl()}/comedor/create`, comedor)
  }



  getConsumoById(id: number): Observable<Consumo> {
    return this.get<Consumo>(`${this.authService.getValueApiUrl()}/consumo/${id}`);
  }

  getEmpleadoByIDorDNI(id: string, byDNI: string): Observable<Empleado> {
    if (byDNI) {
      return this.get<Empleado>(`${this.authService.getValueApiUrl()}/empleado//${id}?byDNI=true`);
    }else{
      return this.get<Empleado>(`${this.authService.getValueApiUrl()}/empleado/${id}`);

    }
  }

  ListComedores(params: string = ''): Observable<Comedor[]> {
    return this.get<Comedor[]>(`${this.authService.getValueApiUrl()}/comedores${params ? '?' + params : ''}`);
  }

  private post<T>(url: string, body: any): Observable<T> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      this.httpNative.setDataSerializer('json');
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
          return from(this.httpNative.post(url, body, headers)).pipe(
            switchMap(response => {
              const data: T = JSON.parse(response.data);
              return from([data]);
            })
          );
        })
      );
    } else {
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const options = {
            headers: { Authorization: `Bearer ${token}` }
          };
          return this.http.post<T>(url, body, options);
        })
      );
    }
  }
  
  private put<T>(url: string, body: any): Observable<T> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      this.httpNative.setDataSerializer('json');
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
          return from(this.httpNative.put(url, body, headers)).pipe(
            switchMap(response => {
              const data: T = JSON.parse(response.data);
              return from([data]);
            })
          );
        })
      );
    } else {
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const options = {
            headers: { Authorization: `Bearer ${token}` }
          };
          return this.http.put<T>(url, body, options);
        })
      );
    }
  }
  
  private get<T>(url: string): Observable<T> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
          return from(this.httpNative.get(url, {}, headers)).pipe(
            switchMap(response => {
              const data: T = JSON.parse(response.data);
              return from([data]);
            })
          );
        })
      );
    } else {
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const options = {
            headers: { Authorization: `Bearer ${token}` }
          };
          return this.http.get<T>(url, options);
        })
      );
    }
  }


  refreshConsumos(): void{
    this.actualizarConsumos.next(true);
  }

  getActualizarConsumos$(): Observable<boolean> {
    return this.actualizarConsumos.asObservable();
  }

}
