import { PromocionesModel } from "../models/promocionesModel.js";
import { supabase } from "../config/database.js";
import sharp from "sharp";

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
    const { bgColor, startDate, endDate } = req.body; // Capturamos fechas
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ninguna imagen" });
    }

    const file = req.file;

    // Convertir a WebP usando Sharp
    const webpBuffer = await sharp(file.buffer)
      .webp({ quality: 80 }) // Calidad 80% para optimizar tamaño sin perder mucha calidad
      .toBuffer();

    const fileName = `${Date.now()}.webp`;
    const filePath = `${fileName}`;

    // Subir imagen al Bucket de Supabase
    const { data, error: uploadError } = await supabase.storage
      .from("promociones-bucket")
      .upload(filePath, webpBuffer, {
        contentType: "image/webp",
      });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from("promociones-bucket")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Guardar en base de datos con fechas - Colombia usa UTC-5
    const newPromocion = await PromocionesModel.create(
      publicUrl,
      bgColor || "transparent",
      startDate || new Date().toISOString(),
      endDate || null,
    );

    res.status(201).json(newPromocion);
  } catch (error) {
    next(error);
  }
};

export const deletePromocion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener la promoción para saber la URL de la imagen
    const promocion = await PromocionesModel.getById(id);
    if (!promocion) {
      return res.status(404).json({ message: "Promoción no encontrada" });
    }

    // Extraer el nombre del archivo de la URL
    // URL ejemplo: https://xyz.supabase.co/storage/v1/object/public/promociones-bucket/123456.jpg
    const urlParts = promocion.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1];

    // Eliminar de Storage
    const { error: storageError } = await supabase.storage
      .from("promociones-bucket")
      .remove([fileName]);

    if (storageError) {
      console.error("Error eliminando archivo de Storage:", storageError);
    }

    // Eliminar de BD
    await PromocionesModel.delete(id);

    res.json({ message: "Promoción eliminada correctamente" });
  } catch (error) {
    next(error);
  }
};
