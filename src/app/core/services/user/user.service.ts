import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class UserService {
    private ApiUrl = 'http://localhost:3000/user';

    constructor(private http: HttpClient) { }

    getUserLogin(usuario: string) {
        return this.http.get<any>(`${this.ApiUrl}/GetUserById/${usuario}`);
    }

    getUsers(usuario: string) {
        return this.http.get<any>(`${this.ApiUrl}/GetAllUsers/${usuario}`);
    }

}