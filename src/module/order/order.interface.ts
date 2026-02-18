import { Model } from "mongoose";

export interface TOrder {
  coverImages?: {
    back: string;
    front: string;
  };

  delivery: {
    name: string;
    phone: string;
    address: string;
    password: string;

    district: string;
    thana: string;
  };

  fileData: {
    file: string; // base64 OR file URL
    name: string;
    pages: number;
    size: string;
  };

  orderId: string;

  payment: {
    method: string;
    transactionId: string;
    totalCost:number;

    voucher?: string;
  };

  preferences: {
    binding: string;
    bookName: string;
    location: string;
    pageType: string;
    printType: string;
    quantity: number;
    selectedOption: number;
  };
  ipAddress?:string;
  showErrors?: boolean;
  showToast?: boolean;
  uploadStatus?: string;
};


export interface TOrderResult {
   status: boolean;
   message:string;
}

export interface OrderModel extends Model<TOrder> {
  comparePassword(
    plainTextPassword: string,
    hashPassword: string
  ): Promise<boolean>;
}



export interface OrderModel extends Model<TOrder> {
  isOrderExistByCustomId(id: string): Promise<TOrder | null>;
}
