import { z } from "zod";

export const authSchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(60),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(72)
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetSchema = z.object({
  token: z.string().min(4),
  password: z.string().min(8, "Use at least 8 characters").max(72)
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(6, "Valid phone required").max(20),
  line1: z.string().min(4, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(2, "Postal code is required").max(12),
  country: z.string().min(2).default("Bangladesh"),
  label: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
});

export const checkoutSchema = z.object({
  shipping: addressSchema.extend({ email: z.string().email() }),
  delivery: z.enum(["STANDARD", "EXPRESS", "PICKUP"]),
  coupon: z.string().optional(),
  payment: z.object({
    method: z.enum(["CARD"]),
    number: z.string().regex(/^[0-9 ]{12,19}$/, "Enter a valid card number"),
    name: z.string().min(2, "Name on card is required"),
    exp: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Use MM/YY"),
    cvc: z.string().regex(/^[0-9]{3,4}$/, "CVC must be 3–4 digits"),
  }),
  giftNote: z.string().max(160).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().max(120).optional().default(""),
  body: z.string().min(10, "Tell us a little more (10+ characters)"),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(80),
  body: z.string().min(10, "Reviews need at least 10 characters").max(2000),
});

export const adminProductSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "lowercase, numbers and dashes"),
  tagline: z.string().max(140).default(""),
  description: z.string().min(10),
  categorySlug: z.string().min(1),
  basePrice: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  badge: z.string().max(20).nullable().optional(),
  primaryImage: z.string().min(1).default("/renders/hero-obsidian.jpg"),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().min(3).max(120),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.number().int().min(1),
  minSubtotal: z.number().int().nullable().optional(),
  maxUses: z.number().int().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export const dealSchema = z.object({
  title: z.string().min(3).max(80),
  subtitle: z.string().min(3).max(140),
  type: z.enum(["FLASH", "FLAGSHIP", "BUNDLE", "ACCESSORY"]),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  badge: z.string().max(20).optional(),
  productIds: z.array(z.string()).max(20).default([]),
  discountPercent: z.number().int().min(1).max(70).default(10),
});
