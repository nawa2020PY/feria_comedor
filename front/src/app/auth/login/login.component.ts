import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, of, Subscription, take } from 'rxjs';

import { AlertController, Platform } from '@ionic/angular';


import { AuthServiceService } from 'src/app/services/auth-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location, LocationStrategy } from '@angular/common';


interface Navigator {
  app: {
    exitApp: () => void;
  };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent  implements OnInit, OnDestroy {
  screen: any = 'signin';

  formData: FormGroup;

  host: string = '';
  port: string = '';

  formDataHostAndPort: FormGroup;
  isLoading: boolean = false;
  showMessageBackExit = true;


  constructor(private fb:FormBuilder, private auth:AuthServiceService, private alertController: AlertController
    ,private Router:Router, private actRoute:ActivatedRoute,        private locationS: LocationStrategy,         private location: Location,
    private platform: Platform
  ) {
    this.formData = this.fb.group({
      // nombre: ['',[Validators.required, Validators.maxLength(20)]],
      usuario: ['',[Validators.required, Validators.maxLength(20)]],
      password: ['',[Validators.required, Validators.maxLength(20)]],
    });

    this.formDataHostAndPort = this.fb.group({
      host: ['',[Validators.required, Validators.maxLength(20),      Validators.pattern(/^[0-9.]+$/) // Solo números
      ]],
      port: ['',[Validators.required, Validators.maxLength(20),      Validators.pattern(/^[0-9]+$/) // Solo números y puntos
      ]],
    });
  }

  private backButtonSubscription!: Subscription;

  ngOnInit() {
    // const token = localStorage.getItem('token');
    const host = localStorage.getItem('host');
    const port = localStorage.getItem('port');
    if (host && port) {
      this.formDataHostAndPort.patchValue({
        host: host,
        port: port
      });
    }

    this.auth.logout();

    this.locationS.onPopState(() => {
      if (this.showMessageBackExit) {
          this.showMessageBackExit = false
          this.showAlert("Presione atrás de nuevo para salir", "");
      }
      this.location.back();
    });

    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(10, () => {
      // Cerrar la aplicación
      console.log("Back button pressed");
      console.log("Url actual:", this.Router.url);
      
      
      if (this.screen === 'signin' && this.Router.url == '/login') {
          console.log("Closing app");
          
        (navigator as any).app.exitApp();
      } else if (this.screen === 'hostAndPort' && this.Router.url == '/login') {
        console.log("al login");
        
        this.screen = 'signin';
      }else if (this.Router.url == '/comedor/abm/consumos' || this.Router.url == '/comedor/abm/comedores'){
        this.Router.navigate(['/comedor/abm/home']);
      } else if (this.Router.url.includes("/comedor/abm/consumo/edit/")){
        this.Router.navigate(['/comedor/abm/consumos']);
      }else if (this.Router.url.includes("/comedor/abm/consumo/create")){
        this.Router.navigate(['/comedor/abm/consumos']);
      }else{
        this.location.back();
      }
      

    });
  }

  ngOnDestroy(){
    // this.backButtonSubscription?.unsubscribe();
  }

  change(event:any){
    this.screen = event;
  }

  login(){
    if(this.formData.valid){
      this.loadingLogin  = true;
      const body:{ usuario: string, password: string } = {
        usuario: this.formData.get('usuario')?.value,
        password: this.formData.get('password')?.value
      };
       
      console.log(body)
      this.auth.userLogin(body).pipe(
        take(1),
        catchError((error:any) => {
          this.loadingLogin = false;
          console.error('Login error:', error);
          // this.showAlert('Credenciales incorrectas o el servidor no está disponible' + error.message + "APIURL:" + this.auth.getValueApiUrl());
          this.showAlert('Credenciales incorrectas o el servidor no está disponible' + error.error);
          // this.showAlert('Error:' + error);
          let errorToJson = JSON.stringify(error);
          // Handle the error and return a default value to avoid breaking the stream
          // this.showAlert('Error al iniciar sesión: ' + errorToJson);
          console.log('Error al iniciar sesión:', errorToJson);
          return of({ jwt: null }); // Return a default value to avoid breaking the stream
        })
      ).subscribe((data:any)=>{
        this.loadingLogin = false;
        console.log(data);
        if(data.jwt){
          localStorage.setItem('token', data.jwt);
        }
        // this.location.replaceState('/comedor/abm/home'); // Reemplaza el estado actual en el historial
        this.Router.navigate(['/comedor/abm/home']);
      });
    }else{
      this.showAlert();
    }
  }

  async registerHostAndPort(){
    if(this.formDataHostAndPort.valid){
      this.host = this.formDataHostAndPort.get('host')?.value;
      this.port = this.formDataHostAndPort.get('port')?.value;
      console.log("Host:", this.host);
      console.log("Port:", this.port);
      
      const body:{ host: string, port: string } = {
        host: this.formDataHostAndPort.get('host')?.value,
        port: this.formDataHostAndPort.get('port')?.value
      };

      console.log(body)
      await this.auth.setHostAndPort(body.host, body.port);

      this.successAlert('Host y puerto actualizados correctamente');
    }else{
      console.log('Form is invalid:', this.formDataHostAndPort.errors);
      console.log("value:", this.formDataHostAndPort.value);
      
      await this.showAlert();
    }
  }


  async showAlert(subTitle: string = 'Por favor completa todos los campos correctamente', subHeader:string = "Algo salió mal") {
    const alert = await this.alertController.create({
      header: 'Atención',
      subHeader: subHeader,
      message: subTitle,
      buttons: ['OK'],
    });
  
    await alert.present();
  }


  async successAlert(subTitle: string = 'Actualización exitosa') {
    const alert = await this.alertController.create({
      header: 'Éxito',
      subHeader: 'Operación exitosa',
      message: subTitle,
      buttons: ['OK'],
    });

    //El boton de ok me va a llevar a   screen: any = 'signin';
    alert.onDidDismiss().then(() => {
      this.screen = 'signin';
    });
  
    await alert.present();
  }


  showPass = false;
  passType = 'password';
  changeShowPass(value: boolean): void {
    this.showPass = value;
    if (this.showPass) {
        this.passType = 'text';
    } else {
        this.passType = 'password';
    }
  } 

  loadingLogin = false;

  
}
