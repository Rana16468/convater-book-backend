
const forgotOrderAuthenticatorIntoDb=async(payload:{phone:string,password})=>{


     try{
       return payload;

     }
     catch(error){
        catchError(error)
     }

};

const orderTrackingServices={
   forgotOrderAuthenticatorIntoDb
};