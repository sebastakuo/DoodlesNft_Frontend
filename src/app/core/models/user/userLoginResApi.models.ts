import { UserLogin } from "./userLogin.models";

export interface UserLoginResApi {  
    success: boolean;
    user: UserLogin;
    message: string;
}