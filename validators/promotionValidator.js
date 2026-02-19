/**
 * Validadores para promociones
 * Centraliza toda la lógica de validación con mensajes descriptivos
 */

export const validators = {
  /**
   * Valida que las fechas sean válidas
   * @param {string} startDate - Fecha de inicio ISO
   * @param {string} endDate - Fecha de fin ISO (opcional)
   * @returns {string|null} Mensaje de error o null si es válido
   */
  validateDates: (startDate, endDate) => {
    if (!startDate) {
      return "La fecha de inicio es requerida";
    }

    let start, end;
    try {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return "Fecha de inicio inválida";
      }
    } catch {
      return "Fecha de inicio inválida";
    }

    if (endDate) {
      try {
        end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return "Fecha de fin inválida";
        }

        // La fecha fin debe ser después de la fecha inicio
        if (end <= start) {
          return "La fecha de fin debe ser posterior a la fecha de inicio";
        }
      } catch {
        return "Fecha de fin inválida";
      }
    }

    return null;
  },

  /**
   * Valida que el color sea un valor hexadecimal válido o "transparent"
   * @param {string} bgColor - Color en formato hex o "transparent"
   * @returns {string|null} Mensaje de error o null si es válido
   */
  validateColor: (bgColor) => {
    if (!bgColor) return null; // Opcional

    if (bgColor === "transparent") return null;

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(bgColor)) {
      return "Color debe ser hexadecimal válido (#RRGGBB) o 'transparent'";
    }

    return null;
  },

  /**
   * Valida que el estado de la promoción sea válido
   * @param {boolean} active - Estado de la promoción
   * @returns {string|null} Mensaje de error o null si es válido
   */
  validateActive: (active) => {
    if (typeof active !== "boolean" && active !== undefined) {
      return "El estado debe ser boolean (true/false)";
    }
    return null;
  },
};

/**
 * Valida un conjunto completo de datos para actualización
 * @param {Object} data - Datos a validar
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePromotionUpdate = (data) => {
  const errors = [];

  if (data.start_date || data.end_date) {
    const dateError = validators.validateDates(data.start_date, data.end_date);
    if (dateError) errors.push(dateError);
  }

  if (data.bg_color !== undefined) {
    const colorError = validators.validateColor(data.bg_color);
    if (colorError) errors.push(colorError);
  }

  if (data.active !== undefined) {
    const activeError = validators.validateActive(data.active);
    if (activeError) errors.push(activeError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
