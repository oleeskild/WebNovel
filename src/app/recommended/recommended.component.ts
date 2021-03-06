import {Component, OnInit} from '@angular/core'
import {Book} from '../../models/book'
import {BookService} from '../book.service'

@Component({
  selector: 'wn-recommended',
  templateUrl: './recommended.component.html',
  styleUrls: ['./recommended.component.css']
})
export class RecommendedComponent implements OnInit {

  recommendedBooks: Book[]

  constructor(private _bookService: BookService) {
  }

  ngOnInit() {
    this._bookService.getAllBooks().subscribe(books => {
      this.recommendedBooks = books.reverse()
    })
  }

}
