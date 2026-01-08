import { useState, useEffect, useRef } from "react";

/**
 * Dropdown personalizado para seleccionar TI/TV/Relación
 * Con líneas divisorias degradadas y fórmula en input readonly
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
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Calcular posición del menú cuando se abre
  useEffect(() => {
    if (abierto && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 500; // altura máxima aproximada
      const viewportHeight = window.innerHeight;

      // Posición a la derecha del trigger
      let left = rect.right + 8;

      // Centrar verticalmente respecto al trigger
      let top = rect.top + (rect.height / 2) - (menuHeight / 2);

      // Ajustar si se sale por arriba
      if (top < 10) top = 10;

      // Ajustar si se sale por abajo
      if (top + menuHeight > viewportHeight - 10) {
        top = viewportHeight - menuHeight - 10;
      }

      // Si no cabe a la derecha, ponerlo a la izquierda
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
          {/* Opción: Sin TI/TV */}
          <div
            className={`dropdown-transformador-opcion ${!value ? "seleccionado" : ""}`}
            onClick={() => handleSeleccionar("")}
          >
            <span className="dropdown-transformador-nombre">Sin TI / TV</span>
          </div>

          {/* Línea divisoria después de Sin TI/TV si hay TIs */}
          {tis.length > 0 && <div className="dropdown-transformador-divider" />}

          {/* TIs */}
          {tis.map((t) => (
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

          {/* Línea divisoria entre TIs y TVs */}
          {tis.length > 0 && tvs.length > 0 && <div className="dropdown-transformador-divider" />}

          {/* TVs */}
          {tvs.map((t) => (
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

          {/* Línea divisoria entre TVs y Relaciones */}
          {(tis.length > 0 || tvs.length > 0) && relaciones.length > 0 && <div className="dropdown-transformador-divider" />}

          {/* Relaciones */}
          {relaciones.map((t) => (
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

          {/* Mensaje si no hay transformadores */}
          {tis.length === 0 && tvs.length === 0 && relaciones.length === 0 && (
            <div className="dropdown-transformador-vacio">
              No hay TI/TV/Relaciones configurados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownTransformador;
