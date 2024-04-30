import { auth } from "@clerk/nextjs";


const adminIds = ["user_2f5YXZS8j8PhtVPPEEt2dtnpPmI"];


export const isAdmin = () => {
    
    const { userId } = auth();

    if(!userId) {
        return false
    }
    
    return adminIds.indexOf(userId) !== -1;
}