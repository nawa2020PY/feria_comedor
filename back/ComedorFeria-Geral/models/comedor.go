package models

import "ComedorAbm-Geral/db"

type LoginResponse struct {
	Usuario *db.Usuario `json:"usuario"`
	JWT     string      `json:"jwt"`
}

type UserInput struct {
	Usuario     string `json:"usuario"`     //max 20 length
	Password    string `json:"password"`    //max 20 length
	Nombre      string `json:"nombre"`      //max 150 length
	TipoUsuario int    `json:"tipoUsuario"` // 1: admin, 2: empleado
	IDComedor   int    `json:"idComedor"`   //max 20 length
	Activo      bool   `json:"activo"`
}

type UserInputLogin struct {
	Usuario  string `json:"usuario"`  //max 20 length
	Password string `json:"password"` //max 20 length
}

type EmpleadoInput struct {
	Nombre       string `json:"nombre"`       //max 150 length , opcional
	NroDocumento string `json:"nroDocumento"` //max 20 length
	Activo       bool   `json:"activo"`
	IDSucursal   int    `json:"idSucursal"` //max 20 length
}

type ConsumoInput struct { //Aca en el front le pedimos el documento y luego autocompletamos nosotros con name e id_empleado
	Anulado      bool   `json:"anulado"`
	Monto        int    `json:"monto"`            //opcional
	Fecha        string `json:"fechaTransaccion"` //YYYY-MM-DD TODO: RECORDAR FechaTransaccion
	IdComedor    int    `json:"idComedor"`
	IdEmpleado   *int   `json:"idEmpleado"`
	NroDocumento string `json:"nroDocumento"` //max 20 length
	TipoConsumo  *int   `json:"tipoConsumo"`  // 1: En Local, 2: Delivery

	NombreEmpleado string `json:"nombreEmpleado"` //max 150 length

	//Nombre          string `json:"nombre"`          //max 150 length, no tinene nombres los consumos
	PinAutorizacion string `json:"pinAutorizacion"` //max 4 length
}

type ComedorInput struct {
	Nombre   string  `json:"nombre"`   //max 150 length
	Contacto *string `json:"contacto"` //max 150 length
	Telefono *string `json:"telefono"` //max 15 length
	Activo   bool    `json:"activo"`
}

type PermisoComedorInput struct {
	Nombre string `json:"nombre"` //max 150 length
	Activo bool   `json:"activo"`
	//Comedores Activos:
	Comedores []int `json:"comedores"` // IDs de los comedores a los que tiene acceso
}
