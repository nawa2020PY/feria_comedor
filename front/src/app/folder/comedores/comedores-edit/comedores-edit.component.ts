import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { take } from 'rxjs';
import { Comedor } from 'src/app/models/interfaces';
import { AuthServiceService, JwtClaims } from 'src/app/services/auth-service.service';
import { ComedorService } from 'src/app/services/comedor.service';

@Component({
  selector: 'app-comedores-edit',
  templateUrl: './comedores-edit.component.html',
  styleUrls: ['./comedores-edit.component.scss'],
  standalone: false,
})
export class ComedoresEditComponent  implements OnInit {

  private activatedRoute = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loadingData: boolean = true;
  comedores: { comedorID: number, nombre: string }[] = [];
  comedorToEdit!:Comedor ;
  idToEdit: number = -1;

  formDataComedor: FormGroup = this.fb.group({
    idComedor: [0],
    nombre: [''],
    activo: [true],
    telefono: [''],
    contacto: ['']
  });



  constructor(private comedorService:ComedorService,  private auth:AuthServiceService, private alertController: AlertController, private router:Router) { 
    this.idToEdit = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    if (this.idToEdit > 0) {
      this.formDataComedor.patchValue({
        idConsumo : this.idToEdit
      });
  
      this.getComedorByID(this.idToEdit);
    }else{
      this.loadingData = false;
    }

  }

  ngOnInit() {}



  getComedorByID(idComedor: number) {
    this.comedorService.GetComedorByID(idComedor).pipe(take(1)).subscribe({
      next: (res) => {
        this.comedorToEdit = res;
        this.formDataComedor.patchValue({
          idComedor: res.IDComedor,
          nombre: res.Nombre,
          activo: res.Activo,
          telefono: res.Telefono,
          contacto: res.Contacto
        });
        this.loadingData = false;
      },
      error: (err) => {
        console.error(err);
        this.showAlert('Error al obtener el comedor');
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
      this.router.navigate(['/comedor/abm/comedores']);
    });
  
    await alert.present();
  }

  submitForm(){
    if (this.formDataComedor.valid) {
      const comedor: Comedor = {
        IDComedor: this.formDataComedor.get('idComedor')?.value,
        Nombre: this.formDataComedor.get('nombre')?.value,
        Activo: this.formDataComedor.get('activo')?.value,
        Telefono: this.formDataComedor.get('telefono')?.value,
        Contacto: this.formDataComedor.get('contacto')?.value
      };

      if (this.idToEdit > 0) {
        // Update existing comedor
        this.comedorService.UpdateComedor(comedor).pipe(take(1)).subscribe({
          next: () => {
            this.successAlert('Comedor actualizado correctamente');
          },
          error: (err) => {
            console.error(err);
            this.showAlert('Error al actualizar el comedor' + err.message);
          }
        });
      } else {
        // Create new comedor
        this.comedorService.CreateComedor(comedor).pipe(take(1)).subscribe({
          next: () => {
            this.successAlert('Comedor creado correctamente');
          },
          error: (err) => {
            console.error(err);
            this.showAlert('Error al crear el comedor' + err.message);
          }
        });
      }
    } else {
      this.showAlert();
    }

  }

}
