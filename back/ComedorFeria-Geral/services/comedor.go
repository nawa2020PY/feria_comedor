package services

import (
	"ComedorAbm-Geral/db"
	"ComedorAbm-Geral/models"
	"ComedorAbm-Geral/repositories"
	"errors"
	"fmt"
	"gorm.io/gorm"
	"log"
	"net/url"
	"strings"
	"time"
)

type ComedorService struct {
	repository *repositories.ComedorRepository
}

func NewComedorService() *ComedorService {
	return &ComedorService{
		repository: repositories.NewComedorRepository(),
	}
}

func (cs *ComedorService) CreateUsuario(usuario *models.UserInput) (int, error) {
	// Validate the input
	if usuario.Usuario == "" || usuario.Password == "" || usuario.Nombre == "" {
		return 0, errors.New("es requisito completar todos los campos obligatorios")
	}

	var usuarioDB db.Usuario
	usuarioDB.Usuario = usuario.Usuario
	usuarioDB.Password = usuario.Password
	usuarioDB.Nombre = &usuario.Nombre
	usuarioDB.IDUsuario = 0 //Cuando el ID es 0 entonces se crea, dado q es autoincremental
	usuarioDB.FechaCreacion = time.Now()

	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	// Create the user in the database
	id, err := cs.repository.CreateUsuario(conn, usuarioDB)
	if err != nil {
		return 0, err
	}

	return id, nil
}

func (cs *ComedorService) LoginUsuario(usuario *models.UserInputLogin) (*db.Usuario, error) {
	// Validate the input
	if usuario.Usuario == "" || usuario.Password == "" {
		return nil, errors.New("es requisito completar todos los campos obligatorios")
	}

	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.LoginUsuario(conn, usuario)
	if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, err
	} else if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, errors.New("usuario o contraseña incorrectos")
	}

	return response, nil
}

func (cs *ComedorService) CreateEmpleado(empleado *models.EmpleadoInput) (int, error) {
	// Validate the input
	if empleado.IDSucursal == 0 || empleado.NroDocumento == "" { //TODO: Ver si el nroDocumento es obligatorio
		return 0, errors.New("es requisito completar todos los campos obligatorios")
	}

	var empleadoDB db.Empleado
	empleadoDB.Nombre = empleado.Nombre
	empleadoDB.IDEmpleado = 0 //Cuando el ID es 0 entonces se crea, dado q es autoincremental
	empleadoDB.NroDocumento = empleado.NroDocumento
	empleadoDB.Activo = empleado.Activo
	empleadoDB.PinAutorizacion = GenerateRandomPin()

	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	//trim el nroDocumento para evitar problemas con espacios
	empleadoDB.NroDocumento = strings.TrimSpace(empleadoDB.NroDocumento)

	// Create the user in the database
	id, err := cs.repository.CreateEmpleado(conn, empleadoDB)
	if err != nil {
		return 0, err
	}

	return id, nil
}

func (cs *ComedorService) GetEmpleado(id string, byDNI string) (*db.Empleado, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetEmpleado(conn, id, byDNI)
	if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
		fmt.Println("error getting empleado from db:", err)
		return nil, err
	} else if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
		fmt.Println("empleado no encontrado")
		return nil, errors.New("empleado no encontrado")
	}

	return response, nil
}

func (cs *ComedorService) UpdateEmpleado(id string, empleado *models.EmpleadoInput) error {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	empleadoToUpdate, err := cs.GetEmpleado(id, "false")
	if err != nil {
		return err
	}

	// Validate the input
	if empleado.IDSucursal == 0 || empleado.NroDocumento == "" { //TODO: Ver si el nroDocumento es obligatorio
		return errors.New("es requisito completar todos los campos obligatorios")
	}

	var empleadoDB db.Empleado
	empleadoToUpdate.Nombre = empleado.Nombre
	empleadoToUpdate.NroDocumento = empleado.NroDocumento
	empleadoToUpdate.Activo = empleado.Activo
	//ver si quiere cambiar la sucursal (si esto es posible, o geral lo quiere)
	//empleadoToUpdate.IDSucursal = empleado.IDSucursal

	//trim el nroDocumento para evitar problemas con espacios
	empleadoToUpdate.NroDocumento = strings.TrimSpace(empleadoToUpdate.NroDocumento)

	err = cs.repository.UpdateEmpleado(conn, empleadoDB)
	if err != nil {
		return err
	}

	return nil
}

func (cs *ComedorService) GetEmpleados(filters url.Values) ([]db.Empleado, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetEmpleados(conn, filters)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (cs *ComedorService) CreateConsumo(consumo *models.ConsumoInput, userRequest map[string]interface{}) (int, error) {
	// Validate the input
	//if consumo.IdComedor == 0 || consumo.IdEmpleado == 0 { //TODO: Ver si el nroDocumento es obligatorio
	if consumo.IdComedor == 0 || (consumo.NroDocumento == "" && consumo.IdEmpleado == nil) {
		return 0, errors.New("es requisito completar todos los campos obligatorios")
	}
	log.Printf("UserRequest: %v", userRequest)
	if consumo.PinAutorizacion == "" && userRequest["TipoUsuario"].(int) != 1 && (consumo.TipoConsumo != nil && *consumo.TipoConsumo != 2) { //si no es admin, entonces debe completar el pin de autorizacion
		return 0, errors.New("es requisito completar el pin de autorizacion")
	}

	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	//chequeo si el pin es correcto
	//si no es de RRHH, entonces chequeo el pin y si el consumo no es delivery
	if userRequest["TipoUsuario"].(int) != 1 && (consumo.TipoConsumo != nil && *consumo.TipoConsumo != 2) {
		isCorrectPin, err := cs.repository.CheckEmpleadoPin(conn, consumo.IdEmpleado, consumo.NroDocumento, consumo.PinAutorizacion)
		if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
			fmt.Printf("error checking empleado Pin: %v", err)
			return 0, err
		}
		if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
			fmt.Println("empleado no encontrado o no tiene pin de autorización")
			return 0, errors.New("pin de autorización incorrecto")
		}
		if !isCorrectPin {
			return 0, errors.New("el pin de autorización es incorrecto")
		}
	}

	//consumoDB.Fecha parseamos:
	consumoFechaParsed, err := FlexibleParsedTime(consumo.Fecha)
	if err != nil {
		fmt.Printf("error parsing fecha: %v", err)
		return 0, errors.New("fecha debe estar en formato YYYY-MM-DD")
	}

	var consumoDB db.Consumo
	consumoDB.Anulado = consumo.Anulado
	consumoDB.Monto = float64(consumo.Monto)
	consumoDB.IDComedor = &consumo.IdComedor
	consumoDB.IDEmpleado = consumo.IdEmpleado
	if consumo.IdEmpleado == nil {
		empleado, err := cs.GetEmpleado(consumo.NroDocumento, "true")
		if err != nil {
			fmt.Printf("error getting empleado by nroDocumento: %v", err)
			return 0, err
		}
		consumoDB.IDEmpleado = &empleado.IDEmpleado
		consumoDB.NombreEmpleado = &empleado.Nombre //si no tengo el id del empleado, entonces busco por nroDocumento
	}
	consumoDB.NroDocumento = &consumo.NroDocumento
	consumoDB.IDUsuarioCreacion = userRequest["IDUsuario"].(int) //esto es el id del usuario que lo crea

	consumoDB.NombreEmpleado = &consumo.NombreEmpleado
	consumoDB.FechaTransaccion = consumoFechaParsed
	consumoDB.TipoConsumo = consumo.TipoConsumo // 1: En Local, 2: Delivery

	if consumoDB.IDEmpleado == nil {
		return 0, errors.New("el consumo debe tener un empleado asociado")
	}
	idUsuario := userRequest["IDUsuario"].(int)
	consumoDB.IDUsuario = &idUsuario //esto es el id del usuario que lo crea para q dsp el trigger funcione

	// Create the user in the database
	id, err := cs.repository.CreateConsumo(conn, consumoDB)
	if err != nil {
		return 0, err
	}

	return id, nil
}

func (cs *ComedorService) GetConsumos(filters url.Values, userInfo map[string]interface{}) ([]db.Consumo, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	//if userInfo["TipoUsuario"] != 2 { //si no es admin, entonces filtro por el id del usuario
	//	filters.Set("IDUsuario", fmt.Sprintf("%d", userInfo["IDUsuario"].(int)))
	//}

	response, err := cs.repository.GetConsumos(conn, filters)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (cs *ComedorService) GetPermisosComedor(filters url.Values) ([]db.PermisoComedor, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetPermisosComedor(conn, filters)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (cs *ComedorService) GetConsumoByID(id int) (*db.Consumo, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetConsumoByID(conn, id)
	if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, err
	} else if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, errors.New("consumo no encontrado")
	}

	return response, nil
}

func (cs *ComedorService) UpdateConsumo(id string, consumo *models.ConsumoInput, userRequest map[string]interface{}) error {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	// Convert id to int
	var idInt int
	if _, err := fmt.Sscanf(id, "%d", &idInt); err != nil {
		fmt.Printf("error converting id to int: %v", err)
		return errors.New("ID debe ser un número entero")
	}

	consumoToUpdate, err := cs.GetConsumoByID(idInt)
	if err != nil {
		return err
	}

	// Validate the input
	if consumo.IdComedor == 0 || (consumo.NroDocumento == "" && consumo.IdEmpleado == nil) {
		return errors.New("es requisito completar todos los campos obligatorios")
	}

	//si no soy rrhhType pregunto si el consumo es mio:
	if userRequest["TipoUsuario"].(int) != 1 && (consumo.TipoConsumo != nil && *consumo.TipoConsumo != 2) {
		//si no es admin, entonces debe completar el pin de autorizacion
		isCorrectPin, err := cs.repository.CheckEmpleadoPin(conn, consumo.IdEmpleado, consumo.NroDocumento, consumo.PinAutorizacion)
		if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
			fmt.Printf("error checking empleado Pin: %v", err)
			return err
		}
		if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
			fmt.Println("empleado no encontrado o no tiene pin de autorización")
			return errors.New("pin de autorización incorrecto")
		}
		if !isCorrectPin {
			return errors.New("el pin de autorización es incorrecto")
		}
	}

	//si no tengo el id del empleado, entonces busco por nroDocumento (para evitar panic)
	if consumoToUpdate.IDEmpleado == nil {
		//si no tengo el id del empleado, entonces busco por nroDocumento
		empleado, err := cs.GetEmpleado(consumo.NroDocumento, "true")
		if err != nil {
			fmt.Printf("error getting empleado by nroDocumento: %v", err)
			return err
		}
		consumoToUpdate.IDEmpleado = &empleado.IDEmpleado
	}

	consumoFechaParsed, err := FlexibleParsedTime(consumo.Fecha)
	if err != nil {
		fmt.Printf("error parsing fecha: %v", err)
		return errors.New("fecha debe estar en formato YYYY-MM-DD")
	}

	todayTime := time.Now()

	consumoToUpdate.Anulado = consumo.Anulado
	consumoToUpdate.Monto = float64(consumo.Monto)
	consumoToUpdate.IDComedor = &consumo.IdComedor
	consumoToUpdate.NombreEmpleado = &consumo.NombreEmpleado
	consumoToUpdate.IDEmpleado = consumo.IdEmpleado
	consumoToUpdate.NroDocumento = &consumo.NroDocumento
	if consumo.IdEmpleado == nil {
		empleado, err := cs.GetEmpleado(consumo.NroDocumento, "true")
		if err != nil {
			fmt.Printf("error getting empleado by nroDocumento: %v", err)
			return err
		}
		consumoToUpdate.IDEmpleado = &empleado.IDEmpleado
	}

	consumoToUpdate.FechaTransaccion = consumoFechaParsed
	consumoToUpdate.FechaEdicion = todayTime
	idUsuario := userRequest["IDUsuario"].(int)

	rawBodyMap := map[string]interface{}{
		"anulado":           consumo.Anulado,
		"fecha_transaccion": consumo.Fecha,
		"monto":             consumo.Monto,
		"id_comedor":        consumo.IdComedor,
		"id_empleado":       consumo.IdEmpleado,
		"nro_documento":     consumo.NroDocumento,
		"nombre_empleado":   consumo.NombreEmpleado,
		//
		"fecha_edicion": todayTime,
		"id_usuario":    &idUsuario,
	}

	err = cs.repository.UpdateConsumo(conn, consumoToUpdate.IDConsumo, rawBodyMap)
	if err != nil {
		return err
	}

	return nil
}

// GetPermisoComedorByID
func (cs *ComedorService) GetPermisoComedorByID(id int) (*db.PermisoComedor, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetPermisoComedorByID(conn, id)
	if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, err
	} else if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, errors.New("permiso comedor no encontrado")
	}

	return response, nil
}

func (cs *ComedorService) GetComedores(filters url.Values) ([]db.Comedor, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetComedores(conn, filters)
	if err != nil {
		return nil, err
	}

	return response, nil

}

func (cs *ComedorService) CreateComedor(comedor *models.ComedorInput) (int, error) {
	// Validate the input
	if comedor.Nombre == "" {
		return 0, errors.New("es requisito completar el campo nombre")
	}

	var comedorDB db.Comedor
	comedorDB.Nombre = comedor.Nombre
	comedorDB.Telefono = comedor.Telefono
	comedorDB.Contacto = comedor.Contacto
	comedorDB.Activo = comedor.Activo
	comedorDB.IDComedor = 0 //Cuando el ID es 0 entonces se crea, dado q es autoincremental

	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	// Create the user in the database
	id, err := cs.repository.CreateComedor(conn, comedorDB)
	if err != nil {
		return 0, err
	}

	return id, nil
}

func (cs *ComedorService) UpdateComedor(id string, comedor *models.ComedorInput) error {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	// Convert id to int
	var idInt int
	if _, err := fmt.Sscanf(id, "%d", &idInt); err != nil {
		fmt.Printf("error converting id to int: %v", err)
		return errors.New("ID debe ser un número entero")
	}

	comedorToUpdate, err := cs.repository.GetComedorByID(conn, idInt)
	if err != nil {
		return err
	}

	// Validate the input
	if comedor.Nombre == "" {
		return errors.New("es requisito completar el campo nombre")
	}

	comedorToUpdate.Nombre = comedor.Nombre
	comedorToUpdate.Telefono = comedor.Telefono
	comedorToUpdate.Contacto = comedor.Contacto
	comedorToUpdate.Activo = comedor.Activo

	mapComedor := map[string]interface{}{
		"nombre":   comedor.Nombre,
		"telefono": comedor.Telefono,
		"contacto": comedor.Contacto,
		"activo":   comedor.Activo,
	}

	err = cs.repository.UpdateComedor(conn, mapComedor, idInt)
	if err != nil {
		return err
	}

	return nil
}

func (cs *ComedorService) GetComedorByID(id int) (*db.Comedor, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetComedorByID(conn, id)
	if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, err
	} else if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, errors.New("comedor no encontrado")
	}

	return response, nil
}

func (cs *ComedorService) GetUsers(filters url.Values) ([]db.Usuario, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetUsers(conn, filters)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (cs *ComedorService) GetUserByID(id int) (*db.Usuario, error) {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	response, err := cs.repository.GetUserByID(conn, id)
	if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, err
	} else if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
		return nil, errors.New("usuario no encontrado")
	}

	return response, nil
}

func (cs *ComedorService) UpdateUser(id string, usuario *models.UserInput, requestInfo map[string]interface{}) error {
	conn, err := db.GetConnection()
	defer func(conn *gorm.DB) {
		err := db.CloseConnection(conn)
		if err != nil {
			fmt.Printf("error closing database connection: %v", err)
		}
	}(conn)

	// Convert id to int
	var idInt int
	if _, err := fmt.Sscanf(id, "%d", &idInt); err != nil {
		fmt.Printf("error converting id to int: %v", err)
		return errors.New("ID debe ser un número entero")
	}

	usuarioToUpdate, err := cs.repository.GetUserByID(conn, idInt)
	if err != nil && !errors.As(err, &gorm.ErrRecordNotFound) {
		return err
	} else if err != nil && errors.As(err, &gorm.ErrRecordNotFound) {
		return errors.New("usuario no encontrado")
	}

	if requestInfo["TipoUsuario"].(int) != 1 && usuarioToUpdate.IDUsuario != requestInfo["IDUsuario"].(int) {
		return errors.New("no tiene permiso para editar este usuario")
	}

	// Validate the input
	if usuario.Usuario == "" || usuario.Password == "" || usuario.Nombre == "" {
		return errors.New("es requisito completar todos los campos obligatorios")
	}

	today := time.Now()

	usuarioToUpdate.Usuario = usuario.Usuario
	usuarioToUpdate.Password = usuario.Password
	usuarioToUpdate.Nombre = &usuario.Nombre
	usuarioToUpdate.Activo = usuario.Activo
	usuarioToUpdate.IDComedor = usuario.IDComedor     //TODO: Ver si esto es necesario, o geral lo quiere
	usuarioToUpdate.TipoUsuario = usuario.TipoUsuario //TODO: Ver si esto es necesario, o geral lo quiere
	usuarioToUpdate.FechaEdicion = &today

	mapUser := map[string]interface{}{
		"usuario":            usuario.Usuario,
		"password":           usuario.Password,
		"nombre":             usuario.Nombre,
		"activo":             usuario.Activo,
		"id_comedor":         usuario.IDComedor,   //TODO: Ver si esto es necesario, o geral lo quiere
		"tipo_usuario":       usuario.TipoUsuario, //TODO: Ver si esto es necesario, o geral lo quiere
		"fecha_edicion":      &today,
		"id_usuario_edicion": requestInfo["IDUsuario"].(int),
	}

	err = cs.repository.UpdateUser(conn, mapUser, idInt)
	if err != nil {
		return err
	}

	return nil
}
