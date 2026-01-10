import { useState, useEffect, useRef } from "react";

/**
 * Dropdown personalizado para seleccionar TI/TV/Relación
 * Con tabs para navegar entre categorías y fórmula en input readonly
 * Usa posición fixed para evitar ser cortado por el modal
 */
const DropdownTransformador = ({
  value,
  onChange,
  disabled,
  tis,
  tvs,
  relaciones = []
}) => {
  const [abierto, setAbierto] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [tabActivo, setTabActivo] = useState("ti");
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Determinar tab inicial basado en el valor seleccionado
  useEffect(() => {
    if (value) {
      if (tis.some(t => t.id === value)) {
        setTabActivo("ti");
      } else if (tvs.some(t => t.id === value)) {
        setTabActivo("tv");
      } else if (relaciones.some(t => t.id === value)) {
        setTabActivo("relaciones");
      }
    }
  }, [value, tis, tvs, relaciones]);

  // Calcular posición del menú cuando se abre
  useEffect(() => {
    if (abierto && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 400;
      const viewportHeight = window.innerHeight;

      let left = rect.right + 8;
      let top = rect.top + (rect.height / 2) - (menuHeight / 2);

      if (top < 10) top = 10;
      if (top + menuHeight > viewportHeight - 10) {
        top = viewportHeight - menuHeight - 10;
      }
      if (left + 300 > window.innerWidth) {
        left = rect.left - 308;
      }

      setMenuPos({ top, left });
    }
  }, [abierto]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera);
    }
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [abierto]);

  // Encontrar el transformador seleccionado
  const transformadorSeleccionado = value
    ? [...tis, ...tvs, ...relaciones].find(t => t.id === value)
    : null;

  const handleSeleccionar = (id) => {
    onChange(id);
    setAbierto(false);
  };

  // Obtener items del tab activo
  const getItemsTabActivo = () => {
    switch (tabActivo) {
      case "ti": return tis;
      case "tv": return tvs;
      case "relaciones": return relaciones;
      default: return [];
    }
  };

  const itemsActivos = getItemsTabActivo();

  return (
    <div
      className={`dropdown-transformador ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className="dropdown-transformador-trigger"
        onClick={() => !disabled && setAbierto(!abierto)}
        disabled={disabled}
        ref={triggerRef}
      >
        {transformadorSeleccionado ? (
          <>
            <span className="dropdown-transformador-nombre">{transformadorSeleccionado.nombre}</span>
            <input
              type="text"
              className="dropdown-transformador-formula"
              value={transformadorSeleccionado.formula}
              readOnly
              tabIndex={-1}
            />
          </>
        ) : (
          <span className="dropdown-transformador-texto">Sin TI / TV</span>
        )}
        <span className="dropdown-transformador-chevron">{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div
          className="dropdown-transformador-menu dropdown-transformador-menu--fixed"
          style={{ top: menuPos.top, left: menuPos.left }}
          ref={menuRef}
        >
          {/* Tabs de navegación */}
          <div className="dropdown-transformador-tabs">
            <button
              type="button"
              className={`dropdown-transformador-tab ${tabActivo === "ti" ? "activo" : ""}`}
              onClick={() => setTabActivo("ti")}
            >
              T.I. <span className="dropdown-transformador-tab-count">{tis.length}</span>
            </button>
            <button
              type="button"
              className={`dropdown-transformador-tab ${tabActivo === "tv" ? "activo" : ""}`}
              onClick={() => setTabActivo("tv")}
            >
              T.V. <span className="dropdown-transformador-tab-count">{tvs.length}</span>
            </button>
            <button
              type="button"
              className={`dropdown-transformador-tab ${tabActivo === "relaciones" ? "activo" : ""}`}
              onClick={() => setTabActivo("relaciones")}
            >
              Relaciones <span className="dropdown-transformador-tab-count">{relaciones.length}</span>
            </button>
          </div>

          {/* Contenido del tab */}
          <div className="dropdown-transformador-contenido">
            {/* Opción: Sin TI/TV (siempre visible) */}
            <div
              className={`dropdown-transformador-opcion ${!value ? "seleccionado" : ""}`}
              onClick={() => handleSeleccionar("")}
            >
              <span className="dropdown-transformador-nombre">Sin TI / TV</span>
            </div>

            {/* Items del tab activo */}
            {itemsActivos.map((t) => (
              <div
                key={t.id}
                className={`dropdown-transformador-opcion ${value === t.id ? "seleccionado" : ""}`}
                onClick={() => handleSeleccionar(t.id)}
              >
                <span className="dropdown-transformador-nombre">{t.nombre}</span>
                <input
                  type="text"
                  className="dropdown-transformador-formula"
                  value={t.formula}
                  readOnly
                  tabIndex={-1}
                />
              </div>
            ))}

            {/* Mensaje si no hay items en este tab */}
            {itemsActivos.length === 0 && (
              <div className="dropdown-transformador-vacio">
                No hay {tabActivo === "ti" ? "TIs" : tabActivo === "tv" ? "TVs" : "relaciones"} configurados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownTransformador;
