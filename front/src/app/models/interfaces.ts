export interface Consumo {
    IDConsumo:          number;
    IDUsuarioCreacion:  number;
    FechaEdicion:       Date | string;
    IDUsuarioEdicion:   number;
    Anulado:            boolean;
    IDUsuarioAnulacion: null;
    FechaAnulacion:     null;
    FechaTransaccion:   Date | string;
    HoraTransaccion:    Date | string;
    IDEmpleado:         number;
    IDComedor:          number;
    Monto:              number;
    NombreEmpleado:     string;
    NombreComedor:      string;
    NroDocumento:       string;
    Observaciones:      string;
    Empleado:           Empleado | null;
    Comedor:            Comedor | null;
    TipoConsumo:     number | null;
    pinAutorizacion?: string;
}

export interface Comedor {
    IDComedor:               number;
    Nombre:                  string;
    Telefono:                string | null;
    Contacto:                string | null;
    Activo:                  boolean;
    Consumos?:                null;
    Usuarios?:                null;
    EmpleadoComedores?:       null;
    DetallePermisoComedores?: null;
}

export interface Empleado {
    IDEmpleado:      number;
    NroDocumento:    string;
    Nombre:          string;
    Activo:          boolean;
    IDSucursal:      null;
    // IDPermiso:       number | null;
    IDPermiso:       number;
    PinAutorizacion: string;
    NombreSucursal:  null;
    Sucursal:        Sucursal;
    PermisoComedor:  PermisoComedor;
    Consumos:        null;
    Comedores:       null;
}

export interface PermisoComedor {
    IDPermiso: number;
    Nombre:    string;
    Activo:    boolean;
    Detalle:   Detalle[] | null;
}

export interface Sucursal {
    IDSucursal: number;
    Nombre:     string;
    Activo:     boolean;
    Empleados:  null;
}

export interface Detalle {
    IDPermiso:     number;
    IDComedor:     number;
    NombreComedor: string;
    Activo:        boolean;
    Permiso:       Consumo;
    Comedor:       Comedor;
}


export interface Usuario {
    IDUsuario:        number;
    Usuario:          string;
    Password:         string;
    Nombre:           string;
    IDComedor:        number;
    FechaCreacion?:    Date;
    Activo:           boolean;
    IDUsuarioEdicion?: null | Date;
    TipoUsuario:      number;
    NombreComedor?:    string;
    NombreTipo?:       string;
    ConsumosCreados?:  null | Consumo[];
    ConsumosEditados?: null | Consumo[];
    ConsumosAnulados?: null | Consumo[];
    Comedor?:          Comedor;
}


export interface LoginResponse {
    usuario: Usuario;
    jwt:     string;
}
