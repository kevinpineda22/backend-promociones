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
};
