import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { take } from 'rxjs';
import { Comedor, Usuario } from 'src/app/models/interfaces';
import { AuthServiceService, JwtClaims } from 'src/app/services/auth-service.service';
import { ComedorService } from 'src/app/services/comedor.service';

@Component({
  selector: 'app-usuarios-edit',
  templateUrl: './usuarios-edit.component.html',
  styleUrls: ['./usuarios-edit.component.scss'],
  standalone:false
})
export class UsuariosEditComponent  implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loadingData: boolean = true;
  comedores: { comedorID: number, nombre: string }[] = [];
  usuarioToEdit!:Usuario ;
  idToEdit: number = -1;

  formDataUsuario: FormGroup = this.fb.group({
    usuario: ['', Validators.required],
    password:[ '', Validators.required],
    nombre: '',
    tipoUsuario: [1],
    idComedor: [null, Validators.required],
    activo: true,
});
  authInfo!:JwtClaims;


  constructor(private comedorService:ComedorService,  private auth:AuthServiceService, private alertController: AlertController, private router:Router) { 
    this.idToEdit = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    this.auth.decodeToken().then((claims) => {
      if (claims) {
        this.authInfo = claims;
      } else {
        console.error('Failed to decode token');
      }
    }).catch((error) => {
      console.error('Error decoding token:', error);
    });

    if (this.idToEdit > 0) {
      this.formDataUsuario.patchValue({
        IDUsuario : this.idToEdit
      });
    }else{
      this.loadingData = false;
    }

    this.ListarComedores();

  }

  ngOnInit() {}

  ListarComedores(){
    this.comedorService.ListComedores().pipe(take(1)).subscribe({
      next: (res) => {
        this.comedores = res.map(comedor => ({
          comedorID: comedor.IDComedor,
          nombre: comedor.Nombre
        }));

        if (this.idToEdit > 0) {
          this.getUsuarioByID(this.idToEdit);
        }
      },
      error: (err) => {
        console.error(err);
        this.showAlert('Error al obtener los usuarios');
      }
    });
  }


  getUsuarioByID(idComedor: number) {
    this.comedorService.GetUsuarioByID(idComedor).pipe(take(1)).subscribe({
      next: (res) => {
        this.usuarioToEdit = res;
        this.formDataUsuario.patchValue({
          usuario: res.Usuario,
          password: res.Password,
          nombre: res.Nombre,
          tipoUsuario: res.TipoUsuario,
          idComedor: res.IDComedor,
          activo: res.Activo,
        });
        this.loadingData = false;
      },
      error: (err) => {
        console.error(err);
        this.showAlert('Error al obtener el usuario');
        this.loadingData = false;
      }
    });
  }


  async showAlert(subTitle: string = 'Por favor completa todos los campos correctamente') {
    const alert = await this.alertController.create({
      header: 'Atención',
      subHeader: 'Algo salió mal',
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

    alert.onDidDismiss().then(() => {
      // this.screen = 'signin';
      this.router.navigate(['/comedor/abm/usuarios']);
    });
  
    await alert.present();
  }

  submitForm(){
    if (this.formDataUsuario.valid) {
      const usuario: Usuario = {
        IDComedor: this.formDataUsuario.get('idComedor')?.value,
        Nombre: this.formDataUsuario.get('nombre')?.value,
        Activo: this.formDataUsuario.get('activo')?.value,
        Usuario: this.formDataUsuario.get('usuario')?.value,
        Password: this.formDataUsuario.get('password')?.value,
        TipoUsuario: this.formDataUsuario.get('tipoUsuario')?.value,
        IDUsuario: this.idToEdit > 0 ? this.idToEdit : 0, 
      };

      if (this.idToEdit > 0) {
        // Update existing comedor
        this.comedorService.UpdateUsuario(usuario).pipe(take(1)).subscribe({
          next: () => {
            this.successAlert('Usuario actualizado correctamente');
          },
          error: (err) => {
            console.error(err);
            this.showAlert('Error al actualizar el Usuario' + err.message);
          }
        });
      } else {
        // Create new comedor
        this.comedorService.CreateUsuario(usuario).pipe(take(1)).subscribe({
          next: () => {
            this.successAlert('Usuario creado correctamente');
          },
          error: (err) => {
            console.error(err);
            this.showAlert('Error al crear el Usuario' + err.message);
          }
        });
      }
    } else {
      this.showAlert();
    }

  }

}
