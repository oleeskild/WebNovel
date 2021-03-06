import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild} from '@angular/core'
import * as d3 from 'd3'
import {EdgeService} from '../edge.service'
import {ChapterService} from '../chapter.service'
import {BookService} from '../book.service'
import {Chapter} from '../../models/chapter'
import {Edge} from '../../models/edge'
import {ReadingHistoryService} from '../reading-history.service'
import {ActivatedRoute, Router} from '@angular/router'
import {ReadingHistory} from '../../models/readinghistory'
import {NodeMap} from '../../models/nodemap'

@Component({
  selector: 'wn-book-tree-graph',
  templateUrl: './book-tree-graph.component.html',
  styleUrls: ['./book-tree-graph.component.css']
})
export class BookTreeGraphComponent implements OnInit, OnChanges {

  @Input('bookId') bookId: string
  addedNodes = {}

  @Input('mode') mode = 'read' // read, draw or insert
  @Output() selectedNode = new EventEmitter<any>()
  @Output() newNodes = new EventEmitter<any[]>()
  @Output() newEdges = new EventEmitter<Edge[]>()

  @Output() navigatedToNewNode = new EventEmitter<string>()

  @Input() newNodeMap: NodeMap[] = []

  currentChapterId: string

  rootChapterId: string

  allChapterNodes: Chapter[]
  edges: Edge[]

  walkedChapterIds: string[] = []
  clickableNodeIds: string[] = []

  rootNode: Chapter
  nodes: any = []
  links: any = []

  @ViewChild('treegraph') treeGraph

  constructor(private _edgeService: EdgeService,
              private _chapterService: ChapterService,
              private _bookService: BookService,
              private _readingHistoryService: ReadingHistoryService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnChanges() {

    if (this.newNodeMap) {
      d3.selectAll('.newnode')
        .select('text')
        .text((d) => {
          const nodeMap = this.newNodeMap.find(nm => nm.nodeId == d._id)
          if (nodeMap) {
            return nodeMap.title
          } else {
            return d._id
          }
        })
    }

  }

  getEdgesAndSetupGraph() {
    this._edgeService.getBookEdges(this.bookId).subscribe(edges => {
      this.edges = edges
      this.createTree()
      this.setupGraph()
      this.setClickableNodeArray()
    })
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.currentChapterId = params['chapterId']
      this.setClickableNodeArray()
    })

    if (!this.bookId) {
      this.bookId = '59d71d9ab40855001296ce3c'
    }

    this._chapterService.getBookChapters(this.bookId, false).subscribe(chapters => {
      this.allChapterNodes = chapters

      this._bookService.getBook(this.bookId).subscribe(book => {

        this._readingHistoryService.getMyBookReadingHistory(this.bookId).subscribe(readingHistory => {
          if (readingHistory.chapterIds) {
            this.walkedChapterIds = readingHistory.chapterIds
          } else {
            this.walkedChapterIds = [book.startChapter]
          }
          this.rootChapterId = book.startChapter

          this.getEdgesAndSetupGraph()
        }, err => {

          this.walkedChapterIds = [book.startChapter]
          this.rootChapterId = book.startChapter

          this.getEdgesAndSetupGraph()
        })


      })
    })
  }

  isInReadMode(): boolean {
    return this.mode.toLowerCase() === 'read'
  }

  isInDrawMode(): boolean {
    return this.mode.toLowerCase() === 'draw'
  }

  isInInsertMode(): boolean {
    return this.mode.toLowerCase() === 'insert'
  }

  saveReadingHistory() {
    const rh = new ReadingHistory()
    rh.bookId = this.bookId
    rh.chapterIds = this.walkedChapterIds
    this._readingHistoryService.saveReadingHistory(rh).subscribe()
  }

  setupGraph() {
    const margin = {top: 20, right: 120, bottom: 20, left: 120}

    const element = this.treeGraph.nativeElement
    const width = (element.offsetWidth || 1600) - margin.left - margin.right
    const height = (element.offsetHeight || 800) - margin.top - margin.bottom

    const nodeRadius = 10

    let i = 0,
      root
    const duration = 750

    let mousedown_node = null
    let mouseup_node = null
    let emptyNodes: any[] = []
    let newEdges: Edge[] = []
    let newNodeId = 1

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

    //define arrows
    svg.append('svg:defs').append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#000')

    svg.append('svg:defs').append('svg:marker')
      .attr('id', 'up-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 4)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', '90deg')
      .append('svg:path')
      .attr('d', 'M10,-5L0,0L10,5')
      .attr('fill', '#000')

    const graph = svg
      .append('g')
      .attr('class', 'graph')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    let drag_line = graph
      .append('path')
      .attr('class', 'dragline hidden')
      .attr('d', 'M0,0L0,0')

    root = this.rootNode
    root.x0 = height / 2
    root.y0 = 0

    update(root)

    d3.select(self.frameElement).style('height', '500px')

    function update(source) {

      // Compute the new tree layout.
      outerThis.nodes = tree.nodes(root).reverse(),
        outerThis.links = []
      outerThis.edges.forEach(edge => {
        const link = {source: null, target: null, _id: edge._id}
        link.source = outerThis.nodes.find(node => node._id === edge.source)
        link.target = outerThis.nodes.find(node => node._id === edge.target)
        if (link.source && link.target) {
          outerThis.links.push(link)
        }
      })

      // Normalize for fixed-depth.
      outerThis.nodes.forEach(function (d) {
        d.y = d.depth * 180
      })

      // Update the nodes…
      const node = graph.selectAll('g.node')
        .data(outerThis.nodes, function (d) {
          return d._id || (d.id = ++i)
        })


      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node.enter()
        .append('g')
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
        .on('mouseover', nodeMouseOver)
        .on('mouseout', nodeMouseOut)

      nodeEnter.append('text')
        .attr('x', function (d) {
          return d.children || d._children ? -13 : 13
        })
        .attr('dy', '-.75em')
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
        .attr('r', nodeRadius)
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
        .data(outerThis.links, function (d) {
          return d._id
        })
        .attr('class', function (d) {
          let classString = 'link'
          if (outerThis.edgeIsWalked(d)) {
            classString += ' walked'
          }
          return classString
        })

      // Enter any new links at the parent's previous position.
      link.enter().insert('path', 'g')
        .attr('class', function (d) {
          let classString = 'link'
          if (outerThis.edgeIsWalked(d)) {
            classString += ' walked'
          }
          return classString
        })
        .attr('d', function (d) {
          const o = {x: source.x0, y: source.y0}
          if (d.source.y === d.target.y) {
            d.target = {x: d.target.x + nodeRadius + 5, y: d.target.y}
          }
          return diagonal({source: o, target: o})
        })
        .style('marker-end', function (d) {
          return d.source.y === d.target.y ? 'url(#up-arrow)' : ''
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
      outerThis.nodes.forEach(function (d) {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

    // enable creating new edges and nodes
    d3.selectAll('g.node')
      .call(d3.behavior.drag().on('dragstart', dragstart))

    const drag = d3.behavior.drag()
    drag.on('drag', mousemove)
    drag.on('dragend', mouseup)

    d3.selectAll('g.graph')
      .call(drag)

    function mouseup() {

      if (outerThis.isInReadMode() || outerThis.isInInsertMode()) {
        return
      }

      const x = d3.mouse(this)[0]
      const y = d3.mouse(this)[1]

      let newEdge: Edge

      let edgeIsFromOldNodeToOldNode = (mousedown_node && mousedown_node.title) && (mouseup_node && mouseup_node.title)
      let edgeIsFromNewToNewNoe = (mousedown_node && !mousedown_node.title) && (mouseup_node && !mouseup_node.title)
      if (edgeIsFromOldNodeToOldNode || edgeIsFromNewToNewNoe) {
        mousedown_node = null
        mouseup_node = null
        drag_line.attr('class', 'dragline hidden')
        return
      }

      if (!mouseup_node) {
        let newId = newNodeId++
        emptyNodes.push({x: y, y: x, _id: '' + newId})
        const newNode = d3.select('g.graph').selectAll('g.newnode')
          .data(emptyNodes)
          .enter()
          .append('g')
          .attr('class', 'newnode')
          .attr('transform', function (d) {
            return 'translate(' + x + ',' + y + ')'
          })

        newNode.append('text')
          .attr('x', 13)
          .attr('dy', '-.75em')
          .attr('text-anchor', 'start')
          .text(function (d) {
            return d.title || d._id
          })
          .style('fill-opacity', 1)

        const circle = newNode.append('circle')
          .attr('r', nodeRadius)
          .on('click', emptyNodeClick)
          .on('mouseover', nodeMouseOver)
          .on('mouseout', nodeMouseOut)
          .call(d3.behavior.drag().on('dragstart', dragstart))


        newEdge = {bookId: outerThis.bookId, source: mousedown_node._id, target: '' + newId}
      } else {
        newEdge = {bookId: outerThis.bookId, source: mousedown_node._id, target: mouseup_node._id}
      }


      newEdges.push(newEdge)
      outerThis.newEdges.emit(newEdges)
      outerThis.newNodes.emit(emptyNodes)

      drag_line = graph
        .append('path')
        .attr('class', 'dragline hidden')
        .attr('d', 'M0,0L0,0')


      mousedown_node = null

    }

    function nodeMouseOver(d) {
      mouseup_node = d
      let notDraggingLine = !mousedown_node
      let mouseOverStartNode = d === mousedown_node
      if (notDraggingLine || mouseOverStartNode) {
        return
      }
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)')
    }

    function nodeMouseOut(d) {
      mouseup_node = null
      if (!mousedown_node || d === mousedown_node) {
        return
      }
      // unenlarge target node
      d3.select(this).attr('transform', 'scale(1.0)')
    }

    function mousemove() {
      if (!mousedown_node) {
        return
      }

      if (outerThis.isInReadMode()) {
        return
      }
      // update drag line
      const destination = {y: (d3.mouse(this)[0] - 1), x: (d3.mouse(this)[1] - 1)}
      drag_line.attr('d', diagonalLine(mousedown_node, destination))

    }

    function emptyNodeClick(emptyNode) {
      if (outerThis.isInInsertMode()) {
        outerThis.selectedNode.emit(emptyNode)
        d3.selectAll('.newnode')
          .select('circle')
          .attr('r', function (d) {
            if (d === emptyNode) {
              return nodeRadius * 1.5
            } else {
              return nodeRadius
            }
          })
      } else {
        return
      }
    }

    function click(d) {
      if(outerThis.mode==='draw'){
        return
      }
      if (outerThis.canClickOnNode(d._id)) {
        outerThis.router.navigate(['read', d._id])
        outerThis.walkToNode(outerThis.currentChapterId, d._id)
        update(d)
      } else {
        console.log('cant click')
      }
    }

    function dragstart(d) {
      if (outerThis.isInReadMode() || outerThis.isInInsertMode()) {
        return
      }
      mousedown_node = d
      drag_line
        .classed('hidden', false)
        .attr('d', diagonalLine(mousedown_node, mousedown_node))
    }

    function diagonalLine(s, d) {
      return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`
    }
  }

  edgeIsWalked(edge: any) {
    return this.walkedChapterIds.indexOf(edge.target._id) !== -1 && this.walkedChapterIds.indexOf(edge.source._id) !== -1
  }

  setClickableNodeArray() {
    const parentNodeId = this.walkedChapterIds.length > 1 ? this.walkedChapterIds[this.walkedChapterIds.length - 2] : '0'
    // get all nodes that are children or siblings of current chapter
    const clickableNodesIds = (this.links.filter(link => link.source._id === this.currentChapterId || link.source._id === parentNodeId).map(link => link.target._id))
    this.clickableNodeIds = clickableNodesIds
  }

  canClickOnNode(nodeId: string) {
    if (this.walkedChapterIds.length < 2) {
      return true
    }
    return this.clickableNodeIds.indexOf(nodeId) !== -1 || this.walkedChapterIds.indexOf(nodeId) !== -1
  }

  walkToNode(oldNodeId: any, newNodeId: any) {
    if(this.mode === "draw"){
      return
    }
    const existEdge = this.links.findIndex(link => link.source._id === oldNodeId && link.target._id === newNodeId) !== -1
    if (!existEdge && this.walkedChapterIds.length) {
      this.walkedChapterIds.splice(this.walkedChapterIds.length - 1)
      this.walkToNode(this.walkedChapterIds[this.walkedChapterIds.length - 1], newNodeId)
    } else {
      this.walkedChapterIds.push(newNodeId)
      this.saveReadingHistory()
      this.navigatedToNewNode.emit(newNodeId)
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
