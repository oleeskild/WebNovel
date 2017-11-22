import {Component, Input, OnChanges, OnInit} from '@angular/core'
import {Book} from '../../models/book'
import {UserService} from '../user.service'
import {Router} from '@angular/router'
import {AuthenticationService} from '../authentication.service'
import {User} from '../../models/user'
import {LikeService} from '../like.service'

@Component({
  selector: 'wn-book-grid',
  templateUrl: './book-grid.component.html',
  styleUrls: ['./book-grid.component.css']
})
export class BookGridComponent implements OnInit, OnChanges {

  @Input('books') books: Book[] = []
  bookInfoLoaded = false

  colors = [
    '#e67e22',
    '#d35400',
    '#f39c12',
    '#34495e',
    '#2980b9',
    '#16a085'
  ]

  constructor(private _userService: UserService,
              private router: Router,
              private _likeService: LikeService,
              private _authService: AuthenticationService) {
  }


  ngOnInit() {
  }

  ngOnChanges() {
  }

  openBook(book: Book) {
      this._userService.getCurrentlyReading(book._id).subscribe(cr => {
        if (cr && cr.chapterTrail) {
          this.router.navigate(['read', cr.chapterTrail[cr.chapterTrail.length - 1]])
        } else {
          this.router.navigate(['read', book.startChapter])
        }
      })
  }

}
