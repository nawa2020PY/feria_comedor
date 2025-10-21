package db

import "time"

type Sucursal struct {
	IDSucursal int    `gorm:"column:id_sucursal;primaryKey;not null"`
	Nombre     string `gorm:"column:nombre;type:varchar(150);not null"`
	Activo     bool   `gorm:"column:activo;not null"`

	Empleados []Empleado `gorm:"foreignKey:IDSucursal;references:IDSucursal"`
}

func (Sucursal) TableName() string {
	return "sucursales"
}

//---------

type Empleado struct {
	IDEmpleado      int     `gorm:"column:id_empleado;primaryKey;not null"`
	NroDocumento    string  `gorm:"column:nro_documento;type:varchar(20);not null"`
	Nombre          string  `gorm:"column:nombre;type:varchar(150);not null"`
	Activo          bool    `gorm:"column:activo;not null"`
	IDSucursal      *int    `gorm:"column:id_sucursal"`
	IDPermiso       *int    `gorm:"column:id_permiso"`
	PinAutorizacion string  `gorm:"column:pin_autorizacion;type:varchar(4);not null"`
	NombreSucursal  *string `gorm:"column:nombre_sucursal;type:varchar(150)"`

	Sucursal       Sucursal          `gorm:"foreignKey:IDSucursal"`
	PermisoComedor PermisoComedor    `gorm:"foreignKey:IDPermiso"`
	Consumos       []Consumo         `gorm:"foreignKey:IDEmpleado"`
	Comedores      []EmpleadoComedor `gorm:"foreignKey:IDEmpleado"`
}

func (Empleado) TableName() string {
	return "empleados"
}

//------------------

type Usuario struct {
	IDUsuario        int        `gorm:"column:id_usuario;primaryKey;not null"`
	Usuario          string     `gorm:"column:usuario;type:varchar(20);not null"`
	Password         string     `gorm:"column:password;type:varchar(20);not null"`
	Nombre           *string    `gorm:"column:nombre;type:varchar(150)"`
	IDComedor        int        `gorm:"column:id_comedor;not null"`
	FechaCreacion    time.Time  `gorm:"column:fecha_creacion"`
	Activo           bool       `gorm:"column:activo;not null"`
	FechaEdicion     *time.Time `gorm:"column:fecha_edicion"`
	IDUsuarioEdicion *int       `gorm:"column:id_usuario_edicion"`
	TipoUsuario      int        `gorm:"column:tipo_usuario;default:1;not null"`
	NombreComedor    *string    `gorm:"column:nombre_comedor;type:varchar(150)"`
	NombreTipo       *string    `gorm:"column:nombre_tipo;type:varchar(50)"`

	ConsumosCreados  []Consumo `gorm:"foreignKey:IDUsuarioCreacion"`
	ConsumosEditados []Consumo `gorm:"foreignKey:IDUsuarioEdicion"`
	ConsumosAnulados []Consumo `gorm:"foreignKey:IDUsuarioAnulacion"`
	Comedor          Comedor   `gorm:"foreignKey:IDComedor"`
}

func (Usuario) TableName() string {
	return "usuarios"
}

//-------------------

type Consumo struct {
	IDConsumo          int        `gorm:"column:id_consumo;primaryKey;not null"`
	IDUsuario          *int       `gorm:"column:id_usuario"`
	IDUsuarioCreacion  int        `gorm:"column:id_usuario_creacion"`
	FechaEdicion       time.Time  `gorm:"column:fecha_edicion"`
	IDUsuarioEdicion   int        `gorm:"column:id_usuario_edicion"`
	Anulado            bool       `gorm:"column:anulado"`
	IDUsuarioAnulacion *int       `gorm:"column:id_usuario_anulacion"`
	FechaAnulacion     *time.Time `gorm:"column:fecha_anulacion"`
	FechaTransaccion   time.Time  `gorm:"column:fecha_transaccion"`
	HoraTransaccion    *string    `gorm:"column:hora_transaccion"`
	IDEmpleado         *int       `gorm:"column:id_empleado"`
	IDComedor          *int       `gorm:"column:id_comedor"`
	Monto              float64    `gorm:"column:monto;type:numeric(10,0);default:0"`
	NombreEmpleado     *string    `gorm:"column:nombre_empleado;type:varchar(150)"`
	NombreComedor      *string    `gorm:"column:nombre_comedor;type:varchar(150)"`
	NroDocumento       *string    `gorm:"column:nro_documento;type:varchar(20)"`
	Observaciones      *string    `gorm:"column:observaciones"`
	TipoConsumo        *int       `gorm:"column:tipo_consumo;default:1"` // 1: En Local, 2: Delivery

	Empleado Empleado `gorm:"foreignKey:IDEmpleado"`
	Comedor  Comedor  `gorm:"foreignKey:IDComedor"`
}

func (Consumo) TableName() string {
	return "consumos"
}

//-------------------

type Comedor struct {
	IDComedor int     `gorm:"column:id_comedor;primaryKey;not null"`
	Nombre    string  `gorm:"column:nombre;type:varchar(150);not null"`
	Telefono  *string `gorm:"column:telefono;type:varchar(15)"`  // nullable
	Contacto  *string `gorm:"column:contacto;type:varchar(150)"` // nullable
	Activo    bool    `gorm:"column:activo;not null"`

	Consumos                []Consumo               `gorm:"foreignKey:IDComedor"`
	Usuarios                []Usuario               `gorm:"foreignKey:IDComedor"`
	EmpleadoComedores       []EmpleadoComedor       `gorm:"foreignKey:IDComedor"`
	DetallePermisoComedores []DetallePermisoComedor `gorm:"foreignKey:IDComedor"`
}

func (Comedor) TableName() string {
	return "comedores"
}

//-------------------

type EmpleadoComedor struct {
	IDEmpleado    int    `gorm:"column:id_empleado;primaryKey;not null"`
	IDComedor     int    `gorm:"column:id_comedor;primaryKey;not null"`
	NombreComedor string `gorm:"column:nombre_comedor;type:varchar(150);not null"`
	Activo        bool   `gorm:"column:activo;not null"`

	Empleado Empleado `gorm:"foreignKey:IDEmpleado"`
	Comedor  Comedor  `gorm:"foreignKey:IDComedor"`
}

func (EmpleadoComedor) TableName() string {
	return "empleados_comedores"
}

//-------------------

type PermisoComedor struct {
	IDPermiso int    `gorm:"column:id_permiso;primaryKey;not null"`
	Nombre    string `gorm:"column:nombre;type:varchar(150);not null"`
	Activo    bool   `gorm:"column:activo;not null"`

	Detalle []DetallePermisoComedor `gorm:"foreignKey:IDPermiso"`
}

func (PermisoComedor) TableName() string {
	return "permiso_comedores"
}

//-------------------

type DetallePermisoComedor struct {
	IDPermiso     int    `gorm:"column:id_permiso;primaryKey;not null"`
	IDComedor     int    `gorm:"column:id_comedor;primaryKey;not null"`
	NombreComedor string `gorm:"column:nombre_comedor;type:varchar(150);not null"`
	Activo        bool   `gorm:"column:activo;not null"`

	Permiso PermisoComedor `gorm:"foreignKey:IDPermiso"`
	Comedor Comedor        `gorm:"foreignKey:IDComedor"`
}

func (DetallePermisoComedor) TableName() string {
	return "detalle_permiso_comedores"
}
