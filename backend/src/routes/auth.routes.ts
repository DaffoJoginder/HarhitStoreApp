import express from "express";
import { body } from "express-validator";
import {
  registerB2C,
  registerB2B,
  login,
} from "../controllers/auth.controller";
import { upload } from "../utils/fileUpload";

const router = express.Router();

// B2C Registration
router.post(
  "/register/b2c",
  [
    body("full_name").trim().notEmpty().isLength({ max: 100 }),
    body("email").isEmail().normalizeEmail(),
    body("mobile").isLength({ min: 10, max: 10 }).isNumeric(),
    body("password").isLength({ min: 8 }),
    body("account_type").equals("b2c"),
  ],
  registerB2C
);

// B2B Registration
router.post(
  "/register/b2b",
  upload.fields([
    { name: "gst_certificate", maxCount: 1 },
    { name: "business_license", maxCount: 1 },
    { name: "pan_card", maxCount: 1 },
    { name: "address_proof", maxCount: 1 },
  ]),
  [
    body("business_name").trim().notEmpty().isLength({ max: 200 }),
    body("business_type").isIn([
      "Restaurant",
      "Hotel",
      "RetailStore",
      "Office",
      "Cafe",
      "Other",
    ]),
    body("gst_number").isLength({ min: 15, max: 15 }),
    body("pan_number").isLength({ min: 10, max: 10 }),
    body("contact_person.name").trim().notEmpty(),
    body("contact_person.email").isEmail().normalizeEmail(),
    body("contact_person.mobile").isLength({ min: 10, max: 10 }),
    body("business_address.address_line1").trim().notEmpty(),
    body("business_address.city").trim().notEmpty(),
    body("business_address.state").trim().notEmpty(),
    body("business_address.pincode").isLength({ min: 6, max: 6 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  registerB2B
);

// Login (Unified)
router.post(
  "/login",
  [body("identifier").notEmpty(), body("password").notEmpty()],
  login
);

export default router;
