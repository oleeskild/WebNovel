import {Component, OnInit, ViewChild} from '@angular/core'
import * as d3 from 'd3'
import {EdgeService} from '../edge.service'
import {ChapterService} from '../chapter.service'
import {BookService} from '../book.service'
import {Chapter} from '../../models/chapter'
import {Edge} from '../../models/edge'

@Component({
  selector: 'wn-book-tree-graph',
  templateUrl: './book-tree-graph.component.html',
  styleUrls: ['./book-tree-graph.component.css']
})
export class BookTreeGraphComponent implements OnInit {

  bookId = '59d71d9ab40855001296ce3c'
  addedNodes = {}

  rootChapterId: string

  allChapterNodes: Chapter[]
  edges: Edge[]

  rootNode: Chapter

  @ViewChild('treegraph') treeGraph

  constructor(private _edgeService: EdgeService,
              private _chapterService: ChapterService,
              private _bookService: BookService) {
  }

  ngOnInit() {
    this._chapterService.getBookChapters(this.bookId).subscribe(chapters => {
      this.allChapterNodes = chapters
      this._bookService.getBook(this.bookId).subscribe(book => {
        this.rootChapterId = book.startChapter
        this._edgeService.getBookEdges(this.bookId).subscribe(edges => {
          this.edges = edges
          this.createTree()
          this.setupGraph()
        })
      })
    })
  }

  setupGraph() {
    const margin = {top: 20, right: 120, bottom: 20, left: 120},
      width = 960 - margin.right - margin.left,
      height = 500 - margin.top - margin.bottom

    let i = 0,
      root
    const duration = 750

    const outerThis = this
    const tree = d3.layout.tree()
      .size([height, width])

    const diagonal = d3.svg.diagonal()
      .projection(function (d) {
        return [d.y, d.x]
      })

    const svg = d3.select(this.treeGraph.nativeElement).append('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)

    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.bottom + margin.top)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .call(d3.behavior.zoom()
        .scaleExtent([1 / 4, 4])
        .on('zoom', function () {
          d3.select('g.graph').attr('transform', 'translate(' + d3.event.translate
            + ')' + ' scale(' + d3.event.scale + ')')
        }))

    const graph = svg
      .append('g')
      .attr('class', 'graph')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    root = this.rootNode
    root.x0 = height / 2
    root.y0 = 0

    update(root)

    d3.select(self.frameElement).style('height', '500px')

    function update(source) {

      // Compute the new tree layout.
      const nodes = tree.nodes(root).reverse(),
        links = []
      outerThis.edges.forEach(edge => {
        const link = {source: null, target: null}
        link.source = nodes.find(node => node._id === edge.source)
        link.target = nodes.find(node => node._id === edge.target)
        if (link.source && link.target) {
          links.push(link)
        }
      })

      // Normalize for fixed-depth.
      nodes.forEach(function (d) {
        d.y = d.depth * 180
      })

      // Update the nodes…
      const node = graph.selectAll('g.node')
        .data(nodes, function (d) {
          return d._id || (d.id = ++i)
        })

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', function (d) {
          return 'translate(' + source.y0 + ',' + source.x0 + ')'
        })
        .on('click', click)

      nodeEnter.append('circle')
        .attr('r', 1e-6)
        .style('fill', function (d) {
          return d._children ? 'lightsteelblue' : '#fff'
        })

      nodeEnter.append('text')
        .attr('x', function (d) {
          return d.children || d._children ? -13 : 13
        })
        .attr('dy', '.35em')
        .attr('text-anchor', function (d) {
          return d.children || d._children ? 'end' : 'start'
        })
        .text(function (d) {
          return d.title
        })
        .style('fill-opacity', 1e-6)

      // Transition nodes to their new position.
      const nodeUpdate = node.transition()
        .duration(duration)
        .attr('transform', function (d) {
          return 'translate(' + d.y + ',' + d.x + ')'
        })

      nodeUpdate.select('circle')
        .attr('r', 10)
        .style('fill', function (d) {
          return d._children ? 'lightsteelblue' : '#fff'
        })

      nodeUpdate.select('text')
        .style('fill-opacity', 1)

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', function (d) {
          return 'translate(' + source.y + ',' + source.x + ')'
        })
        .remove()

      nodeExit.select('circle')
        .attr('r', 1e-6)

      nodeExit.select('text')
        .style('fill-opacity', 1e-6)

      // Update the links…
      const link = graph.selectAll('path.link')
        .data(links, function (d) {
          return d.target._id + d.source._id
        })

      // Enter any new links at the parent's previous position.
      link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', function (d) {
          const o = {x: source.x0, y: source.y0}
          return diagonal({source: o, target: o})
        })

      // Transition links to their new position.
      link.transition()
        .duration(duration)
        .attr('d', diagonal)

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
          const o = {x: source.x, y: source.y}
          return diagonal({source: o, target: o})
        })
        .remove()

      // Stash the old positions for transition.
      nodes.forEach(function (d) {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

// Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else {
        d.children = d._children
        d._children = null
      }
      update(d)
    }
  }

  createTree() {
    this.rootNode = this.allChapterNodes.find(chapter => chapter._id === this.rootChapterId)
    const childrenIds = this.edges.filter(edge => edge.source === this.rootChapterId).map(edge => edge.target)
    const children = this.allChapterNodes.filter(chapter => childrenIds.indexOf(chapter._id) !== -1)
    this.rootNode.children = children

    this.rootNode.children.forEach(child => {
      this.addedNodes[child._id] = child
      this.populateChildren(child)
    })

  }

  populateChildren(node) {
    const childrenIds = this.edges
      .filter(edge => edge.source === node._id)
      .map(edge => edge.target)
      .filter(childId => !this.addedNodes[childId])

    const children = this.allChapterNodes.filter(chapter => childrenIds.indexOf(chapter._id) !== -1)
    node.children = children
    node.children.forEach(child => {
      this.addedNodes[child._id] = child
      this.populateChildren(child)
    })

  }

}