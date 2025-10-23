import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { UserLoginResApi } from '../../core/models/user/userLoginResApi.models';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  sessionValid = false;
  userLoginRes!: UserLoginResApi;
  role: number | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.sesionActiva$.subscribe((activa) => {
      this.sessionValid = activa;
      this.cdr.detectChanges();
    });
     this.authService.role$.subscribe((role) => {
      this.role = role;
      this.cdr.detectChanges();
    });
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  login(user: string) {
    if (!user.trim()) {
      console.log('Usuario no válido');
      return;
    }

    this.userService.getUserLogin(user).subscribe({
      next: (data) => {
        this.userLoginRes = data;
        if (this.userLoginRes.success) {
          this.authService.saveSession(this.userLoginRes.user);
          const role = this.userLoginRes.user.RoleId;
          switch (role) {
            case 1:
              this.router.navigate(['/users']);
              break
            case 2:
              this.router.navigate(['/inicio']);
              break
            default:
              this.router.navigate(['/inicio']);
              break
          }
        }
      },
      error: (err) => console.error('Error', err.error),
    });
  }

  logout() {
    this.authService.closeSession();
    this.router.navigate(['/inicio']);
    this.role = 0;
  }
}
