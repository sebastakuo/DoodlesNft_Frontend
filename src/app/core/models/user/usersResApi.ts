import { User } from "./user.models";

export interface UsersResApi {
    success: boolean;
    users: User[];
    message: string;
}
