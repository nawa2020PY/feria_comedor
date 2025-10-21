import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { HTTP } from '@ionic-native/http/ngx';
import { AuthServiceService } from './auth-service.service';
import { AlertController, Platform } from '@ionic/angular';
import { from, Observable, switchMap } from 'rxjs';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor(
    private http: HttpClient,
    private httpNative: HTTP,
    private authService: AuthServiceService,
    private platform: Platform,
    private alertController: AlertController,
    private fileOpener: FileOpener
  ) {}

  async descargarExcel(url: string): Promise<void> {
    try {
      const blob = await this.get<Blob>(url, true).toPromise();

      if (!blob) throw new Error('Blob is undefined');

      const base64Data = await this.blobToBase64(blob);

      // Guardar archivo
      const fileName = 'consumos.xlsx';

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data,
        recursive: true
      });

      const fileUri = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Data
      });

      const path = fileUri.uri;

      console.log('Archivo guardado en:', path);

      // 🔓 Abrir con FileOpener
      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        this.fileOpener.open(path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .then(() => {
              console.log('Archivo abierto con éxito');
              return; // Retorna un Promise<void>
            })
            .catch(err => {
            console.error('No se pudo abrir el archivo:', err);
            this.showAlert('No se pudo abrir el archivo. Verifica que tengas una app para visualizar Excel.');
          });

      }else{
        // En navegador, abrir en una nueva pestaña
        const a = document.createElement('a');
        a.href = path;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return
      }

      await this.successAlert('Archivo Excel descargado exitosamente.');

    } catch (error) {
      console.error('Error al descargar Excel:', error);
      if (error instanceof Error && error.message.includes('Permission denied')) {
        await this.showAlert('Permiso denegado al escribir el archivo. Asegúrate de tener los permisos necesarios.');
      } else {
        await this.showAlert('Error al descargar el archivo Excel.');
      }
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    if (!(blob instanceof Blob)) return Promise.reject('El objeto proporcionado no es un Blob');
    return this.blobToBase64Manual(blob);
  }

  private get<T>(url: string, asBlob = false): Observable<T | Blob> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const headers = {
            Authorization: `Bearer ${token}`,
            Accept: asBlob
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/json',
          };

          return from(this.httpNative.sendRequest(url, {
            method: 'get',
            headers,
            serializer: 'utf8',
            responseType: asBlob ? 'arraybuffer' : 'json',
          })).pipe(
            switchMap(response => {
              if (asBlob) {
                const byteArray = new Uint8Array(response.data);
                const blob = new Blob([byteArray], {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                return from([blob]);
              } else {
                const data: T = response.data;
                return from([data]);
              }
            })
          );
        })
      );
    } else {
      return from(this.authService.getToken()).pipe(
        switchMap(token => {
          const options = {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: asBlob
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/json',
            },
          };

          return this.http.get<T | Blob>(url, options);
        })
      );
    }
  }

  private async blobToBase64Manual(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async showAlert(subTitle: string = 'Ha ocurrido un error') {
    const alert = await this.alertController.create({
      header: 'Atención',
      subHeader: 'Algo salió mal',
      message: subTitle,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async successAlert(subTitle: string = 'Operación exitosa') {
    this.alertController.create({
      header: 'Éxito',
      subHeader: 'Operación exitosa',
      message: subTitle,
      buttons: ['OK'],
    }).then(alert => alert.present());
  }
}