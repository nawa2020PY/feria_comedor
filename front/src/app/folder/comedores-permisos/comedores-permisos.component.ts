import { LocationStrategy } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { take } from 'rxjs';
import { PermisoComedor } from 'src/app/models/interfaces';
import { ComedorService } from 'src/app/services/comedor.service';

@Component({
  selector: 'app-comedores-permisos',
  templateUrl: './comedores-permisos.component.html',
  styleUrls: ['./comedores-permisos.component.scss'],
  standalone: false,

})
export class ComedoresPermisosComponent  implements OnInit {
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);

  keysToShow: (keyof PermisoComedor)[] = [
    // 'IDEmpleado',
    'Nombre',
    "Activo", 
  ];
  
  data: PermisoComedor[] = []

  constructor(private comedorService:ComedorService,
    private locationS: LocationStrategy,
    private router: Router,
  ) {}

  ngOnInit() {
    this.listarEmpleados();


    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
  }

  listarEmpleados() {
    this.comedorService.ListPermisosComedores().pipe(take(1)).subscribe({
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
