import { ExcelExportService } from './../../services/file-manager.service';
import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthServiceService, JwtClaims } from 'src/app/services/auth-service.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-exportar-consumos-modal',
  templateUrl: './exportar-consumos-modal.component.html',
  standalone: false,
})
export class ExportConsumosModalComponent {
  idComedor = '';
  fechaInicio = new Date().toISOString().substring(0, 10); // Formato YYYY-MM-DD
  fechaFin = '';

  authInfo: JwtClaims | undefined;

  constructor(private modalCtrl: ModalController, private http: HttpClient, private authservice:AuthServiceService, private excelExport:ExcelExportService) {

    this.authservice.decodeToken().then((decodedToken) => {
      this.authInfo = decodedToken as JwtClaims;
      if (this.authInfo.TipoUsuario != 1) {
          this.idComedor = this.authInfo.IDComedor.toString();
      }
      

    }).catch((error) => {
      console.error('Error decoding token:', error);
      this.authInfo = {} as JwtClaims; // Provide a fallback or handle the error appropriately
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async exportar() {
    let params = new HttpParams();
    if (this.authInfo != undefined && this.authInfo.TipoUsuario != 1) {
      params = params.set('id_usuario', this.authInfo.IDUsuario.toString());
      params.set('id_comedor', this.authInfo.IDComedor.toString());
      this.idComedor = this.authInfo.IDComedor.toString();
    }
    if (this.fechaInicio) params = params.set('fecha_inicio', this.fechaInicio);
    if (this.fechaFin) params = params.set('fecha_fin', this.fechaFin);

    let url = this.authservice.getValueApiUrl() + '/consumos/export'; 

    let excelUrl = `${url}?${params.toString()}`;

    await this.excelExport.descargarExcel(excelUrl)
    this.close()
  }
}
