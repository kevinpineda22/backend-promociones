import { PromocionesModel } from "../models/promocionesModel.js";
import { supabase } from "../config/database.js";
import sharp from "sharp";
import { validatePromotionUpdate } from "../validators/promotionValidator.js";

/**
 * Obtiene todas las promociones registradas.
 */
export const getPromociones = async (req, res, next) => {
  try {
    // Parámetros de query para filtrado y paginación
    const { status = "all", page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 para evitar abuso
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from("promociones").select("*", { count: "exact" });

    // Filtrado por estado
    const now = new Date().toISOString();

    if (status === "active") {
      // Mostrar solo activas y dentro del rango de fechas
      query = query
        .eq("active", true)
        .lte("start_date", now)
        .or(`end_date.is.null,end_date.gt.${now}`);
    } else if (status === "scheduled") {
      // Mostrar solo programadas (fecha inicio en el futuro)
      query = query.eq("active", true).gt("start_date", now);
    } else if (status === "expired") {
      // Mostrar solo expiradas
      query = query.eq("active", true).lt("end_date", now);
    } else if (status === "inactive") {
      // Mostrar solo desactivadas
      query = query.eq("active", false);
    }
    // Si status === "all", no se aplica filtro adicional

    // Ordenamiento y paginación
    const { data, error, count } = await query
      .order("order_index", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    // Retornar con información de paginación
    res.json({
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
        hasMore: pageNum < Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nueva promoción procesando la imagen y guardando fechas de vigencia.
 */
export const createPromocion = async (req, res, next) => {
  try {
    // Capturamos los datos enviados desde el frontend mejorado
    const { bgColor, startDate, endDate } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ninguna imagen" });
    }

    const file = req.file;

    // 1. Optimización: Convertir a WebP usando Sharp
    const webpBuffer = await sharp(file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${Date.now()}.webp`;
    const filePath = `${fileName}`;

    // 2. Storage: Subir imagen al Bucket de Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("promociones-bucket")
      .upload(filePath, webpBuffer, {
        contentType: "image/webp",
      });

    if (uploadError) throw uploadError;

    // 3. URL: Obtener la dirección pública de la imagen
    const { data: publicUrlData } = supabase.storage
      .from("promociones-bucket")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    /**
     * 4. Lógica de Fechas (Colombia UTC-5):
     * El frontend ya envía el offset "-05:00" en el string.
     * Si por alguna razón no llega startDate, generamos la local en formato ISO compatible.
     */
    const finalStartDate =
      startDate ||
      new Date().toLocaleString("sv-SE").replace(" ", "T") + "-05:00";
    const finalEndDate = endDate && endDate !== "" ? endDate : null;

    // 5. DB: Guardar en la base de datos a través del modelo
    const newPromocion = await PromocionesModel.create(
      publicUrl,
      bgColor || "transparent",
      finalStartDate,
      finalEndDate,
    );

    res.status(201).json(newPromocion);
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina una promoción tanto del Storage como de la Base de Datos.
 */
export const deletePromocion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Obtener los datos actuales para recuperar la URL de la imagen
    const promocion = await PromocionesModel.getById(id);
    if (!promocion) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    // 2. Extraer el nombre del archivo (última parte de la URL)
    const urlParts = promocion.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1];

    // 3. Eliminar archivo físico del Storage
    const { error: storageError } = await supabase.storage
      .from("promociones-bucket")
      .remove([fileName]);

    if (storageError) {
      console.error("Error eliminando archivo de Storage:", storageError);
    }

    // 4. Eliminar registro lógico de la BD
    await PromocionesModel.delete(id);

    res.json({ message: "Promoción eliminada correctamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una promoción existente (fechas, color, estado)
 * NO permite cambiar la imagen (usar endpoint separado si es necesario)
 *
 * Campos permitidos para actualizar:
 * - start_date: Fecha de inicio (ISO string con offset)
 * - end_date: Fecha de fin (ISO string con offset)
 * - bg_color: Color de fondo (hex o "transparent")
 * - active: Estado de la promoción (boolean)
 */
export const updatePromocion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, bg_color, active } = req.body;

    // 1. Validar que el ID sea válido
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // 2. Verificar que la promoción existe
    const existingPromo = await PromocionesModel.getById(id);
    if (!existingPromo) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    // 3. Preparar datos a actualizar
    const updates = {};
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (bg_color !== undefined) updates.bg_color = bg_color;
    if (active !== undefined) updates.active = active;

    // 4. Validar que hay algo que actualizar
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Debes proporcionar al menos un campo para actualizar",
      });
    }

    // 5. Validar los datos con el validador centralizado
    const validation = validatePromotionUpdate(updates);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: validation.errors,
      });
    }

    // 6. Actualizar en la base de datos
    const updatedPromo = await PromocionesModel.update(id, updates);

    // 7. Retornar la promoción actualizada
    res.json({
      message: "Promoción actualizada correctamente",
      data: updatedPromo,
    });
  } catch (error) {
    next(error);
  }
};
