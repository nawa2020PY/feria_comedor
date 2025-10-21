package controllers

import (
	"ComedorAbm-Geral/db"
	"ComedorAbm-Geral/models"
	"ComedorAbm-Geral/services"
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

type ComedorController struct {
	service *services.ComedorService
}

func NewComedorController() *ComedorController {
	return &ComedorController{
		service: services.NewComedorService(),
	}
}

func (c *ComedorController) CreateUser(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var user models.UserInput
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create the user in the database
	if _, err := c.service.CreateUsuario(&user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(user)
	if err != nil {
		return
	}
	return
}

func (c *ComedorController) LoginUser(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var user models.UserInputLogin
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	var loginResponse models.LoginResponse
	var usuario *db.Usuario
	var err error

	// Create the user in the database
	if usuario, err = c.service.LoginUsuario(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if usuario != nil {
		jwt, err := services.GenerateJWT(*usuario)
		if err != nil {
			http.Error(w, "Error generating JWT: "+err.Error(), http.StatusInternalServerError)
			return
		}
		loginResponse.JWT = jwt
	}
	loginResponse.Usuario = usuario

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(loginResponse); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (c *ComedorController) CreateEmpleado(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var empleado models.EmpleadoInput
	if err := json.NewDecoder(r.Body).Decode(&empleado); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create the user in the database
	if _, err := c.service.CreateEmpleado(&empleado); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(empleado)
	if err != nil {
		return
	}
	return

}

func (c *ComedorController) UpdateEmpleado(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Parse the request body
	var empleado models.EmpleadoInput
	if err := json.NewDecoder(r.Body).Decode(&empleado); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create the user in the database
	if err := c.service.UpdateEmpleado(id, &empleado); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(empleado)
	if err != nil {
		return
	}
	return
}

func (c *ComedorController) GetEmpleado(w http.ResponseWriter, r *http.Request) {
	//obtengo el id del parametro de ruta
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	byDNI := r.URL.Query().Get("byDNI")

	empleado, err := c.service.GetEmpleado(id, byDNI)
	if err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(empleado)
	if err != nil {
		return
	}
	return
}

func (c *ComedorController) GetEmpleados(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()

	empleados, err := c.service.GetEmpleados(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(empleados)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

}

func (c *ComedorController) CreateConsumo(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var consumo models.ConsumoInput
	if err := json.NewDecoder(r.Body).Decode(&consumo); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userInfo := map[string]interface{}{
		"IDUsuario":   r.Context().Value("IDUsuario"),
		"TipoUsuario": r.Context().Value("TipoUsuario"),
	}

	log.Printf("Create Consumo: user info: %v", userInfo)

	if _, err := c.service.CreateConsumo(&consumo, userInfo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(consumo)
	if err != nil {
		return
	}
	return
}

func (c *ComedorController) GetConsumos(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()

	userInfo := map[string]interface{}{
		"IDUsuario":   r.Context().Value("IDUsuario"),
		"TipoUsuario": r.Context().Value("TipoUsuario"),
	}

	consumos, err := c.service.GetConsumos(params, userInfo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(consumos)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func (c *ComedorController) GetPermisosComedor(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()

	permisos, err := c.service.GetPermisosComedor(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(permisos)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func (c *ComedorController) UpdateConsumo(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Parse the request body
	var consumo models.ConsumoInput
	if err := json.NewDecoder(r.Body).Decode(&consumo); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userInfo := map[string]interface{}{
		"IDUsuario":   r.Context().Value("IDUsuario"),
		"TipoUsuario": r.Context().Value("TipoUsuario"),
	}

	// Create the user in the database
	if err := c.service.UpdateConsumo(id, &consumo, userInfo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(consumo)
	if err != nil {
		return
	}
	return
}

func (c *ComedorController) GetConsumoByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Convert id to int
	var idInt int
	if _, err := fmt.Sscanf(id, "%d", &idInt); err != nil {
		http.Error(w, "ID debe ser un número entero", http.StatusBadRequest)
		return
	}

	consumo, err := c.service.GetConsumoByID(idInt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(consumo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

// GetPermisoComedorByID
func (c *ComedorController) GetPermisoComedorByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Convert id to int
	var idInt int
	if _, err := fmt.Sscanf(id, "%d", &idInt); err != nil {
		http.Error(w, "ID debe ser un número entero", http.StatusBadRequest)
		return
	}

	permiso, err := c.service.GetPermisoComedorByID(idInt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(permiso)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func (c *ComedorController) GetComedores(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()

	comedores, err := c.service.GetComedores(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(comedores)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func (c *ComedorController) ExportarConsumos(w http.ResponseWriter, r *http.Request) {
	filters := r.URL.Query()

	userInfo := map[string]interface{}{
		"IDUsuario":   r.Context().Value("IDUsuario"),
		"TipoUsuario": r.Context().Value("TipoUsuario"),
	}

	// Obtener consumos desde el servicio
	consumos, err := c.service.GetConsumos(filters, userInfo) // Asegurate que c.service esté correctamente inyectado
	if err != nil {
		http.Error(w, "Error al obtener los consumos", http.StatusInternalServerError)
		return
	}

	// Generar Excel
	excelBuffer, err := services.GenerarExcelConsumos(consumos)
	if err != nil {
		http.Error(w, "Error al generar el archivo Excel", http.StatusInternalServerError)
		return
	}

	// Headers para forzar la descarga
	w.Header().Set("Content-Disposition", "attachment; filename=consumos.xlsx")
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.WriteHeader(http.StatusOK)
	w.Write(excelBuffer.Bytes())
}

func (c *ComedorController) CreateComedor(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var comedor models.ComedorInput
	if err := json.NewDecoder(r.Body).Decode(&comedor); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create the comedor in the database
	if _, err := c.service.CreateComedor(&comedor); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(comedor)
	if err != nil {
		return
	}
	return
}

func (c *ComedorController) UpdateComedor(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Parse the request body
	var comedor models.ComedorInput
	if err := json.NewDecoder(r.Body).Decode(&comedor); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Update the comedor in the database
	if err := c.service.UpdateComedor(id, &comedor); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(comedor)
	if err != nil {
		return
	}
	return
}

func (c *ComedorController) GetComedorByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Convert id to int
	var idInt int
	if _, err := fmt.Sscanf(id, "%d", &idInt); err != nil {
		http.Error(w, "ID debe ser un número entero", http.StatusBadRequest)
		return
	}

	comedor, err := c.service.GetComedorByID(idInt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(comedor)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

//func (c *ComedorController) CreatePermisoComedor(w http.ResponseWriter, r *http.Request) {
//	// Parse the request body
//	var permiso models.PermisoComedorInput
//	if err := json.NewDecoder(r.Body).Decode(&permiso); err != nil {
//		http.Error(w, err.Error(), http.StatusBadRequest)
//		return
//	}
//
//	// Create the permiso in the database
//	if _, err := c.service.CreatePermisoComedor(&permiso); err != nil {
//		http.Error(w, err.Error(), http.StatusInternalServerError)
//		return
//	}
//
//	w.WriteHeader(http.StatusCreated)
//	err := json.NewEncoder(w).Encode(permiso)
//	if err != nil {
//		return
//	}
//	return
//}

func (c *ComedorController) GetUsers(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()

	users, err := c.service.GetUsers(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(users)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func (c *ComedorController) GetUserByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Convert id to int
	var idInt int
	if _, err := fmt.Sscanf(id, "%d", &idInt); err != nil {
		http.Error(w, "ID debe ser un número entero", http.StatusBadRequest)
		return
	}

	user, err := c.service.GetUserByID(idInt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func (c *ComedorController) UpdateUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "ID es requerido", http.StatusBadRequest)
		return
	}

	// Parse the request body
	var user models.UserInput
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	requestInfo := map[string]interface{}{
		"IDUsuario":   r.Context().Value("IDUsuario"),
		"TipoUsuario": r.Context().Value("TipoUsuario"),
	}

	// Update the user in the database
	if err := c.service.UpdateUser(id, &user, requestInfo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	err := json.NewEncoder(w).Encode(user)
	if err != nil {
		return
	}
	return
}
