import { UserLoginResApi } from '@/src/app/core/models/user/userLoginResApi.models';
import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { UserLogin } from '@/src/app/core/models/user/userLogin.models';
import { UserService } from '@/src/app/core/services/user/user.service';
import { UsersResApi } from '../../../core/models/user/usersResApi';
import { User } from '@/src/app/core/models/user/user.models';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  imports: [MatTableModule, CommonModule],
})
export class UserComponent {



  ngOnInit(): void {
    this.getUsers();
  }

  userLoginRes: UserLoginResApi;
  userLogin: UserLogin;
  usersResApi: UsersResApi;

  displayedColumns: string[] = ['Id', 'DiscordId', 'Credits', 'Created_At'];

  dataSource = new MatTableDataSource<User>([])

  constructor(private userService: UserService, private authService: AuthService, private router: Router) { }

  getUsers() {
    const session = this.authService.getSession();
    if (session && session.userLogin.RoleId === 1) {
      const discordId = session.userLogin.DiscordId;
      this.userService.getUsers(discordId).subscribe({
        next: (data) => {
          this.usersResApi = data;
          const usersFixed = this.usersResApi.users.map(u => ({
            ...u,
            Created_At: new Date(u.Created_At)
          }));

          this.dataSource.data = usersFixed;
        }
      });
    }else{
      this.router.navigate(['/inicio']);
    }
  }
}
