--
-- PostgreSQL database dump
--

-- Dumped from database version 9.2.16
-- Dumped by pg_dump version 9.5.5

-- Started on 2025-05-27 14:25:09

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2036 (class 1262 OID 768614)
-- Name: consumos_empleados_db; Type: DATABASE; Schema: -; Owner: -
--

-- CREATE DATABASE consumos_empleados_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'Spanish_Spain.1252' LC_CTYPE = 'Spanish_Spain.1252';
--
--
-- \connect consumos_empleados_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 1 (class 3079 OID 11727)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2038 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- TOC entry 201 (class 1255 OID 769005)
-- Name: after_insert_comedor_cargar_permiso(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION after_insert_comedor_cargar_permiso() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_id_permiso    integer;
    REG               record;

BEGIN
    FOR REG IN SELECT id_permiso,
                      nombre,
                      telefono,
                      contacto,
                      activo
               FROM permiso_comedores
               ORDER BY id_comedor
        LOOP
            BEGIN
                INSERT INTO detalle_permiso_comedores (id_permiso,id_comedor,nombre_comedor,activo)
                VALUES (REG.id_permiso,new.id_comedor,new.nombre,False);
            EXCEPTION
                when others then
                    raise exception 'Error al insertar detalle comedores: (%)', var_id_permiso;
            END;
        END LOOP;

    RETURN NEW;
END;$$;


--
-- TOC entry 198 (class 1255 OID 768985)
-- Name: after_insert_permiso_cargar_detalle(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION after_insert_permiso_cargar_detalle() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_id_permiso    integer;
    REG               record;

BEGIN
    var_id_permiso := new.id_permiso;
    FOR REG IN SELECT id_comedor,
                      nombre,
                      telefono,
                      contacto,
                      activo
               FROM comedores
               WHERE activo = True
               ORDER BY id_comedor
        LOOP
            BEGIN
                INSERT INTO detalle_permiso_comedores (id_permiso,id_comedor,nombre_comedor,activo)
                VALUES (var_id_permiso,REG.id_comedor,REG.nombre,False);
            EXCEPTION
                when others then
                    raise exception 'Error al insertar detalle comedores: (%)', var_id_permiso;
            END;
        END LOOP;

    RETURN NEW;
END;$$;


--
-- TOC entry 203 (class 1255 OID 769007)
-- Name: after_update_comedor_cargar_permiso(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION after_update_comedor_cargar_permiso() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_id_permiso    integer;

BEGIN
    IF (NEW.nombre <> OLD.nombre) THEN
        BEGIN
            update detalle_permiso_comedores set nombre_comedor = NEW.nombre where id_comedor = NEW.id_comedor;
        EXCEPTION
            when others then
                raise exception 'Error al actualizar detalle permisos: (%)', var_id_permiso;
        END;
    END IF;
    IF (OLD.activo = True) AND (NEW.activo = False) THEN
        BEGIN
            update detalle_permiso_comedores set activo = False where id_comedor = NEW.id_comedor;
        EXCEPTION
            when others then
                raise exception 'Error al actualizar detalle permisos: (%)', var_id_permiso;
        END;
    END IF;

    RETURN NEW;
END;$$;


--
-- TOC entry 197 (class 1255 OID 768992)
-- Name: before_insert_id_comedor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_insert_id_comedor() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;


BEGIN
    SELECT nextval('comedores_id_comedor_seq') as numero
    INTO var_auxiliar;

    -- Incrementa el nro_orden
    IF var_auxiliar IS NULL THEN
        var_auxiliar := 0;
    END IF;
    new.id_comedor := var_auxiliar;

    RETURN NEW;
END;$$;


--
-- TOC entry 204 (class 1255 OID 769003)
-- Name: before_insert_id_consumo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_insert_id_consumo() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;
    var_empleado varchar(150);
    var_id_empleado int4;
    var_comedor varchar(150);


BEGIN
    SELECT nextval('consumos_id_consumo_seq') as numero
    INTO var_auxiliar;

    -- Incrementa el nro_orden
    IF var_auxiliar IS NULL THEN
        var_auxiliar := 0;
    END IF;
    new.id_consumo := var_auxiliar;
    select nombre from comedores where id_comedor = new.id_comedor
    into var_comedor;
    new.nombre_comedor := var_comedor;
    new.fecha_transaccion := CURRENT_TIMESTAMP;
    select id_empleado, nombre from empleados where nro_documento = new.nro_documento
    into var_id_empleado, var_empleado;
    new.nombre_empleado := var_empleado;
    new.id_empleado := var_id_empleado;
    new.id_usuario_creacion = new.id_usuario;


    RETURN NEW;
END;$$;


--
-- TOC entry 202 (class 1255 OID 768994)
-- Name: before_insert_id_empleado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_insert_id_empleado() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;
    var_sucursal varchar(150);

BEGIN
    SELECT nextval('empleados_id_empleado_seq') as numero
    INTO var_auxiliar;

    -- Incrementa el nro_orden
    IF var_auxiliar IS NULL THEN
        var_auxiliar := 0;
    END IF;
    new.id_empleado := var_auxiliar;
    select nombre from sucursales where id_sucursal = new.id_sucursal
    into var_sucursal;
    new.nombre_sucursal := var_sucursal;

    RETURN NEW;
END;$$;


--
-- TOC entry 195 (class 1255 OID 769001)
-- Name: before_insert_id_permiso(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_insert_id_permiso() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;


BEGIN
    SELECT nextval('permiso_comedores_id_permiso_seq') as numero
    INTO var_auxiliar;

    -- Incrementa el nro_orden
    IF var_auxiliar IS NULL THEN
        var_auxiliar := 0;
    END IF;
    new.id_permiso := var_auxiliar;

    RETURN NEW;
END;$$;


--
-- TOC entry 196 (class 1255 OID 768999)
-- Name: before_insert_id_sucursal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_insert_id_sucursal() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;


BEGIN
    SELECT nextval('sucursales_id_sucursal_seq') as numero
    INTO var_auxiliar;

    -- Incrementa el nro_orden
    IF var_auxiliar IS NULL THEN
        var_auxiliar := 0;
    END IF;
    new.id_sucursal := var_auxiliar;

    RETURN NEW;
END;$$;


--
-- TOC entry 200 (class 1255 OID 768997)
-- Name: before_insert_id_usuario(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_insert_id_usuario() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;


BEGIN
    SELECT nextval('usuarios_id_usuario_seq') as numero
    INTO var_auxiliar;

    -- Incrementa el nro_orden
    IF var_auxiliar IS NULL THEN
        var_auxiliar := 0;
    END IF;
    new.id_usuario := var_auxiliar;

    RETURN NEW;
END;$$;


--
-- TOC entry 205 (class 1255 OID 769016)
-- Name: before_update_consumos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_update_consumos() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;
    var_empleado varchar(150);
    var_id_empleado int4;
    var_comedor varchar(150);
    var_fecha varchar(150);


BEGIN
    new.fecha_edicion := CURRENT_TIMESTAMP;
    new.id_usuario_edicion := new.id_usuario;
    SELECT TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') as fecha
    into var_fecha;
    new.observaciones := new.observaciones || chr(13) || 'Usuario:' || TO_CHAR(new.id_usuario, '9999999999999') || 'Fecha:'||var_fecha||' Cambios: ';
    if (new.anulado = True) and (old.anulado = False) then --Se esta anulando
        new.fecha_anulacion := CURRENT_TIMESTAMP;
        new.id_usuario_anulacion := new.id_usuario;
        new.observaciones := new.observaciones || chr(13) || var_fecha || '=';
    end if;
    if (new.anulado = False) and (old.anulado = True) then --Se esta anulando
        new.fecha_anulacion := CURRENT_TIMESTAMP;
        new.id_usuario_anulacion := new.id_usuario;
        new.observaciones := new.observaciones || 'Reversion Anulacion de registro';
    end if;

    if new.nro_documento <> old.nro_documento then
        select id_empleado, nombre from empleados where nro_documento = new.nro_documento
        into var_id_empleado, var_empleado;
        new.nombre_empleado := var_empleado;
        new.id_empleado := var_id_empleado;
        new.observaciones := new.observaciones ||'nro_documento:'||old.nro_documento||'->'||new.nro_documento||';';
    end if;
    if new.id_comedor <> old.id_comedor then
        select nombre from comedores where id_comedor = new.id_comedor
        into var_comedor;
        new.nombre_comedor := var_comedor;
        new.observaciones := new.observaciones ||'comedor:'||old.nombre_comedor||'->'||new.nombre_comedor||';';
    end if;
    --RAISE EXCEPTION 'El valor es % ', new.observaciones;
    RETURN NEW;
END;$$;


--
-- TOC entry 199 (class 1255 OID 769010)
-- Name: before_update_empleados(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION before_update_empleados() RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    var_auxiliar int4;
    var_sucursal varchar(150);

BEGIN
    IF new.id_sucursal <> old.id_sucursal THEN
        select nombre from sucursales where id_sucursal = new.id_sucursal
        into var_sucursal;
        new.nombre_sucursal := var_sucursal;
    END IF;
    RETURN NEW;
END;$$;


--
-- TOC entry 169 (class 1259 OID 768864)
-- Name: comedores_id_comedor_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE comedores_id_comedor_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2039 (class 0 OID 0)
-- Dependencies: 169
-- Name: SEQUENCE comedores_id_comedor_seq; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE comedores_id_comedor_seq IS 'DbWrench Autogenerated Sequence.';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 174 (class 1259 OID 768874)
-- Name: comedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE comedores (
                           id_comedor integer DEFAULT nextval('comedores_id_comedor_seq'::regclass) NOT NULL,
                           nombre character varying(150) NOT NULL,
                           telefono character varying(15),
                           contacto character varying(150),
                           activo boolean DEFAULT true
);


--
-- TOC entry 175 (class 1259 OID 768881)
-- Name: consumos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE consumos (
                          id_consumo integer NOT NULL,
                          id_usuario_creacion integer,
                          fecha_edicion timestamp with time zone,
                          id_usuario_edicion integer,
                          anulado boolean DEFAULT false,
                          id_usuario_anulacion integer,
                          fecha_anulacion timestamp with time zone,
                          fecha_transaccion date DEFAULT ('now'::text)::timestamp without time zone,
                          id_empleado integer,
                          id_comedor integer,
                          monto numeric(10,0) DEFAULT 0,
                          nombre_empleado character varying(150),
                          nombre_comedor character varying(150),
                          id_usuario integer,
                          observaciones text,
                          nro_documento character varying(20),
                          hora_transaccion time with time zone DEFAULT ('now'::text)::time with time zone,
                          tipo_consumo integer DEFAULT 1
);


--
-- TOC entry 170 (class 1259 OID 768866)
-- Name: consumos_id_consumo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consumos_id_consumo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2040 (class 0 OID 0)
-- Dependencies: 170
-- Name: SEQUENCE consumos_id_consumo_seq; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE consumos_id_consumo_seq IS 'DbWrench Autogenerated Sequence.';


--
-- TOC entry 181 (class 1259 OID 768953)
-- Name: detalle_permiso_comedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE detalle_permiso_comedores (
                                           id_permiso integer NOT NULL,
                                           id_comedor integer NOT NULL,
                                           nombre_comedor character varying(150),
                                           activo boolean DEFAULT false
);


--
-- TOC entry 176 (class 1259 OID 768889)
-- Name: empleados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE empleados (
                           id_empleado integer NOT NULL,
                           nro_documento character varying(20) NOT NULL,
                           nombre character varying(150) NOT NULL,
                           activo boolean DEFAULT true,
                           id_sucursal integer,
                           pin_autorizacion character varying(4),
                           id_permiso integer,
                           nombre_sucursal character varying(150)
);


--
-- TOC entry 177 (class 1259 OID 768897)
-- Name: empleados_comedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE empleados_comedores (
                                     id_empleado integer NOT NULL,
                                     id_comedor integer NOT NULL,
                                     nombre_comedor character varying(150),
                                     activo boolean DEFAULT true
);


--
-- TOC entry 171 (class 1259 OID 768868)
-- Name: empleados_id_empleado_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE empleados_id_empleado_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2041 (class 0 OID 0)
-- Dependencies: 171
-- Name: SEQUENCE empleados_id_empleado_seq; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE empleados_id_empleado_seq IS 'DbWrench Autogenerated Sequence.';


--
-- TOC entry 182 (class 1259 OID 768959)
-- Name: permiso_comedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE permiso_comedores (
                                   id_permiso integer NOT NULL,
                                   nombre character varying(150) NOT NULL,
                                   activo boolean DEFAULT true
);


--
-- TOC entry 180 (class 1259 OID 768951)
-- Name: permiso_comedores_id_permiso_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE permiso_comedores_id_permiso_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2042 (class 0 OID 0)
-- Dependencies: 180
-- Name: SEQUENCE permiso_comedores_id_permiso_seq; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE permiso_comedores_id_permiso_seq IS 'DbWrench Autogenerated Sequence.';


--
-- TOC entry 178 (class 1259 OID 768904)
-- Name: sucursales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE sucursales (
                            id_sucursal integer NOT NULL,
                            nombre character varying(150) NOT NULL,
                            activo boolean DEFAULT true
);


--
-- TOC entry 172 (class 1259 OID 768870)
-- Name: sucursales_id_sucursal_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE sucursales_id_sucursal_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2043 (class 0 OID 0)
-- Dependencies: 172
-- Name: SEQUENCE sucursales_id_sucursal_seq; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE sucursales_id_sucursal_seq IS 'DbWrench Autogenerated Sequence.';


--
-- TOC entry 179 (class 1259 OID 768911)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE usuarios (
                          id_usuario integer NOT NULL,
                          usuario character varying(20) NOT NULL,
                          password character varying(20) NOT NULL,
                          nombre character varying(150),
                          id_comedor integer NOT NULL,
                          fecha_creacion timestamp with time zone DEFAULT ('now'::text)::timestamp without time zone,
                          activo boolean DEFAULT true,
                          fecha_edicion timestamp with time zone,
                          id_usuario_edicion integer,
                          tipo_usuario integer DEFAULT 1,
                          nombre_comedor character varying(150),
                          nombre_tipo character varying(50)
);


--
-- TOC entry 2044 (class 0 OID 0)
-- Dependencies: 179
-- Name: COLUMN usuarios.tipo_usuario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN usuarios.tipo_usuario IS '1=Comedores y 2=Feria';


--
-- TOC entry 173 (class 1259 OID 768872)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE usuarios_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2045 (class 0 OID 0)
-- Dependencies: 173
-- Name: SEQUENCE usuarios_id_usuario_seq; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE usuarios_id_usuario_seq IS 'DbWrench Autogenerated Sequence.';


--
-- TOC entry 2023 (class 0 OID 768874)
-- Dependencies: 174
-- Data for Name: comedores; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO comedores (id_comedor, nombre, telefono, contacto, activo) VALUES (1, 'DOÑA CHIPA SAN MARTIN', '021569852', 'JAVIER RUIZ', true);
INSERT INTO comedores (id_comedor, nombre, telefono, contacto, activo) VALUES (2, 'EL RINCON DE LOS LIBROS', '0985632587', 'LUIS LOPWZ', true);
INSERT INTO comedores (id_comedor, nombre, telefono, contacto, activo) VALUES (3, 'LA COMILONA', '0985236646', 'JORGE LEE', true);


--
-- TOC entry 2046 (class 0 OID 0)
-- Dependencies: 169
-- Name: comedores_id_comedor_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('comedores_id_comedor_seq', 3, true);


--
-- TOC entry 2024 (class 0 OID 768881)
-- Dependencies: 175
-- Data for Name: consumos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO consumos (id_consumo, id_usuario_creacion, fecha_edicion, id_usuario_edicion, anulado, id_usuario_anulacion, fecha_anulacion, fecha_transaccion, id_empleado, id_comedor, monto, nombre_empleado, nombre_comedor, id_usuario, observaciones, nro_documento, hora_transaccion) VALUES (4, 1, '2025-05-23 15:20:52.619-04', 1, false, NULL, NULL, '2025-05-23', 1, 1, 5000, 'NORMA LILIANA RETAMAR DE GONZALEZ', 'DOÑA CHIPA SAN MARTIN', 1, 'lkjlkjlkj
Usuario:             1Fecha:2025-05-23 15:15:02 Cambios:
Usuario:             1Fecha:2025-05-23 15:20:52 Cambios: ', '3966801', NULL);


--
-- TOC entry 2047 (class 0 OID 0)
-- Dependencies: 170
-- Name: consumos_id_consumo_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consumos_id_consumo_seq', 4, true);


--
-- TOC entry 2030 (class 0 OID 768953)
-- Dependencies: 181
-- Data for Name: detalle_permiso_comedores; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (1, 1, 'DOÑA CHIPA SAN MARTIN', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (1, 2, 'EL RINCON DE LOS LIBROS', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (2, 1, 'DOÑA CHIPA SAN MARTIN', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (2, 2, 'EL RINCON DE LOS LIBROS', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (3, 1, 'DOÑA CHIPA SAN MARTIN', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (3, 2, 'EL RINCON DE LOS LIBROS', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (3, 3, 'LA COMILONA', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (4, 2, 'EL RINCON DE LOS LIBROS', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (4, 3, 'LA COMILONA', false);
INSERT INTO detalle_permiso_comedores (id_permiso, id_comedor, nombre_comedor, activo) VALUES (4, 1, 'DOÑA CHIPA SAN MARTIN', true);


--
-- TOC entry 2025 (class 0 OID 768889)
-- Dependencies: 176
-- Data for Name: empleados; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO empleados (id_empleado, nro_documento, nombre, activo, id_sucursal, pin_autorizacion, id_permiso, nombre_sucursal) VALUES (1, '3966801', 'NORMA LILIANA RETAMAR DE GONZALEZ', true, 6, '5316', 4, '600 - Oficina Administración Central ');


--
-- TOC entry 2026 (class 0 OID 768897)
-- Dependencies: 177
-- Data for Name: empleados_comedores; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 2048 (class 0 OID 0)
-- Dependencies: 171
-- Name: empleados_id_empleado_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('empleados_id_empleado_seq', 1, true);


--
-- TOC entry 2031 (class 0 OID 768959)
-- Dependencies: 182
-- Data for Name: permiso_comedores; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO permiso_comedores (id_permiso, nombre, activo) VALUES (1, 'EMPLEADOS DE CDE ', true);
INSERT INTO permiso_comedores (id_permiso, nombre, activo) VALUES (2, 'EMPLEADOS DE PINEDO', true);
INSERT INTO permiso_comedores (id_permiso, nombre, activo) VALUES (3, 'EMPLEADOS HERRERA', true);
INSERT INTO permiso_comedores (id_permiso, nombre, activo) VALUES (4, 'EMPLEADOS ADMINISTRACION', true);


--
-- TOC entry 2049 (class 0 OID 0)
-- Dependencies: 180
-- Name: permiso_comedores_id_permiso_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('permiso_comedores_id_permiso_seq', 4, true);


--
-- TOC entry 2027 (class 0 OID 768904)
-- Dependencies: 178
-- Data for Name: sucursales; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO sucursales (id_sucursal, nombre, activo) VALUES (1, '100 - Tienda San Marin', true);
INSERT INTO sucursales (id_sucursal, nombre, activo) VALUES (7, '800 - Tienda CDE', true);
INSERT INTO sucursales (id_sucursal, nombre, activo) VALUES (6, '600 - Oficina Administración Central ', true);
INSERT INTO sucursales (id_sucursal, nombre, activo) VALUES (5, '500 - Centro de Distribucion MRA', true);
INSERT INTO sucursales (id_sucursal, nombre, activo) VALUES (4, '400 - Tienda Herrera', true);
INSERT INTO sucursales (id_sucursal, nombre, activo) VALUES (3, '300 - Tienda Azara', true);
INSERT INTO sucursales (id_sucursal, nombre, activo) VALUES (2, '200 - Tienda Pinedo', true);


--
-- TOC entry 2050 (class 0 OID 0)
-- Dependencies: 172
-- Name: sucursales_id_sucursal_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('sucursales_id_sucursal_seq', 7, true);


--
-- TOC entry 2028 (class 0 OID 768911)
-- Dependencies: 179
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO usuarios (id_usuario, usuario, password, nombre, id_comedor, fecha_creacion, activo, fecha_edicion, id_usuario_edicion, tipo_usuario, nombre_comedor, nombre_tipo) VALUES (1, 'gmendoza', '1234', 'GERALDO MENDOZA', 1, NULL, true, NULL, NULL, 2, NULL, NULL);


--
-- TOC entry 2051 (class 0 OID 0)
-- Dependencies: 173
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('usuarios_id_usuario_seq', 1, false);


--
-- TOC entry 1875 (class 2606 OID 768880)
-- Name: pkcomedores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY comedores
    ADD CONSTRAINT pkcomedores PRIMARY KEY (id_comedor);


--
-- TOC entry 1877 (class 2606 OID 768888)
-- Name: pkconsumos; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consumos
    ADD CONSTRAINT pkconsumos PRIMARY KEY (id_consumo);


--
-- TOC entry 1890 (class 2606 OID 768958)
-- Name: pkdetalle_permiso_comedores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY detalle_permiso_comedores
    ADD CONSTRAINT pkdetalle_permiso_comedores PRIMARY KEY (id_permiso, id_comedor);


--
-- TOC entry 1880 (class 2606 OID 768895)
-- Name: pkempleados; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY empleados
    ADD CONSTRAINT pkempleados PRIMARY KEY (id_empleado);


--
-- TOC entry 1883 (class 2606 OID 768902)
-- Name: pkempleados_comedores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY empleados_comedores
    ADD CONSTRAINT pkempleados_comedores PRIMARY KEY (id_empleado, id_comedor);


--
-- TOC entry 1892 (class 2606 OID 768968)
-- Name: pkpermiso_comedores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY permiso_comedores
    ADD CONSTRAINT pkpermiso_comedores PRIMARY KEY (id_permiso);


--
-- TOC entry 1885 (class 2606 OID 768910)
-- Name: pksucursales; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY sucursales
    ADD CONSTRAINT pksucursales PRIMARY KEY (id_sucursal);


--
-- TOC entry 1887 (class 2606 OID 768919)
-- Name: pkusuarios; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY usuarios
    ADD CONSTRAINT pkusuarios PRIMARY KEY (id_usuario);


--
-- TOC entry 1881 (class 1259 OID 768903)
-- Name: empleados_comedores_id_empleado_id_comedor_Idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "empleados_comedores_id_empleado_id_comedor_Idx" ON empleados_comedores USING btree (id_empleado, id_comedor);


--
-- TOC entry 1878 (class 1259 OID 768896)
-- Name: employee_nro_documento_Idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employee_nro_documento_Idx" ON empleados USING btree (nro_documento);


--
-- TOC entry 1888 (class 1259 OID 768920)
-- Name: usuarios_usuario_id_comedor_Idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "usuarios_usuario_id_comedor_Idx" ON usuarios USING btree (usuario, id_comedor);


--
-- TOC entry 1902 (class 2620 OID 769006)
-- Name: after_insert_comedor_cargar_permiso; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER after_insert_comedor_cargar_permiso AFTER INSERT ON comedores FOR EACH ROW EXECUTE PROCEDURE after_insert_comedor_cargar_permiso();


--
-- TOC entry 1910 (class 2620 OID 768986)
-- Name: after_insert_permiso_cargar_detalle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER after_insert_permiso_cargar_detalle AFTER INSERT ON permiso_comedores FOR EACH ROW EXECUTE PROCEDURE after_insert_permiso_cargar_detalle();


--
-- TOC entry 1903 (class 2620 OID 769008)
-- Name: after_update_comedor_cargar_permiso; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER after_update_comedor_cargar_permiso AFTER UPDATE ON comedores FOR EACH ROW EXECUTE PROCEDURE after_update_comedor_cargar_permiso();


--
-- TOC entry 1901 (class 2620 OID 768993)
-- Name: before_insert_id_comedor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_insert_id_comedor BEFORE INSERT ON comedores FOR EACH ROW EXECUTE PROCEDURE before_insert_id_comedor();


--
-- TOC entry 1904 (class 2620 OID 769004)
-- Name: before_insert_id_consumo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_insert_id_consumo BEFORE INSERT ON consumos FOR EACH ROW EXECUTE PROCEDURE before_insert_id_consumo();


--
-- TOC entry 1907 (class 2620 OID 768995)
-- Name: before_insert_id_empleado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_insert_id_empleado BEFORE INSERT ON empleados FOR EACH ROW EXECUTE PROCEDURE before_insert_id_empleado();


--
-- TOC entry 1911 (class 2620 OID 769002)
-- Name: before_insert_id_permiso; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_insert_id_permiso BEFORE INSERT ON permiso_comedores FOR EACH ROW EXECUTE PROCEDURE before_insert_id_permiso();


--
-- TOC entry 1908 (class 2620 OID 769000)
-- Name: before_insert_id_sucursal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_insert_id_sucursal BEFORE INSERT ON sucursales FOR EACH ROW EXECUTE PROCEDURE before_insert_id_sucursal();


--
-- TOC entry 1909 (class 2620 OID 768998)
-- Name: before_insert_id_usuario; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_insert_id_usuario BEFORE INSERT ON usuarios FOR EACH ROW EXECUTE PROCEDURE before_insert_id_usuario();


--
-- TOC entry 1905 (class 2620 OID 769017)
-- Name: before_update_consumos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_update_consumos BEFORE UPDATE ON consumos FOR EACH ROW EXECUTE PROCEDURE before_update_consumos();


--
-- TOC entry 1906 (class 2620 OID 769012)
-- Name: before_update_empleados; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_update_empleados BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE PROCEDURE before_update_empleados();


--
-- TOC entry 1893 (class 2606 OID 768921)
-- Name: fk_consumos_comedores; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consumos
    ADD CONSTRAINT fk_consumos_comedores FOREIGN KEY (id_comedor) REFERENCES comedores(id_comedor) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 1894 (class 2606 OID 768926)
-- Name: fk_consumos_empleados; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consumos
    ADD CONSTRAINT fk_consumos_empleados FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 1895 (class 2606 OID 768931)
-- Name: fk_consumos_usuarios; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consumos
    ADD CONSTRAINT fk_consumos_usuarios FOREIGN KEY (id_usuario_creacion) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 1900 (class 2606 OID 768979)
-- Name: fk_detalle_permiso_comedores_permiso_comedores; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY detalle_permiso_comedores
    ADD CONSTRAINT fk_detalle_permiso_comedores_permiso_comedores FOREIGN KEY (id_permiso) REFERENCES permiso_comedores(id_permiso) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 1898 (class 2606 OID 768941)
-- Name: fk_empleados_comedores_comedores; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY empleados_comedores
    ADD CONSTRAINT fk_empleados_comedores_comedores FOREIGN KEY (id_comedor) REFERENCES comedores(id_comedor) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 1899 (class 2606 OID 768946)
-- Name: fk_empleados_comedores_empleados; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY empleados_comedores
    ADD CONSTRAINT fk_empleados_comedores_empleados FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 1897 (class 2606 OID 768974)
-- Name: fk_empleados_permiso_comedores; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY empleados
    ADD CONSTRAINT fk_empleados_permiso_comedores FOREIGN KEY (id_permiso) REFERENCES permiso_comedores(id_permiso) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 1896 (class 2606 OID 768936)
-- Name: fk_empleados_sucursales; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY empleados
    ADD CONSTRAINT fk_empleados_sucursales FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON UPDATE RESTRICT ON DELETE RESTRICT;


-- Completed on 2025-05-27 14:25:09

--
-- PostgreSQL database dump complete
--
