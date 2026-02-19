import { supabase } from "../config/database.js";

export const PromocionesModel = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("promociones")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  create: async (imageUrl, bgColor, startDate, endDate) => {
    const { data, error } = await supabase
      .from("promociones")
      .insert([
        {
          image_url: imageUrl,
          bg_color: bgColor,
          start_date: startDate,
          end_date: endDate,
          active: true,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  delete: async (id) => {
    const { error } = await supabase.from("promociones").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("promociones")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Actualiza campos específicos de una promoción
   * @param {number} id - ID de la promoción
   * @param {Object} updates - Campos a actualizar (start_date, end_date, bg_color, active)
   * @returns {Object} Promoción actualizada
   */
  update: async (id, updates) => {
    // Solo permitir actualización de estos campos
    const allowedFields = ["start_date", "end_date", "bg_color", "active"];
    const filteredUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error("No valid fields to update");
    }

    const { data, error } = await supabase
      .from("promociones")
      .update(filteredUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
