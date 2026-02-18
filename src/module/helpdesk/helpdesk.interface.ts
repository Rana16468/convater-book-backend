import { Model } from "mongoose";

export interface  THelpDesk{
    orderId: string;
    priority:string;
    subject:string;
    category:string;
    message:string;
    isSolve:boolean;
}

export interface HelpDeskModel extends Model<THelpDesk> {
  isOrderExistByCustomId(id: string): Promise<THelpDesk | null>;
}
