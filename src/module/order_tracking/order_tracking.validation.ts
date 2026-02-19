import {z} from 'zod';

const orderTrackingSchema=z.object({
    body: z.object({
        phone: z.string({required_error:"phone number is  required"}),
        password: z.string({required_error:"password is required"})
    })
});


/**
 * Reusable status block schema
 */
const statusBlockSchema = z.object({
  isOrderPlaced: z.boolean().optional(),
  orderPlacedDate: z.coerce.date().optional(),
})

const paymentVerifiedSchema = z.object({
  isPaymentVerified: z.boolean().optional(),
  PaymentVerifiedDate: z.coerce.date().optional(),
})

const printingStartedSchema = z.object({
  isPrintingStarted: z.boolean().optional(),
  PrintingStartedDate: z.coerce.date().optional(),
})

const printingCompletedSchema = z.object({
  isPrintingCompleted: z.boolean().optional(),
  PrintingCompletedDate: z.coerce.date().optional(),
})

const readyDeliverySchema = z.object({
  isReadyDelivery: z.boolean().optional(),
  ReadyDeliveryDate: z.coerce.date().optional(),
})
const bookReachedSchema = z.object({
  isBookReachedYourCity: z.boolean().optional(),
  BookReachedYourCityDate: z.coerce.date().optional(),
})

const outForDeliverySchema = z.object({
  isOutForDelivery: z.boolean().optional(),
  OutForDeliveryDate: z.coerce.date().optional(),
})

const deliveredSchema = z.object({
  isDelivered: z.boolean().optional(),
  DeliveredDate: z.coerce.date().optional(),
})

/**
 * Main schema
 */
 const orderTrackingUpdateZodSchema = z.object({


   body: z.object({
     OrderPlaced: statusBlockSchema.optional(),
  PaymentVerified: paymentVerifiedSchema.optional(),
  PrintingStarted: printingStartedSchema.optional(),
  PrintingCompleted: printingCompletedSchema.optional(),
  ReadyDelivery: readyDeliverySchema.optional(),
  BookReachedYourCity: bookReachedSchema.optional(),
  OutForDelivery: outForDeliverySchema.optional(),
  Delivered: deliveredSchema.optional(),

  isDelete: z.boolean().optional(),
   })
});

/**
 * For UPDATE only (PATCH)
 */




const orderTrackingValidation={
    orderTrackingSchema,
     orderTrackingUpdateZodSchema
};

export default orderTrackingValidation;