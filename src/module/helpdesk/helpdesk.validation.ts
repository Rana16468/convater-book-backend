import { z } from "zod";

 const createHelpDeskZodSchema = z.object({
  body: z.object({
    orderId: z
      .string({ required_error: "Order ID is required" })
      .min(1, "Order ID cannot be empty"),

    priority: z
      .string({ required_error: "Priority is required" })
      .refine((val) => ["low", "medium", "high"].includes(val), {
        message: "Priority must be low, medium, or high",
      }),

    subject: z
      .string({ required_error: "Subject is required" })
      .min(1, "Subject cannot be empty"),

    category: z
      .string({ required_error: "Category is required" })
      .min(1, "Category cannot be empty"),

    message: z
      .string({ required_error: "Message is required" })
      .min(10, "Message must be at least 10 characters long"),

    isSolve: z.boolean().optional().default(false),
  }),
});


const updateHelpDeskZodSchema=z.object({

   body: z.object({
    id: z.string({required_error:"id solve is required"}),
    isSolve: z.boolean({required_error:"is solve is required"})
   })
})

const helpDeskValidation={
     createHelpDeskZodSchema,
     updateHelpDeskZodSchema
};

export default helpDeskValidation;


