import express from "express";
import { OrderController } from "../controllers/OrderController";

const router = express.Router();
const orderController = new OrderController();

router.post("/neworder", orderController.handleNewOrder);

export default router;
