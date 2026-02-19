import express from "express";
import multer from "multer";
import {
  getPromociones,
  createPromocion,
  deletePromocion,
  updatePromocion,
} from "../controllers/promocionesController.js";

const router = express.Router();

// Configuración de Multer para guardar en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", getPromociones);
router.post("/", upload.single("image"), createPromocion);
router.put("/:id", updatePromocion); // Actualizar fechas, color, estado
router.delete("/:id", deletePromocion);

export default router;
