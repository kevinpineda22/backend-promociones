import { PromocionesModel } from "../models/promocionesModel.js";
import { supabase } from "../config/database.js";
import sharp from "sharp";
import { validatePromotionUpdate } from "../validators/promotionValidator.js"; 

export const getPromociones = async (req, res, next) => {
  try {
    const promociones = await PromocionesModel.getAll();
    res.json(promociones);
  } catch (error) {
    next(error);
  }
};

export const createPromocion = async (req, res, next) => {
  try {
    const { bgColor, startDate, endDate } = req.body; 

    // 👇 1. APLICAR VALIDADOR ANTES DE HACER NADA
    const finalStartDate = startDate || new Date().toLocaleString("sv-SE").replace(" ", "T") + "-05:00";
    const finalEndDate = (endDate && endDate !== "") ? endDate : null;

    const validation = validatePromotionUpdate({
      start_date: finalStartDate,
      end_date: finalEndDate,
      bg_color: bgColor || "transparent"
    });

    if (!validation.isValid) {
      return res.status(400).json({ 
        message: "Datos de promoción inválidos", 
        errors: validation.errors 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No se ha subido ninguna imagen" });
    }

    const file = req.file;

    // Procesamiento de imagen
    const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    const fileName = `${Date.now()}.webp`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("promociones-bucket")
      .upload(filePath, webpBuffer, { contentType: "image/webp" });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("promociones-bucket")
      .getPublicUrl(filePath);

    // Guardar en BD
    const newPromocion = await PromocionesModel.create(
      publicUrlData.publicUrl,
      bgColor || "transparent",
      finalStartDate,
      finalEndDate
    );

    res.status(201).json(newPromocion);
  } catch (error) {
    next(error);
  }
};

// 👇 NUEVA FUNCIÓN PARA EDITAR FECHAS CON EL VALIDADOR
export const updatePromocion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, bg_color, active } = req.body;

    // Validar los datos recibidos
    const validation = validatePromotionUpdate(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: "Error de validación", 
        errors: validation.errors 
      });
    }

    // Actualizar en la base de datos
    const updatedPromocion = await PromocionesModel.update(id, req.body);
    
    if (!updatedPromocion) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    res.json({ message: "Promoción actualizada", data: updatedPromocion });
  } catch (error) {
    next(error);
  }
};

export const deletePromocion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promocion = await PromocionesModel.getById(id);
    if (!promocion) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    const urlParts = promocion.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1];

    const { error: storageError } = await supabase.storage
      .from("promociones-bucket")
      .remove([fileName]);

    if (storageError) {
      console.error("Error eliminando archivo de Storage:", storageError);
    }

    await PromocionesModel.delete(id);

    res.json({ message: "Promoción eliminada correctamente" });
  } catch (error) {
    next(error);
  }
};