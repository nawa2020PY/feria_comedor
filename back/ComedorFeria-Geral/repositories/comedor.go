package repositories

import (
	"ComedorAbm-Geral/db"
	"ComedorAbm-Geral/models"
	"context"
	"errors"
	"gorm.io/gorm"
	"log"
	"net/url"
	"strings"
	"time"
)

type ComedorRepository struct {
}

func NewComedorRepository() *ComedorRepository {
	return &ComedorRepository{}
}

func (cr *ComedorRepository) CreateUsuario(connection *gorm.DB, usuario db.Usuario) (int, error) {
	if err := connection.Model(db.Usuario{}).WithContext(context.TODO()).Create(&usuario).Error; err != nil {
		return 0, err
	}
	return usuario.IDUsuario, nil
}

func (cr *ComedorRepository) LoginUsuario(connection *gorm.DB, usuario *models.UserInputLogin) (*db.Usuario, error) {
	var usuarioDB db.Usuario
	if err := connection.Model(db.Usuario{}).WithContext(context.TODO()).Where("usuario = ? AND password = ?", usuario.Usuario, usuario.Password).First(&usuarioDB).Error; err != nil {
		return nil, err
	}
	return &usuarioDB, nil
}

func (cr *ComedorRepository) CreateEmpleado(connection *gorm.DB, empleado db.Empleado) (int, error) {
	if err := connection.Model(db.Empleado{}).WithContext(context.TODO()).Create(&empleado).Error; err != nil {
		return 0, err
	}
	return empleado.IDEmpleado, nil
}

func (cr *ComedorRepository) GetEmpleado(connection *gorm.DB, id string, byDNI string) (*db.Empleado, error) {
	var empleado db.Empleado
	if byDNI == "true" {
		// If byDNI is true, we search by NroDocumento
		if err := connection.Model(db.Empleado{}).WithContext(context.TODO()).Where("nro_documento = TRIM(?)", id).First(&empleado).Error; err != nil {
			return nil, err
		}
		return &empleado, nil
	} else {

		if err := connection.Model(db.Empleado{}).WithContext(context.TODO()).Where("id_empleado = ?", id).First(&empleado).Error; err != nil {
			return nil, err
		}
		return &empleado, nil
	}
}

func (cr *ComedorRepository) UpdateEmpleado(connection *gorm.DB, empleado db.Empleado) error {
	if err := connection.Model(db.Empleado{}).WithContext(context.TODO()).Where("id_empleado = ?", empleado.IDEmpleado).Updates(empleado).Error; err != nil {
		return err
	}
	return nil
}

func (cr *ComedorRepository) GetEmpleados(connection *gorm.DB, filters url.Values) ([]db.Empleado, error) {
	var empleados []db.Empleado
	query := connection.Model(db.Empleado{}).WithContext(context.TODO()).Preload("Sucursal").Preload("PermisoComedor").Preload("PermisoComedor.Detalle")

	if filters.Get("nombre") != "" {
		query = query.Where("nombre LIKE ?", "%"+filters.Get("nombre")+"%")
	}

	if filters.Get("nro_documento") != "" {
		query = query.Where("nro_documento LIKE ?", "%"+filters.Get("nro_documento")+"%")
	}

	if filters.Get("activo") != "" {
		query = query.Where("activo = ?", filters.Get("activo"))
	}

	if filters.Get("id_sucursal") != "" {
		query = query.Where("id_sucursal = ?", filters.Get("id_sucursal"))
	}

	if err := query.Find(&empleados).Error; err != nil {
		return nil, err
	}
	return empleados, nil
}

func (cr *ComedorRepository) CreateConsumo(connection *gorm.DB, consumo db.Consumo) (int, error) {
	if err := connection.Model(db.Consumo{}).WithContext(context.TODO()).Create(&consumo).Error; err != nil {
		return 0, err
	}
	return consumo.IDConsumo, nil
}

// GetConsumoByEmployeeID , y anulado en false
func (cr *ComedorRepository) GetConsumoByEmployeeID(connection *gorm.DB, employeeID int, comedorID int, byDate *time.Time) (*db.Consumo, error) {
	var consumo db.Consumo
	query := connection.Model(db.Consumo{}).WithContext(context.TODO()).Where("id_empleado = ? AND id_comedor = ? AND anulado = false", employeeID, comedorID)

	if byDate != nil {
		byDateformatted := byDate.Format("2006-01-02")
		query = query.Where("DATE(fecha_transaccion) = ?", byDateformatted)
	} else {
		query = query.Where("fecha_transaccion = ?", time.Now().Format("2006-01-02"))
	}

	if err := query.First(&consumo).Error; err != nil {
		return nil, err
	}
	return &consumo, nil

}

func (cr *ComedorRepository) GetConsumos(conn *gorm.DB, filters url.Values) ([]db.Consumo, error) {
	var consumos []db.Consumo
	query := conn.Model(db.Consumo{}).WithContext(context.TODO())

	if filters.Get("id_empleado") != "" {
		query = query.Where("id_empleado = ?", filters.Get("id_empleado"))
	}

	if filters.Get("id_comedor") != "" {
		query = query.Where("id_comedor = ?", filters.Get("id_comedor"))
	}

	if filters.Get("fecha_inicio") != "" {
		query = query.Where("DATE(fecha_transaccion) >= ?", filters.Get("fecha_inicio"))
	}
	if filters.Get("fecha_fin") != "" {
		query = query.Where("DATE(fecha_transaccion) <= ?", filters.Get("fecha_fin"))
	}

	if err := query.Find(&consumos).Error; err != nil {
		return nil, err
	}
	return consumos, nil
}

func (cr *ComedorRepository) CheckEmpleadoPin(connection *gorm.DB, empleadoID *int, dni string, pin string) (bool, error) {
	if empleadoID == nil && dni == "" {
		return false, errors.New("empleado or cedula is required")
	}
	if empleadoID == nil {
		empleadoID = new(int)
	}
	var empleado db.Empleado
	if err := connection.Model(db.Empleado{}).WithContext(context.TODO()).Where("(id_empleado = ? OR nro_documento = TRIM(?)) AND pin_autorizacion = ?", *empleadoID, dni, pin).First(&empleado).Error; err != nil {
		return false, err
	}
	return true, nil
}

func (cr *ComedorRepository) GetPermisosComedor(connection *gorm.DB, filters url.Values) ([]db.PermisoComedor, error) {

	var permisos []db.PermisoComedor
	query := connection.Model(db.PermisoComedor{}).WithContext(context.TODO()).Preload("Detalle")

	if filters.Get("id_permiso") != "" {
		query = query.Where("id_permiso = ?", filters.Get("id_permiso"))
	}

	if filters.Get("activo") != "" {
		query = query.Where("activo = ?", filters.Get("activo"))
	}

	if filters.Get("nombre") != "" {
		query = query.Where("nombre = ?", filters.Get("nombre"))
	}

	if err := query.Find(&permisos).Error; err != nil {
		return nil, err
	}
	return permisos, nil
}

func (cr *ComedorRepository) GetConsumoByID(connection *gorm.DB, id int) (*db.Consumo, error) {
	var consumo db.Consumo
	if err := connection.Model(db.Consumo{}).WithContext(context.TODO()).Where("id_consumo = ?", id).First(&consumo).Error; err != nil {
		return nil, err
	}
	return &consumo, nil
}

func (cr *ComedorRepository) UpdateConsumo(connection *gorm.DB, id int, consumo map[string]interface{}) error {
	if err := connection.Model(db.Consumo{}).WithContext(context.TODO()).Where("id_consumo = ?", id).Updates(consumo).Error; err != nil {
		return err
	}
	return nil
}

// GetPermisoComedorByID
func (cr *ComedorRepository) GetPermisoComedorByID(connection *gorm.DB, id int) (*db.PermisoComedor, error) {
	var permiso db.PermisoComedor
	if err := connection.Model(db.PermisoComedor{}).WithContext(context.TODO()).Where("id_permiso = ?", id).Preload("Detalle").First(&permiso).Error; err != nil {
		return nil, err
	}
	return &permiso, nil
}

func (cr *ComedorRepository) GetComedores(connection *gorm.DB, filters url.Values) ([]db.Comedor, error) {
	var comedores []db.Comedor
	query := connection.Model(db.Comedor{}).WithContext(context.TODO()).Preload("Usuarios").Preload("EmpleadoComedores").Preload("DetallePermisoComedores")

	if filters.Get("id_comedor") != "" {
		query = query.Where("id_comedor = ?", filters.Get("id_comedor"))
	}

	if filters.Get("activo") != "" {
		query = query.Where("activo = ?", filters.Get("activo"))
	}

	if filters.Get("nombre") != "" {
		query = query.Where("nombre LIKE ?", "%"+filters.Get("nombre")+"%")
	}

	if filters.Get("byIDs") != "" {
		ids := strings.Split(filters.Get("byIDs"), ",")
		query = query.Where("id_comedor IN (?)", ids)
	}

	if err := query.Find(&comedores).Error; err != nil {
		return nil, err
	}
	return comedores, nil
}

func (cr *ComedorRepository) CreateComedor(connection *gorm.DB, comedor db.Comedor) (int, error) {
	if err := connection.Model(db.Comedor{}).WithContext(context.TODO()).Create(&comedor).Error; err != nil {
		log.Printf("Error creating comedor: %v", err)
		return 0, err
	}
	return comedor.IDComedor, nil
}

func (cr *ComedorRepository) UpdateComedor(connection *gorm.DB, comedor map[string]interface{}, IDComedor int) error {
	if err := connection.Model(db.Comedor{}).WithContext(context.TODO()).Where("id_comedor = ?", IDComedor).Updates(comedor).Error; err != nil {
		return err
	}
	return nil
}

func (cr *ComedorRepository) GetComedorByID(connection *gorm.DB, id int) (*db.Comedor, error) {
	var comedor db.Comedor
	if err := connection.Model(db.Comedor{}).WithContext(context.TODO()).Where("id_comedor = ?", id).First(&comedor).Error; err != nil {
		return nil, err
	}
	return &comedor, nil
}

func (cr *ComedorRepository) GetUsers(connection *gorm.DB, filters url.Values) ([]db.Usuario, error) {
	var usuarios []db.Usuario
	query := connection.Model(db.Usuario{}).WithContext(context.TODO())

	if filters.Get("id_usuario") != "" {
		query = query.Where("id_usuario = ?", filters.Get("id_usuario"))
	}

	if filters.Get("usuario") != "" {
		query = query.Where("usuario LIKE ?", "%"+filters.Get("usuario")+"%")
	}

	if filters.Get("activo") != "" {
		query = query.Where("activo = ?", filters.Get("activo"))
	}

	if filters.Get("id_comedor") != "" {
		query = query.Where("id_comedor = ?", filters.Get("id_comedor"))
	}

	if err := query.Find(&usuarios).Error; err != nil {
		return nil, err
	}
	return usuarios, nil
}

func (cr *ComedorRepository) GetUserByID(connection *gorm.DB, id int) (*db.Usuario, error) {
	var usuario db.Usuario
	if err := connection.Model(db.Usuario{}).WithContext(context.TODO()).Where("id_usuario = ?", id).First(&usuario).Error; err != nil {
		return nil, err
	}
	return &usuario, nil
}

func (cr *ComedorRepository) UpdateUser(connection *gorm.DB, usuario map[string]interface{}, IDUsuario int) error {
	if err := connection.Model(db.Usuario{}).WithContext(context.TODO()).Where("id_usuario = ?", IDUsuario).Updates(usuario).Error; err != nil {
		return err
	}
	return nil
}

// //Validamos que el consumo a editar No tenga otro ya en ese mismo dia:
func (cr *ComedorRepository) GetConsumoByDateAndDistinctID(connection *gorm.DB, idEmpleado int, idConsumo int, fechaTransaccion time.Time) (*db.Consumo, error) {
	var consumo db.Consumo
	fechaStr := fechaTransaccion.Format("2006-01-02")
	if err := connection.Model(db.Consumo{}).WithContext(context.TODO()).
		Where("id_empleado = ? AND DATE(fecha_transaccion) = ? AND id_consumo <> ?", idEmpleado, fechaStr, idConsumo).
		First(&consumo).Error; err != nil {
		return nil, err
	}
	return &consumo, nil
}
