import { LocationStrategy } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { Comedor } from 'src/app/models/interfaces';
import { ComedorService } from 'src/app/services/comedor.service';

@Component({
  selector: 'app-comedores',
  templateUrl: './comedores.component.html',
  styleUrls: ['./comedores.component.scss'],
  standalone: false,

})
export class ComedoresComponent  implements OnInit {

  data: Comedor[] = []
  keysToShow: (keyof Comedor)[] = [
    'IDComedor',
    'Nombre',
    'Activo',
    'Telefono',
    'Contacto'
  ];

  constructor(private comedorService:ComedorService, private router:Router
    , private locationS: LocationStrategy

  ) {
    this.listarComedores();
  }

  ngOnInit() {
    

    this.locationS.onPopState(() => {
      //Levamos a home:
      this.router.navigate(['/comedor/abm/home']);
    });
  }

  listarComedores() {
    this.comedorService.ListComedores().pipe(take(1)).subscribe({
      next: (res) => {
        this.data = res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  refreshData(event:any){
    setTimeout(() => {
      this.listarComedores();
      event.target.complete();
    }, 500); // Delay para refrescar asi no ejecutan tantas queries al servidor
  }

  edit(idComedor: number) {
    this.router.navigate(['/comedor/abm/comedores/edit', idComedor]);
  }

  create(){
    this.router.navigate(['/comedor/abm/comedores/create']);
  }

}
