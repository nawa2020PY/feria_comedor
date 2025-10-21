import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthServiceService, JwtClaims } from '../services/auth-service.service';
import { ExcelExportService } from '../services/file-manager.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: false,
})
export class LayoutComponent  implements OnInit {

  authInfo!: JwtClaims 
  

  public appPages = [
    { title: 'Inicio', url: 'abm/home', icon: 'home' },
    { title: 'Consumos', url: 'abm/consumos', icon: 'fast-food' },
    { title: 'Comedores', url: 'abm//comedores', icon: 'restaurant' },
    { title: 'Permiso de Comedores', url: 'abm/comedoresPermisos', icon: 'document-lock' },
    { title: 'Empleados', url: 'abm/empleados', icon: 'people-circle' },
    { title: 'Usuarios', url: 'abm/usuarios', icon: 'people' },
    // { title: 'Spam', url: '/folder/spam', icon: 'warning' },
  ];
  // public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  public labels = ['Exportar Consumos', 'Cerrar Sesión'];



  constructor(private authService:AuthServiceService, private excelExport:ExcelExportService) {
    this.authService.decodeToken().then((decodedToken) => {
      this.authInfo = decodedToken as JwtClaims;
      if (this.authInfo.TipoUsuario != 1) {
          this.idComedor = this.authInfo.IDComedor.toString();
      }
    }).catch((error) => {
      console.error('Error decoding token:', error);
      this.authInfo = {} as JwtClaims; // Provide a fallback or handle the error appropriately
    });
  }

  async ngOnInit() {
    let tokenInfo = await this.authService.decodeToken();
    if (tokenInfo != null) {
      this.authInfo = tokenInfo as JwtClaims;
      if (this.authInfo.TipoUsuario != 1) {
        this.appPages = [    { title: 'Inicio', url: 'abm/home', icon: 'home' },

          { title: 'Consumos', url: 'abm/consumos', icon: 'fast-food' },

        ];
      }
    }
  }


  signOut() {
    console.log('Signing out...');
    
    this.authService.logout();
  }

  showExportModal = false;

  showModalExport() {
    this.showExportModal = true;
    console.log('Modal de exportación abierto');
  }

  closeModalExport() {
    this.showExportModal = false;
    console.log('Exportación cancelada');
  }

  idComedor = '';
  fechaInicio = new Date().toISOString().substring(0, 10); // Formato YYYY-MM-DD
  fechaFin = '';

  async exportar() {
    console.log("Exportando consumos...");
    
    let params = new HttpParams();
    if (this.authInfo != undefined && this.authInfo.TipoUsuario != 1) {
      params = params.set('id_usuario', this.authInfo.IDUsuario.toString());
      params.set('id_comedor', this.authInfo.IDComedor.toString());
      this.idComedor = this.authInfo.IDComedor.toString();
    }
    if (this.fechaInicio) params = params.set('fecha_inicio', this.fechaInicio);
    if (this.fechaFin) params = params.set('fecha_fin', this.fechaFin);

    let url = this.authService.getValueApiUrl() + '/consumos/export'; 

    let excelUrl = `${url}?${params.toString()}`;

    await this.excelExport.descargarExcel(excelUrl)
    this.closeModalExport();
  }
}
