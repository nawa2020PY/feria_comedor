package routes

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"os"
	"strings"
)

// Estructura para los claims personalizados del JWT
type CustomClaims struct {
	TipoUsuario int `json:"tipoUsuario"`
	jwt.RegisteredClaims
	IDUsuario int `json:"IDUsuario"`
}

//func JWTMiddleware(next http.Handler) http.Handler {
//	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
//
//		// 1. Obtener el valor del header Authorization
//		authHeader := r.Header.Get("Authorization")
//
//		// 2. Verificar que el header no esté vacío y que comience con "Bearer "
//		if authHeader == "" || len(authHeader) < 8 || authHeader[:7] != "Bearer " {
//			// Si el header no cumple, se responde con estado 401 (Unauthorized)
//			http.Error(w, "Unauthorized", http.StatusUnauthorized)
//			return
//		}
//
//		// 3. Extraer el token JWT del header (remueve el prefijo "Bearer ")
//		tokenStr := authHeader[7:]
//
//		// 4. Parsear y validar el token usando la clave secreta
//		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) { // Este callback retorna la clave usada para firmar el token
//			jwtSecret := os.Getenv("JWT_SECRET")
//			return jwtSecret, nil
//		})
//
//		// 5. Verificar si el token es inválido o hubo error al parsearlo
//		if err != nil || !token.Valid {
//			http.Error(w, "Invalid token", http.StatusUnauthorized)
//			return
//		}
//
//		// 6. Extraer los claims (datos embebidos en el token), como el userId
//		if claims, ok := token.Claims.(jwt.MapClaims); ok {
//			// Se obtiene el userId (convertido de float64 a int)
//			userID := int(claims["IDUsuario"].(float64))
//
//			// 7. Se guarda el userId en el contexto del request
//			ctx := context.WithValue(r.Context(), "IDUsuario", userID)
//			// También se puede guardar el tipo de usuario si es necesario
//			if tipoUsuario, exists := claims["TipoUsuario"]; exists {
//				ctx = context.WithValue(ctx, "TipoUsuario", int(tipoUsuario.(float64)))
//			} else {
//				ctx = context.WithValue(ctx, "TipoUsuario", 1) // Valor por defecto si no existe
//			}
//
//			// 8. Se continúa con el siguiente handler usando el nuevo contexto
//			next.ServeHTTP(w, r.WithContext(ctx))
//		} else {
//			// Si los claims no son válidos, también se responde con 401
//			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
//			return
//		}
//	})
//}

// Middleware que verifica el tipo de usuario en los claims del JWT
func RequireUserType(tipoPermitido *int, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Obtiene el header Authorization
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Token faltante", http.StatusUnauthorized)
			return
		}
		// Extrae el token JWT
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		// Parsea y valida el JWT, obteniendo los claims
		claims, err := ParseJWT(tokenString)
		if err != nil {
			http.Error(w, "Token inválido", http.StatusUnauthorized)
			return
		}

		// Obtiene el ID del usuario desde los claims
		ctx := context.WithValue(r.Context(), "IDUsuario", claims.IDUsuario)
		ctx = context.WithValue(ctx, "TipoUsuario", claims.TipoUsuario)

		// Verifica si el tipo de usuario es el permitido
		if tipoPermitido != nil && claims.TipoUsuario != *tipoPermitido {
			http.Error(w, "Permiso denegado", http.StatusForbidden)
			return
		}
		// Continúa con el siguiente handler si todo es válido
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Parsea el JWT y retorna los claims personalizados
func ParseJWT(tokenString string) (*CustomClaims, error) {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	claims := &CustomClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("token inválido")
	}
	return claims, nil
}
