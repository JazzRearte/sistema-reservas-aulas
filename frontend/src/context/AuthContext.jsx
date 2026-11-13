
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import keycloak from "../config/keycloak";

const AuthContext = createContext(null);

const API_URL = "http://localhost:3001/api";

// Evita inicializar Keycloak dos veces con React StrictMode.
let inicializacionPromise = null;

// Evita repetir la sincronización del mismo usuario
// mientras una solicitud sigue en curso.
let sincronizacionEnCurso = null;

function inicializarKeycloak() {
  if (!inicializacionPromise) {
    inicializacionPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  }

  return inicializacionPromise;
}

function obtenerUsuario() {
  if (!keycloak.authenticated) {
    return null;
  }

  const rolesRealm = keycloak.realmAccess?.roles || [];

  const rolesCliente =
    keycloak.resourceAccess?.frontend?.roles || [];

  const roles = [...rolesRealm, ...rolesCliente];

  return {
    id: keycloak.subject,
    nombre:
      keycloak.tokenParsed?.name ||
      keycloak.tokenParsed?.preferred_username ||
      "Usuario",
    email: keycloak.tokenParsed?.email || "",
    rol: roles.includes("admin") ? "admin" : "usuario",
  };
}

// Envía el JWT al backend para validar la sesión
// y guardar el usuario en usuarios.json.
async function sincronizarUsuarioConBackend() {
  if (!keycloak.authenticated) {
    return null;
  }

  if (sincronizacionEnCurso) {
    return sincronizacionEnCurso;
  }

  const solicitud = (async () => {
    await keycloak.updateToken(30);

    const token = keycloak.token;

    if (!token) {
      throw new Error(
        "Keycloak no proporcionó un token de acceso"
      );
    }

    const respuesta = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
          "No se pudo validar la sesión en el backend"
      );
    }

    return datos.usuario;
  })();

  sincronizacionEnCurso = solicitud;

  try {
    return await solicitud;
  } finally {
    if (sincronizacionEnCurso === solicitud) {
      sincronizacionEnCurso = null;
    }
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorAutenticacion, setErrorAutenticacion] =
    useState(null);

  useEffect(() => {
    let activo = true;

    async function cargarSesion() {
      try {
        await inicializarKeycloak();

        if (!activo) {
          return;
        }

        if (keycloak.authenticated) {
          const usuarioBackend =
            await sincronizarUsuarioConBackend();

          if (activo) {
            setUsuario(usuarioBackend);
            setErrorAutenticacion(null);
          }
        } else {
          setUsuario(null);
          setErrorAutenticacion(null);
        }
      } catch (error) {
        console.error(
          "Error al inicializar o sincronizar la sesión:",
          error
        );

        if (activo) {
          setUsuario(null);
          setErrorAutenticacion(error.message);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarSesion();

    return () => {
      activo = false;
    };
  }, []);

  // Iniciar sesión mediante Keycloak.
  function iniciarSesion() {
    return keycloak.login({
      redirectUri: window.location.origin,
    });
  }

  // Registrar una nueva cuenta mediante Keycloak.
  function registrarse() {
    return keycloak.register({
      redirectUri: window.location.origin,
    });
  }

  // Cerrar sesión mediante Keycloak.
  function cerrarSesion() {
    setUsuario(null);

    return keycloak.logout({
      redirectUri: window.location.origin,
    });
  }

  // Obtener y renovar el token de acceso.
  async function obtenerToken() {
    if (!keycloak.authenticated) {
      return null;
    }

    try {
      await keycloak.updateToken(30);
      return keycloak.token;
    } catch (error) {
      console.error(
        "No se pudo renovar el token:",
        error
      );

      setUsuario(null);
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        autenticado: Boolean(usuario),
        errorAutenticacion,
        iniciarSesion,
        registrarse,
        cerrarSesion,
        obtenerToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

