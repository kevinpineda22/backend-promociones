import { PromocionesModel } from "../models/promocionesModel.js";
import { supabase } from "../config/database.js";
import sharp from "sharp";

/**
 * Obtiene todas las promociones registradas.
 */
export const getPromociones = async (req, res, next) => {
  try {
    const promociones = await PromocionesModel.getAll();
    res.json(promociones);
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
    const finalStartDate = startDate || new Date().toLocaleString("sv-SE").replace(" ", "T") + "-05:00";
    const finalEndDate = (endDate && endDate !== "") ? endDate : null;

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