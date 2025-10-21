package routes

import (
	"ComedorAbm-Geral/controllers"
	"github.com/gorilla/mux"
	"net/http"
)

func Router() *mux.Router {
	comedorController := controllers.NewComedorController()
	RRHHType := 1

	r := mux.NewRouter()
	const version1 = "/api/1/comedor"

	//CollabType := 1
	//TODO: Usar el middleware JWT

	r.HandleFunc(version1+"/user/login", comedorController.LoginUser).Methods("POST")
	//r.HandleFunc("/tea/messages", hebrasController.WsHandler)
	r.Handle(version1+"/user", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.CreateUser))).Methods("POST")
	r.Handle(version1+"/user/{id}", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.UpdateUser))).Methods("PUT")
	r.Handle(version1+"/users", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.GetUsers))).Methods("GET")
	r.Handle(version1+"/user/{id}", RequireUserType(nil, http.HandlerFunc(comedorController.GetUserByID))).Methods("GET")

	r.Handle(version1+"/empleado/{id}", RequireUserType(nil, http.HandlerFunc(comedorController.GetEmpleado))).
		Methods("GET")
	r.Handle(version1+"/empleado/{id}", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.UpdateEmpleado))).
		Methods("PUT")

	r.Handle(version1+"/empleado/create", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.CreateEmpleado))).Methods("POST")
	r.Handle(version1+"/empleados", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.GetEmpleados))).Methods("GET")

	//Consumos
	r.Handle(version1+"/consumo", RequireUserType(nil, http.HandlerFunc(comedorController.CreateConsumo))).Methods("POST")
	r.Handle(version1+"/consumos", RequireUserType(nil, http.HandlerFunc(comedorController.GetConsumos))).Methods("GET")
	r.Handle(version1+"/consumo/{id}", RequireUserType(nil, http.HandlerFunc(comedorController.GetConsumoByID))).Methods("GET")
	r.Handle(version1+"/consumo/{id}", RequireUserType(nil, http.HandlerFunc(comedorController.UpdateConsumo))).Methods("PUT")

	r.Handle(version1+"/permisosComedor", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.GetPermisosComedor))).Methods("GET")
	r.Handle(version1+"/permisoComedor/{id}", RequireUserType(nil, http.HandlerFunc(comedorController.GetPermisoComedorByID))).Methods("GET")
	//r.Handle(version1+"/permisoComedor/create", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.CreatePermisoComedor))).Methods("POST")

	//r.Handle(version1+"/comedoresDis"
	//TODO: ABM DE Comedores

	r.Handle(version1+"/comedores", RequireUserType(nil, http.HandlerFunc(comedorController.GetComedores))).Methods("GET")
	r.Handle(version1+"/comedor/{id}", RequireUserType(nil, http.HandlerFunc(comedorController.GetComedorByID))).Methods("GET")
	r.Handle(version1+"/consumos/export", RequireUserType(nil, http.HandlerFunc(comedorController.ExportarConsumos))).Methods("GET")
	r.Handle(version1+"/comedor/create", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.CreateComedor))).Methods("POST")
	r.Handle(version1+"/comedor/{id}", RequireUserType(&RRHHType, http.HandlerFunc(comedorController.UpdateComedor))).Methods("PUT")

	return r
}
