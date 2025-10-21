import { ChangeDetectorRef, Component, inject, Input, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Consumo, PermisoComedor } from 'src/app/models/interfaces';
import { AuthServiceService, JwtClaims } from 'src/app/services/auth-service.service';
import { ComedorService } from 'src/app/services/comedor.service';

@Component({
  selector: 'app-consumos-edit',
  templateUrl: './consumos-edit.component.html',
  styleUrls: ['./consumos-edit.component.scss'],
  standalone: false,
})
export class ConsumosEditComponent  implements OnInit {
  //TODO: Esto en desktop no se ve nada, ver q onda

  idToEdit: number = 0;
  private activatedRoute = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loadingData: boolean = true;
  comedores: { comedorID: number, nombre: string }[] = [];
  consumoToEdit!:Consumo ;

  detailView: boolean = true;
  editView: boolean = false; // Para controlar si es vista de detalle o edición
  employeeNotFound = false; // Para mostrar linea roja si no se encuentra el empleado


  formDataConsumo: FormGroup = this.fb.group({
    fecha: {value:new Date().toISOString().split('T')[0], disabled: true},//TODO: En vista RRHH no desactivar
    nroDocumento: ['', [Validators.required, Validators.minLength(5)]],
    nombre:  [{ value: '', disabled: true }], //Se llena con nroDocumento
    monto: 0,
    observaciones:[{ value: '', disabled: true }],
    fechaEdicion: [{ value: new Date().toISOString().split('T')[0], disabled: true }],
    idUsuarioEdicion: [{value: '', disabled: true}],
    idConsumo: [{value: this.idToEdit, disabled: true}], 
    anulado: false, 
    comedorID: [0, [Validators.required]], 
    //TODO: Id usuario anulacion, etc. , ver bien el pdf
    pinAutorizacion: ['', [Validators.required, Validators.maxLength(4)]],
    tipoConsumo: [1], // Asignamos un valor por defecto
  });

  authInfo:JwtClaims | undefined; // Información del usuario autenticado


  constructor(private comedorService:ComedorService,  private auth:AuthServiceService, private alertController: AlertController, private router:Router,
    private cdr: ChangeDetectorRef, private ngZone: NgZone
  ) { 
    this.idToEdit = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    this.auth.decodeToken().then((decodedToken) => {

      this.authInfo = decodedToken as JwtClaims;

      if (this.authInfo && this.authInfo.TipoUsuario != 1) {
        this.listarComedores(this.authInfo.IDComedor).pipe(take(1)).subscribe({
          next: (res:any)=>{
            this.formDataConsumo.patchValue({
              comedorID: res?.IDComedor 
            });
    
          },
          error: (err) => {
            console.error('Error al listar comedores:', err);
            this.showError('Error al cargar los comedores. ' + err.message);
            // this.showAlert('Error al cargar los comedores. ' + err.message);
          }
        });
      }
    }).catch((error) => {
      console.error('Error decoding token:', error);
      this.authInfo = {} as JwtClaims; // Provide a fallback or handle the error appropriately
    });


    if (this.idToEdit > 0) {
      this.formDataConsumo.patchValue({
        idUsuarioEdicion: this.authInfo?.Nombre, // Assuming you want to set the current user's name
        idConsumo : this.idToEdit
      });

      this.formDataConsumo.controls['nroDocumento']?.disable(); // Deshabilitar nroDocumento en vista de detalle
      this.formDataConsumo.controls['monto']?.disable(); // Deshabilitar fecha en vista de detalle
      this.formDataConsumo.controls['tipoConsumo']?.disable(); // Deshabilitar tipoConsumo en vista de detalle
  
      this.getConsumoByID(this.idToEdit);
    }else{
      this.detailView = false; // Si no hay idToEdit, no es vista de detalle
      this.loadingData = false;

      //Forzamos el comedor del usuario autenticado si no es admin:
    }
  }

  

  ngOnInit() {
    setTimeout(() => {
      if (this.idToEdit == 0) {
        this.ngZone.run(() => {
          this.loadingData = false;
          // Opcional: solo si sigue sin funcionar
          console.log('Loading data detectChanges');
          this.cdr.detectChanges();
        });
      }
    }, 1000)

  }


  async getConsumoByID(id: number) {

    this.comedorService.getConsumoById(id).pipe(
      take(1),
      tap(consumo => this.consumoToEdit = consumo),
      switchMap(consumo => {
        if (this.comedores.length > 0) {
          this.patchFormWithConsumo(consumo);
          return of(null);
        }
        let nroDocumento = "0";
        if (consumo.NroDocumento) {
          nroDocumento = consumo.NroDocumento.trim()
        }
  
        return this.comedorService.getEmpleadoByIDorDNI(nroDocumento, 'true').pipe(
          switchMap(empleado => {
            this.formDataConsumo?.patchValue({
              nombre: empleado.Nombre,
              idEmpleado: empleado.IDEmpleado,
            });

            this.authorizationPinAnularConsumo = empleado.PinAutorizacion || '';// Guardamos el pin de autorización del empleado
  
            if (empleado.IDPermiso) {
              return this.listarComedores(empleado.IDPermiso).pipe(
                tap(() => this.patchFormWithConsumo(consumo))
              );
            }
  
            // Si no hay IDPermiso, simplemente hacemos patch
            return of(null).pipe(tap(() => this.patchFormWithConsumo(consumo)));
          }),
          catchError(  (err) => {
            console.error('Error fetching empleado by DNI:', err);
            // this.showAlert('Error al obtener el empleado por DNI: ' + err.message);
            this.showError('Error al obtener el empleado por DNI: ' + err.message);
            this.loadingData = false; // Para evitar que quede en loading
            return of(null); // Retornamos un observable vacío para continuar la cadena
          })
        );
      })
    ).subscribe({
      error: (err) => {
        console.log("ConsumoToEdit:", this.consumoToEdit);
        
        console.error('Error en carga de consumo/empleado:', err);
        this.loadingData = false
        if (this.consumoToEdit != null) {
          this.patchFormWithConsumo(this.consumoToEdit);
        }
      }
    });
  }
  
  private patchFormWithConsumo(consumo: Consumo) {
    const fechaTrans = new Date(consumo.FechaTransaccion);
    const fechaTransStr = fechaTrans.toISOString().split('T')[0];

    const fechaEdicion = new Date(consumo.FechaEdicion);
    let fechaEdicionStr = fechaEdicion.toISOString().split('T')[0];
    if (fechaEdicionStr == "Invalid Date" || fechaEdicionStr == "NaN-NaN-NaN") {
      // Si la fecha de edición es inválida, usamos la fecha de transacción
      fechaEdicionStr = new Date().toISOString().split('T')[0];
    } 

    if (consumo.TipoConsumo == null || consumo.TipoConsumo == undefined) {
      consumo.TipoConsumo = 1; // Asignamos un valor por defecto si no se especifica
      
    }

    if (consumo.TipoConsumo == 2){
      this.formDataConsumo.controls['pinAutorizacion'].disable();
      this.formDataConsumo.get('pinAutorizacion')?.setValue(''); // Limpiamos el valor del pin
    }


    this.formDataConsumo?.patchValue({
      fecha: fechaTransStr,
      nroDocumento: consumo.NroDocumento,
      monto: consumo.Monto,
      observaciones: consumo.Observaciones,
      idEmpleado: consumo.IDEmpleado,
      fechaEdicion: fechaEdicionStr,
      idUsuarioEdicion: this.authInfo?.Nombre,
      idConsumo: consumo.IDConsumo,
      idComedor: consumo.IDComedor,
      anulado: consumo.Anulado,
      tipoConsumo: consumo.TipoConsumo || 1, // Asignamos un valor por defecto si no se especifica
    });

    this.loadingData = false;
  }
  

   submitForm() {
    if (!this.formDataConsumo || !this.formDataConsumo.valid) {
       this.showError('Por favor completa todos los campos correctamente');
      return;
    }
  
    const consumoBody = this.buildConsumoBody();
  
    if (this.idToEdit > 0) {
      if (this.authInfo && this.authInfo.TipoUsuario != 1) {
        this.formDataConsumo.controls['comedorID'].disable(); // Deshabilitar el campo comedorID si no es admin
        //establecemos el comedor nosotros:
        consumoBody.IDComedor = this.authInfo.IDComedor;
      }

      this.updateConsumo(consumoBody);
    } else {
      if (this.authInfo && this.authInfo.TipoUsuario != 1 && this.formDataConsumo.get('tipoConsumo')?.value != 2) {
        const pin = this.formDataConsumo.get('pinAutorizacion')?.value;
        if (!pin || pin.trim() === '') {
           this.showError('Por favor, ingrese el PIN de autorización para crear un nuevo consumo.');
          return;
        }
      }
      console.log("fecha transaccion:", consumoBody.FechaTransaccion);
      this.createConsumo(consumoBody);
    }
  }
  
  private  updateConsumo(consumo: Consumo) {
    consumo.IDConsumo = this.idToEdit;
  
    this.comedorService.updateConsumo(consumo).pipe(take(1)).subscribe({
      next: async(res) => {
        console.log('Consumo actualizado correctamente:', res);
        this.showConfirm('Consumo actualizado correctamente', () => {return},()=>{return}, true);
      },
      error: async (err) => {
        console.error('Error al actualizar consumo:', err);
         this.showError('Error al actualizar el consumo. ' + err.error + '. Por favor, inténtelo de nuevo.');
        console.log('ConsumoBody:', consumo);
      }
    });
  }

  private  createConsumo(consumo: Consumo) {
    this.comedorService.createConsumo(consumo).pipe(take(1)).subscribe({
      next:  (res) => {
        console.log('Consumo creado correctamente:', res);
        this.showConfirm('Consumo creado correctamente', () => {
          this.router.navigate(['/comedor/abm/consumos']);
        },()=>{return}, true);
      },
      error:  (err) => {
        console.error('Error al crear consumo:', err);
         this.showError('Error al crear el consumo. ' + err.error + '. Por favor, inténtelo de nuevo.');
        console.log('ConsumoBody:', consumo);
      }
    });
  }

  showDatePicker = false;

  openDatePicker() {
    if (!this.formDataConsumo.get('fecha')?.disabled && this.authInfo && this.authInfo.TipoUsuario == 2) {
      this.showDatePicker =   !this.showDatePicker;
    }
  }

  setDate(event: any) {
    const value = event.detail.value;
    this.formDataConsumo.get('fecha')?.setValue(value);
    this.showDatePicker = false;
  }
  
  
   fillNameByDNI() {
    let dni = this.formDataConsumo.get('nroDocumento')?.value || '';
    // console.log("Dni typeof:", typeof dni);
    // console.log("Dni value:", dni);
    // console.log("Dni length:", dni.length);
    if (typeof dni == "number" ){
      dni = dni.toString(); // Convertir a string si es un número
    }
    // console.log("Dni typeof:", typeof dni);
    // console.log("Dni value:", dni);
    // console.log("Dni length:", dni.length);
  
    if (dni.length >= 5) {
      console.log('Fetching Empleado by DNI:', dni);
  
      this.comedorService.getEmpleadoByIDorDNI(dni.trim(), 'true').pipe(
        take(1),
        switchMap(res => {

          this.authorizationPinAnularConsumo = res.PinAutorizacion || ''; // Guardamos el pin de autorización del empleado
          console.log('Fetched Empleado by DNI:', res);
          this.employeeNotFound = false; // Reseteamos el estado de empleado no encontrado
  
          if (this.formDataConsumo) {
            this.formDataConsumo.patchValue({
              nombre: res.Nombre,
              idEmpleado: res.IDEmpleado
            });
          }
  
          // Si tiene permiso, llamamos a listarComedores (que ahora devuelve un observable)
          if (res.IDPermiso != null) {
            return this.listarComedores(res.IDPermiso);
          }
          // Si no hay permisos, retornamos un observable vacío
          return of(void 0);
        })
      ).subscribe({
        error:  (err) => {
          console.error('Error fetching Empleado by DNI:', err);
          this.employeeNotFound = true; // Para mostrar línea roja si no se encuentra el empleado 


           this.onErrorFetchEmpleadoByDNI("Error al obtener el empleado por DNI: " + err.error);
        }
      });
    } else {
       this.onErrorFetchEmpleadoByDNI();
    }
  }

   onErrorFetchEmpleadoByDNI(message:string = 'Por favor, ingrese un número de cédula válido (6 dígitos o más).') {
      // Resetear si DNI no es válido
      this.formDataConsumo?.patchValue({
        nombre: '',
        comedorID: 0
      });
      this.comedores = [];
      this.showError(message);
      //  this.showAlert(message);
  }

  actualComedorName = '';

  listarComedores(id: number): Observable<void> {
    if (this.authInfo && this.authInfo.TipoUsuario != 1) {
      return this.comedorService.GetComedorByID(this.authInfo.IDComedor).pipe(
        take(1),
        tap((comedor) => {
          this.comedores = [{
            comedorID: comedor.IDComedor,
            nombre: comedor.Nombre
          }];
          this.formDataConsumo.patchValue({
            comedorID: comedor.IDComedor
          });
          this.actualComedorName = comedor.Nombre;
        }),
        map(() => void 0)
      )
    }else{
      return this.comedorService.GetPermisoComedorByID(id).pipe(
        take(1),
        tap((res: PermisoComedor) => {
          if (res.Detalle && Array.isArray(res.Detalle)) {
            this.comedores = res.Detalle.map((comedor) => ({
              comedorID: comedor.IDComedor,
              nombre: comedor.NombreComedor
            }));
          } else {
            console.warn('Detalle is null or not an array.');
          }
          console.log('Fetched Comedores:', this.comedores);
        }),
        map(() => void 0) // Para devolver Observable<void>
      );
    }
  }

    private buildConsumoBody(): Consumo {
      const values = this.formDataConsumo!.value;
      console.log("values:", values);

      if (typeof values.nroDocumento == "number"){
        values.nroDocumento = values.nroDocumento.toString(); // Convertir a string si es un número
      }
      
      const baseConsumo: Consumo = this.idToEdit > 0
        ? { ...this.consumoToEdit }
        : {
            IDConsumo: 0,
            IDUsuarioCreacion: this.authInfo?.IDUsuario ?? 0,
            FechaEdicion: new Date().toISOString().split('T')[0],
            IDUsuarioEdicion: this.authInfo?.IDUsuario ?? 0,
            Anulado: false,
            IDUsuarioAnulacion: null,
            FechaAnulacion: null,
            FechaTransaccion: new Date().toISOString().split('T')[0],
            HoraTransaccion: new Date().toISOString().split('T')[0],
            IDEmpleado: 0,
            IDComedor: 0,
            Monto: 0,
            NombreEmpleado: '',
            NombreComedor: '',
            NroDocumento: '',
            Empleado: null,
            Comedor: null,
            Observaciones: '',
            TipoConsumo: 1,
          };
    
      return {
        ...baseConsumo,
        Anulado: values.anulado || false,
        FechaTransaccion: values.fecha ? new Date(values.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        NombreEmpleado: values.nombre,
        IDEmpleado: values.idEmpleado,
        Monto: values.monto,
        IDComedor: values.comedorID,
        NroDocumento: values.nroDocumento,
        Observaciones: values.observaciones,
        pinAutorizacion: values.pinAutorizacion,
        IDUsuarioEdicion: this.authInfo?.IDUsuario ?? 0,
        TipoConsumo: values.tipoConsumo, // Asignamos un valor por defecto si no se especifica
        FechaEdicion: new Date()
      };
    }
    


    authorizationPinAnularConsumo: string = ''; // Variable para almacenar el PIN de autorización (deberia hacerse en back esta logica)
    async anularConsumo() {
      //Copiamos original body y ponemos anular en false:
      const consumoBody = {...this.consumoToEdit}
      consumoBody.Anulado = true; // Marcamos como anulado
      // const pin = this.formDataConsumo.get('pinAutorizacion')?.value;
      // if ((!pin || pin.trim() === ' =') && this.authInfo && this.authInfo.TipoUsuario != 1) {
      //    this.showError('Por favor, ingrese el PIN de autorización para anular el consumo.');
      //   return;
      // }
      //Para anular seteamos automaticamente el pinAutorizacion: (TODO: LLevarlo a back luego)
      consumoBody.pinAutorizacion = this.authorizationPinAnularConsumo; // Agregamos el PIN de autorización

      


      this.comedorService.updateConsumo(consumoBody).pipe(take(1)).subscribe({
        next: async (res) => {
          console.log('Consumo anulado correctamente:', res);
          this.formDataConsumo.patchValue({
            anulado: true,
            fechaEdicion: new Date().toISOString().split('T')[0],
            idUsuarioEdicion: this.authInfo?.Nombre
          });
          this.showConfirm('Consumo anulado correctamente', () => {
            this.router.navigate(['/comedor/abm/consumos']);
          }, ()=>{return}, true);
        },
        error: async (err) => {
          console.error('Error al anular consumo:', err);
          this.showError('Error al anular el consumo. ' + err.error + '. Por favor, inténtelo de nuevo.');
          console.log('ConsumoBody:', consumoBody);
        }
      });
    }


    cancelNewConsumo(){
      // Navegamos a la lista de consumos
      this.router.navigate(['/comedor/abm/consumos']);
    }


  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        this.fillNameByDNI()
    }
  }

  showEditView(){
    if (this.authInfo && this.authInfo.TipoUsuario == 1) {
      this.onWarnAnularConsumo() 
    }else{
      if (this.formDataConsumo.get('nombre')?.value == '' ) {
        this.fillNameByDNI();
      }

      this.onWarnAnularConsumo() 
      //logica anterior, pedia pinAutorizacion para anular:
      // this.editView = true;
      // // this.formDataConsumo.controls['nroDocumento']?.enable(); // Deshabilitar nroDocumento en vista de detalle
      // // this.formDataConsumo.controls['monto']?.enable(); // Deshabilitar fecha en vista de detalle
      // this.formDataConsumo.controls['pinAutorizacion']?.enable(); // Habilitar pinAutorizacion en vista de edición
      // this.showConfirm("Por favor, ingrese el PIN de autorización para anular el consumo.", ()=>{return}, ()=>{return}, true)
    }
  }

  showDetailView(){
    this.editView = false;
    this.formDataConsumo.controls['pinAutorizacion']?.disable(); // Deshabilitar pinAutorizacion en vista de detalle
    // this.formDataConsumo.controls['nroDocumento']?.disable(); // Deshabilitar nroDocumento en vista de detalle
    // this.formDataConsumo.controls['monto']?.disable(); // Deshabilitar fecha en vista de detalle
  }

onWarnAnularConsumo() {
  this.showConfirm(
    '¿Está seguro que desea anular este consumo?\nEsta acción no se puede deshacer.',
    () => this.anularConsumo(),
    () => console.log('Anulación cancelada')
  );
}

// Variables necesarias
showAlerta = false;
alertMessage = '';
alertTitle = '';
omitCancel = false; // Si no se muestran los botones de confirmar/cancelar

// Si hay botones de confirmar/cancelar
showConfirmButtons = false;
onConfirmFn: () => void = () => {};
onCancelFn: () => void = () => {};

// Alerta simple
showError(msg: string) {
  this.alertTitle = 'Error';
  this.alertMessage = msg;
  this.showConfirmButtons = false;
  this.showAlerta = true;
}

// Confirmación personalizada
showConfirm(msg: string, onConfirm: () => void, onCancel: () => void  = () => {}, omitCancel:boolean = false) {
  this.alertTitle = 'Confirmación';
  this.alertMessage = msg;
  this.onConfirmFn = onConfirm;
  this.onCancelFn = onCancel;
  this.showConfirmButtons = true;
  this.omitCancel = omitCancel; 
  this.showAlerta = true;
}

// Acciones de los botones
closeAlert() {
  this.showAlerta = false;
}

onConfirmClick() {
  this.closeAlert();
  this.onConfirmFn();
}

onCancelClick() {
  this.closeAlert();
  this.onCancelFn();
}



  selectTipoConsumo(valor: number) {
    if (this.detailView){
      return
    }

    const control = this.formDataConsumo.get('tipoConsumo');
    if (control && control?.value !== valor) {
      control.setValue(valor);
    } else {
      // Forzar detección si se hace click en el mismo valor
      control?.setValue(null); // o algo temporal si querés animación visual
      setTimeout(() => control?.setValue(valor), 0);
    }

    //Deshabilitamos pinAutorizacion si es tipo 2 (no requiere autorización)
    if (valor == 2){
      this.formDataConsumo.controls['pinAutorizacion'].disable();
      this.formDataConsumo.get('pinAutorizacion')?.setValue(''); // Limpiamos el valor del pin
    }else{
      this.formDataConsumo.controls['pinAutorizacion'].enable();
      this.formDataConsumo.get('pinAutorizacion')?.setValue(''); // Limpiamos el valor del pin
    }

    control?.markAsTouched(); // Opcional: marcar como tocado para validaciones
  }

}
