import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core'
import 'tinymce'
import 'tinymce/themes/modern'
import 'tinymce/plugins/paste'
import 'tinymce/plugins/wordcount'

@Component({
  selector: 'wn-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnDestroy, AfterViewInit {
  @Input() elementId: String
  @Output() onEditorKeyup = new EventEmitter<any>()
  @Input() content = ''

  editor: any

  constructor() {
  }

  ngAfterViewInit() {
    tinymce.init({
      selector: '#' + this.elementId,
      height: 400,
      skin_url: '../assets/skins/lightgray',
      plugins: ['paste', 'wordcount'],
      menubar: false,
      toolbar: `insertfile undo redo | styleselect | bold italic
      | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image`,
      browser_spellcheck: true,
      setup: editor => {
        this.editor = editor
        editor.on('keyup change', () => {
          const content = editor.getContent()
          this.onEditorKeyup.emit(content)
        })
      },
    })

    if (this.editor) {
      this.editor.setContent(this.content)
    }
  }

  ngOnDestroy() {
    tinymce.remove(this.editor)
  }
}
