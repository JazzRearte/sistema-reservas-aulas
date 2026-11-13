
jest.mock("../services/db", () => ({
  leerJSON: jest.fn(),
  escribirJSON: jest.fn(),
}));

const { leerJSON, escribirJSON } = require("../services/db");

const {
  sincronizarUsuario,
} = require("../services/usuarios.service");

describe("Servicio de usuarios", () => {
  let usuarios;

  beforeEach(() => {
    jest.clearAllMocks();

    usuarios = [];

    leerJSON.mockImplementation(() => usuarios);

    escribirJSON.mockImplementation((archivo, datos) => {
      usuarios = structuredClone(datos);
    });
  });

  test("registra un usuario nuevo", () => {
    const resultado = sincronizarUsuario({
      id: "usuario-001",
      nombre: "María López",
      email: "maria@test.com",
      rol: "usuario",
    });

    expect(resultado.id).toBe("usuario-001");
    expect(resultado.nombre).toBe("María López");
    expect(resultado.rol).toBe("usuario");
    expect(resultado.activo).toBe(true);
    expect(resultado.passwordHash).toBeNull();

    expect(usuarios).toHaveLength(1);

    expect(escribirJSON).toHaveBeenCalledWith(
      "usuarios.json",
      expect.any(Array)
    );
  });

  test("no duplica usuarios existentes", () => {
    const datos = {
      id: "usuario-001",
      nombre: "María López",
      email: "maria@test.com",
      rol: "usuario",
    };

    sincronizarUsuario(datos);
    sincronizarUsuario(datos);

    expect(usuarios).toHaveLength(1);
  });

  test("actualiza el nombre y correo de un usuario", () => {
    sincronizarUsuario({
      id: "usuario-001",
      nombre: "María",
      email: "anterior@test.com",
      rol: "usuario",
    });

    const resultado = sincronizarUsuario({
      id: "usuario-001",
      nombre: "María López",
      email: "nuevo@test.com",
      rol: "usuario",
    });

    expect(resultado.nombre).toBe("María López");
    expect(resultado.email).toBe("nuevo@test.com");
    expect(usuarios).toHaveLength(1);
  });

  test("actualiza el rol según Keycloak", () => {
    sincronizarUsuario({
      id: "usuario-001",
      nombre: "Administrador",
      email: "admin@test.com",
      rol: "usuario",
    });

    const resultado = sincronizarUsuario({
      id: "usuario-001",
      nombre: "Administrador",
      email: "admin@test.com",
      rol: "admin",
    });

    expect(resultado.rol).toBe("admin");
    expect(usuarios).toHaveLength(1);
  });

  test("no reactiva usuarios desactivados", () => {
    usuarios = [
      {
        id: "usuario-001",
        nombre: "Usuario Desactivado",
        email: "inactivo@test.com",
        passwordHash: null,
        rol: "usuario",
        activo: false,
      },
    ];

    expect(() =>
      sincronizarUsuario({
        id: "usuario-001",
        nombre: "Usuario Desactivado",
        email: "inactivo@test.com",
        rol: "usuario",
      })
    ).toThrow("El usuario se encuentra desactivado");

    expect(usuarios[0].activo).toBe(false);
    expect(escribirJSON).not.toHaveBeenCalled();
  });

  test("rechaza usuarios sin ID", () => {
    expect(() =>
      sincronizarUsuario({
        nombre: "Usuario sin ID",
        email: "sinid@test.com",
        rol: "usuario",
      })
    ).toThrow("No se puede sincronizar un usuario sin ID");

    expect(escribirJSON).not.toHaveBeenCalled();
  });
});
