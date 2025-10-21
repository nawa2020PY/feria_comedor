package main

import (
	"ComedorAbm-Geral/db"
	"ComedorAbm-Geral/routes"
	"fmt"
	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"
	"log"
	"net/http"
	"os"
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("No se pudo cargar .env, se usarán variables de entorno existentes.")
	}

	fmt.Printf("DB_HOST=%q\nDB_USER=%q\nDB_PASSWORD=%q\nDB_NAME=%q\nDB_PORT=%q\n",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	r := routes.Router()

	connection, err := db.GetConnection()
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	err = db.CloseConnection(connection)
	if err != nil {
		log.Fatalf("Error closing the database connection: %v", err)
		return
	}

	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})

	originsOk := handlers.AllowedOrigins([]string{"*"})

	methodsOk := handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})

	fmt.Println("Server running on port 3005, and local 0.0.0.0:3005")
	if err := http.ListenAndServe("0.0.0.0:3005", handlers.CORS(originsOk, headersOk, methodsOk)(r)); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
