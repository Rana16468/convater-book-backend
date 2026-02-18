import { z } from "zod";

/* -----------------------------------------
   Delivery Validation
------------------------------------------*/

const deliverySchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Phone is required"),
  address: z.string().min(5, "Address is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  district: z.string().min(1, "District is required"),
  thana: z.string().min(1, "Thana is required"),
});

/* -----------------------------------------
   File Data Validation
------------------------------------------*/

const fileDataSchema = z.object({
  file: z.string().min(1, "File is required").optional(), // base64 or URL
  name: z.string().min(1, "File name is required"),
  pages: z
    .number({ invalid_type_error: "Pages must be a number" })
    .min(1, "Pages must be at least 1"),
  size: z.string().min(1, "File size is required"),
});

/* -----------------------------------------
   Payment Validation
------------------------------------------*/

const paymentSchema = z.object({
  method: z.enum(["bkash", "nagad", "rocket", "cash"], {
    required_error: "Payment method is required",
  }),
  totalCost:z.string().min(2, "totalCost is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
  voucher: z.string().optional(),
});

/* -----------------------------------------
   Preferences Validation
------------------------------------------*/

const preferencesSchema = z.object({
  binding: z.string().min(1),
  bookName: z.string().min(1),
  location: z.string().min(1),
  pageType: z.string().min(1),
  printType: z.string().min(1),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(1),
  selectedOption: z.number(),
});

/* -----------------------------------------
   Main Order Validation
------------------------------------------*/

 const createOrderZodSchema = z.object({
  body: z.object({
    coverImages: z
      .object({
        back: z.string().optional(),
        front: z.string().optional(),
      })
      .optional(),

    delivery: deliverySchema,

    fileData: fileDataSchema,

    orderId: z.string().min(1, "Order ID is required"),

    payment: paymentSchema,

    preferences: preferencesSchema,

    ipAddress: z.string().min(1, "IP Address is required"),

    showErrors: z.boolean().optional(),
    showToast: z.boolean().optional(),
    uploadStatus: z.string().optional(),
  }),
});

const orderAuthenticatorSchema=z.object({
  body: z.object({
    orderId: z.string({required_error:"orderId is required"}),
    password: z.string({required_error:"password is required"})
  
  })
})

const orderZodValidation={
    createOrderZodSchema,
    orderAuthenticatorSchema
};

export default orderZodValidation;
