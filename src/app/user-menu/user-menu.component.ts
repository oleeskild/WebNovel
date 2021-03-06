import {Component, OnInit} from '@angular/core'
import {User} from '../../models/user'
import {UserService} from '../user.service'
import {AuthenticationService} from '../authentication.service'
import {Router} from '@angular/router'

@Component({
  selector: 'wn-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent implements OnInit {

  currentUser = new User()

  constructor(private _userService: UserService, private _authenticationService: AuthenticationService, private router: Router) {
  }

  ngOnInit() {
  this._userService.getCurrentUser().subscribe(user => {
      this.currentUser = user
    })
  }

  logout() {
    this._authenticationService.logout()
    this.router.navigate(['/welcome'])
  }
}
