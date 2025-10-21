import { LocationStrategy } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { Comedor, Consumo } from 'src/app/models/interfaces';
import { JwtClaims, AuthServiceService } from 'src/app/services/auth-service.service';
import { ComedorService } from 'src/app/services/comedor.service';

@Component({
  selector: 'app-consumos',
  templateUrl: './consumos.component.html',
  styleUrls: ['./consumos.component.scss'],
  standalone: false,
})
export class ConsumosComponent  implements OnInit {
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);

  keysToShow: (keyof Consumo)[] = [
    'IDConsumo',
    "NombreComedor",
    'FechaTransaccion',
    'NroDocumento',
    'NombreEmpleado',
    'Monto',
    "Anulado",
    "TipoConsumo"
  ];

  selectedComedor: number = -1;
  comedores:Comedor[] = []; // List of comedores to show in the dropdown (comedores que existen en los consumos)
  availableComedores: number[] = [];
  

  searchValue: string = '';

  data: Consumo[] = []
  originalData: Consumo[] = [];

  authInfo: JwtClaims | undefined;

  constructor(private comedorService:ComedorService, private router:Router,
    private cdr: ChangeDetectorRef, private auth: AuthServiceService, private locationS: LocationStrategy
  ) {

    this.auth.decodeToken().then((decodedToken) => {
      this.authInfo = decodedToken as JwtClaims;
        this.listarConsumos();
    }).catch((error) => {
      console.error('Error decoding token:', error);
      this.authInfo = {} as JwtClaims; // Provide a fallback or handle the error appropriately
      this.listarConsumos();
    });
  }



  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;

    this.comedorService.getActualizarConsumos$().subscribe({
      next: (res) => {
        if (res) {
          this.refreshData(null); // Refresh data when the service emits a new value
        }
      },
      error: (err) => {
        console.error('Error in actualizarConsumos subscription:', err);
      }
    });
  }

  testIonSelect(){
    // This function is just for testing the ion-select component
    console.log('IonSelect triggered');
  }



  searchType = 'nroDocumento'; 
  search(value:string | null | undefined){
    if (value != "" && value != null && value != undefined) {
      console.log('Searching for:', value);

      this.data = this.originalData.filter(consumo => 
        (consumo.NroDocumento && consumo.NroDocumento.toString().includes(value)) || 
        (consumo.NombreEmpleado && consumo.NombreEmpleado.toLowerCase().includes(value.toLowerCase()))
      );

    }else{
      console.log('Resetting search filter');
      this.refreshData("");      
      // let deepCopyData = JSON.stringify(this.originalData); // Deep copy to reset filter
      // this.data = JSON.parse(deepCopyData);
    } 
  }

  listarComedores() {
    // let setOfComedoresIDs: Set<number> = new Set<number>(); // List of comedores to show in the dropdown (comedores que existen en los consumos)
    // // Fetch the list of comedores from the service
    // this.originalData.forEach(consumo => {
    //   if (consumo.IDComedor && !setOfComedoresIDs.has(consumo.IDComedor)) {
    //     setOfComedoresIDs.add(consumo.IDComedor);
    //   }
    // })

    // Filter the comedores based on the IDs found in the consumos
    this.comedorService.ListComedores(`byIDs=${this.availableComedores.join(',')}`).pipe(take(1)).subscribe({
      next: (res) => {
        this.comedores = res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }


  listarConsumos(params:string = "") {
    if (this.authInfo != undefined && this.authInfo.TipoUsuario == 2) {
      // If the user is not an admin, filter the app pages to only show consumos
      console.log("User is not an admin, filtering by IDComedor and today's date");
      params = `id_comedor=${this.authInfo.IDComedor}&fecha_inicio=${new Date().toISOString().split('T')[0]}`;
    }

    this.comedorService.ListConsumos(params).pipe(take(1)).subscribe({
      next: (res) => {
        this.data = res;
        let deepCopyData = JSON.stringify(res) // Deep copy to reset filter
        this.originalData = JSON.parse(deepCopyData);


        this.availableComedores = Array.from(new Set(res.map(consumo => consumo.IDComedor)));        // Extract unique comedores from the data for filtering

        // Reset selectedComedor to show all data initially
        this.selectedComedor = -1;
        this.listarComedores(); // Call to populate the comedores list
      },
      error: (err) => {
        console.error(err);
      }
    });
  }


  edit(idConsumo: number) {
    // Navigate to the edit page with the selected ID
    this.router.navigate(['/comedor/abm/consumo/edit', idConsumo]);

    // Implement edit functionality here
    console.log('Edit Consumo with ID:', idConsumo);
  }

  filterByComedor() {
    if (this.selectedComedor && this.selectedComedor > 0) {
      this.data = this.originalData.filter(consumo => consumo.IDComedor == this.selectedComedor);
    } else {
      // this.listarConsumos(); // Reset to original data if no filter is selected
      let deepCopyData = JSON.stringify(this.originalData); // Deep copy to reset filter
      this.data = JSON.parse(deepCopyData);
    }
  }

  //TODO: Luego filtro por fechas

  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;

  filterByDate(){

  }


  create(){
    // Navigate to the create page
    this.router.navigate(['/comedor/abm/consumo/create']);
    // Implement create functionality here
    // console.log('Create new Consumo');
  }

  refreshData(event:any){
    setTimeout(() => {
      this.listarConsumos();
      this.cdr.detectChanges(); // Detect changes to update the view
      event?.target?.complete();
    }, 500); // Delay para refrescar asi no ejecutan tantas queries al servidor
  }

  getOnlyDate(fecha: Date | string ): string {
    if (fecha instanceof Date) {
      // If fecha is already a Date object, format it to YYYY-MM-DD
      return fecha.toISOString().split('T')[0];
    }
    // If fecha is a string, parse it to a Date object
    if (typeof fecha === 'string' && !isNaN(Date.parse(fecha))) {
      // If fecha is a valid date string, parse it
      return new Date(fecha).toISOString().split('T')[0];
    }

    const fechaTrans = new Date(fecha);
    const fechaTransStr = fechaTrans.toISOString().split('T')[0];
    return fechaTransStr
  }
}
