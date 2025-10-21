package services

import (
	"ComedorAbm-Geral/db"
	"bytes"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/xuri/excelize/v2"
	"math/rand"
	"os"
	"time"
)

//Encargado de crear un pin aleatorio de 4 digitos:

func GenerateRandomPin() string {
	pinLength := 4
	digits := make([]byte, 0, pinLength)
	counts := make(map[byte]int)

	for len(digits) < pinLength { //ciclo while hasta que la longitud de digits sea igual a pinLength
		d := byte('0' + rand.Intn(10))
		if counts[d] < 2 {
			digits = append(digits, d)
			counts[d]++
		}
	}

	return string(digits)
}

func GenerateJWT(user db.Usuario) (string, error) {
	claims := jwt.MapClaims{
		"IDUsuario":   user.IDUsuario,
		"IDComedor":   user.IDComedor,
		"Nombre":      user.Nombre,
		"Activo":      user.Activo,
		"TipoUsuario": user.TipoUsuario,
		"Usuario":     user.Usuario,
		"exp":         time.Now().Add(time.Hour * 24).Unix(), // 1 día
	}

	jwtSecret := os.Getenv("JWT_SECRET")

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func FlexibleParsedTime(fechaStr string) (time.Time, error) {
	formatos := []string{
		"2006-01-02",                // solo fecha
		"2006-01-02T15:04:05Z07:00", // ISO 8601
		"2006-01-02T15:04:05",       // sin zona

	}

	for _, formato := range formatos {
		if t, err := time.Parse(formato, fechaStr); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("fecha debe estar en formato YYYY-MM-DD")
}

func GenerarExcelConsumos(consumos []db.Consumo) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheetName := "Consumos"
	f.SetSheetName("Sheet1", sheetName)

	// Encabezados
	//"Hora",
	headers := []string{
		"ID", "Empleado", "Comedor", "Documento", "Monto", "Fecha Transacción", "Observaciones", "Anulado", "Fecha Anulación",
	}

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	// Filas
	for i, c := range consumos {
		row := i + 2
		valores := []interface{}{
			c.IDConsumo,
			nullString(c.NombreEmpleado),
			nullString(c.NombreComedor),
			nullString(c.NroDocumento),
			c.Monto,
			c.FechaTransaccion.Format("2006-01-02"),
			//nullString(c.HoraTransaccion),
			nullString(c.Observaciones),
			c.Anulado,
			nullTime(c.FechaAnulacion),
		}

		for j, v := range valores {
			cell, _ := excelize.CoordinatesToCellName(j+1, row)
			f.SetCellValue(sheetName, cell, v)
		}
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("error escribiendo el Excel: %w", err)
	}
	return &buf, nil
}

func nullString(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func nullTime(t *time.Time) string {
	if t != nil {
		return t.Format("2006-01-02")
	}
	return ""
}
