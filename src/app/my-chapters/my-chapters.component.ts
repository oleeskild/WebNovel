import { Component, OnInit } from '@angular/core';
import {Chapter} from "../../models/chapter";

@Component({
  selector: 'wn-my-chapters',
  templateUrl: './my-chapters.component.html',
  styleUrls: ['./my-chapters.component.css']
})
export class MyChaptersComponent implements OnInit {

  myChapters: Chapter;

  constructor() { }

  ngOnInit() {
  }

}