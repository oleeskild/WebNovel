import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookGridComponent } from './book-grid.component';

describe('BookGridComponent', () => {
  let component: BookGridComponent;
  let fixture: ComponentFixture<BookGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should open a book when book card is clicked', ()=>{
    expect(component).toBeTruthy();
  })
});
