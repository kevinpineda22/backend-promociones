import express from "express";
import multer from "multer";
import {
  getPromociones,
  createPromocion,
  updatePromocion, 
  deletePromocion,
} from "../controllers/promocionesController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", getPromociones);
router.post("/", upload.single("image"), createPromocion);
router.put("/:id", updatePromocion); 
router.delete("/:id", deletePromocion);

export default router;