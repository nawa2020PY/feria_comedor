import { LocationStrategy } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';

import { Empleado } from 'src/app/models/interfaces';
import { ComedorService } from 'src/app/services/comedor.service';


@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.scss'],
  standalone: false,

})
export class EmpleadosComponent  implements OnInit {

  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);

  keysToShow: (keyof Empleado)[] = [
    // 'IDEmpleado',
    'Nombre',
    'NroDocumento',
    "Activo",
    "PinAutorizacion",
    "NombreSucursal"
  ];
  
  data: Empleado[] = []

  constructor(private comedorService:ComedorService, 
    private router: Router, 
    private locationS: LocationStrategy

  ) {}

  ngOnInit() {
    this.listarEmpleados();


    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
  }

  listarEmpleados() {
    this.comedorService.ListEmpleados().pipe(take(1)).subscribe({
      next: (res) => {
        this.data = res;
      },
      error: (err) => {
        console.error(err);
      }
    });

  }

  edit(idEmpleado: number) {
    // Implement edit functionality here
    console.log('Edit Empleado with ID:', idEmpleado);
  }


}
