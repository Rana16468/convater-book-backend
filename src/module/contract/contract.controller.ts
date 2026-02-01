import { RequestHandler } from "express";

import { ContractService } from "./contract.services";

import httpStatus from "http-status";
import catchAsync from "../../utility/catchAsync";
import sendResponse from "../../utility/sendResponse";




const createContract:RequestHandler=catchAsync(async(req,res)=>{

    

    const result=await ContractService.createContractIntoDb(req.body);
    sendResponse(res,{success:true,statusCode:httpStatus.CREATED,message:"Sucessfulled Added Contract",data:result});


});


const AllContract:RequestHandler=catchAsync(async(req,res)=>{

    const result=await ContractService.AllContractIntoDb();
    sendResponse(res,{success:true,statusCode:httpStatus.OK,message:"Successfully Find All Conreact",data:result});

});

const  SpecificContractId:RequestHandler=catchAsync(async(req,res)=>{
    const {id}=req.params;
    const result=await ContractService.SpecificContractIdIntoDb(id);
    sendResponse(res,{success:true,statusCode:httpStatus.OK,message:"Successfully Get Specific Contract",data:result});
});

const UpdateContract:RequestHandler=catchAsync(async(req,res)=>{

    const {id}=req.params;
    const result=await ContractService.UpdateContractFromDb(id,req.body);
    sendResponse(res,{success:true,statusCode:httpStatus.OK,message:"Successfully Updated Contract Information",data:result});

});

const DeleteContract:RequestHandler=catchAsync(async(req,res)=>{

    const {id}=req.params;
    const result=await ContractService.DeleteContractFromDb(id);
    sendResponse(res,{success:true,statusCode:httpStatus.OK,message:"Successfully Delete Contrcat Info",data:result});

});
const FavoriteContrcat:RequestHandler=catchAsync(async(req,res)=>{
    const {id}=req.params;
    const result=await ContractService.FavoriteContrcatFromDb(id);
    sendResponse(res,{success:true,statusCode:httpStatus.OK,message:"Successfully Recorded Fevorite",data:result});
})

export const ContractController={
    createContract,
    AllContract,
    SpecificContractId,
    UpdateContract,
    DeleteContract,
    FavoriteContrcat
}
