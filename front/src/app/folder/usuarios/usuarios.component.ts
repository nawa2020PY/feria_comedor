import { LocationStrategy } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { Usuario } from 'src/app/models/interfaces';
import { ComedorService } from 'src/app/services/comedor.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
  standalone: false,

})
export class UsuariosComponent  implements OnInit {


  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);

  keysToShow: (keyof Usuario)[] = [
    // 'IDEmpleado',
    "Usuario",
    'Nombre',
    "Activo",
    "TipoUsuario",
  ];
  
  data: Usuario[] = []

  constructor(private comedorService:ComedorService, private router:Router
    , private locationS: LocationStrategy
  ) {}

  ngOnInit() {
    this.listarEmpleados();

    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
  }

  listarEmpleados() {
    this.comedorService.ListUsuarios().pipe(take(1)).subscribe({
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
    this.router.navigate(['/comedor/abm/usuarios/edit', idEmpleado]);
  } 
  create(){
    this.router.navigate(['/comedor/abm/usuarios/create']);
  }

}
