import React, {Component, PropTypes} from 'react'
import {VirtualScroll, AutoSizer} from 'react-virtualized'
import 'react-virtualized/styles.css'

const Checkbox = ({onChange, checked, label, style}) => (
  <label style={style}>
    <input
      type='checkbox'
      value={label}
      onChange={() => onChange()}
      checked={checked || false}
    />
  {label}
  </label>
  )

class VirtualizedCheckbox extends Component {

  static propTypes = {
    labelKey: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
    rowHeight: PropTypes.number.isRequired,
    textFilter: PropTypes.string,
    valueKey: PropTypes.string.isRequired
  }

  static defaultProps = {
    labelKey: 'label',
    onCancel: () => null,
    onOk: () => null,
    items: [],
    rowHeight: 30,
    textFilter: '',
    valueKey: 'value'
  }

  constructor (props) {
    super(props)
    const {items, labelKey, valueKey, textFilter} = props

    let allBox = {}
    allBox[valueKey] = '#ALL#'
    allBox[labelKey] = '(Select all)'

    const objectOptions = typeof (items[0]) === 'string'
      ? items.map(item => ({[labelKey]: item, [valueKey]: item}))
      : items
    const _boxes = [allBox, ...this.getDistinctFast(objectOptions, labelKey)]
    const boxes = this.applyTextFilter(textFilter, _boxes, labelKey)

    this.state = {
      boxes,
      textFilter
    }

    boxes[0].checked = this.checkedCounter === boxes.length - 1

    this._checkboxRenderer = this._checkboxRenderer.bind(this)
    this.onTextFilterChange = this.onTextFilterChange.bind(this)
  }

  getDistinctFast (items, labelKey) {
    let unique = {}
    let distinct = []
    for (let opt of items) {
      if (typeof (unique[opt[labelKey]]) === 'undefined') {
        distinct.push(opt)
      }
      unique[opt[labelKey]] = 0
    }
    return distinct
  }

  onChange (box) {
    const {valueKey, labelKey} = this.props
    const {boxes} = this.state
    if (box[valueKey] === '#ALL#') {
      if (this.checkedAll) {
        const newBoxes = boxes.map(box => ({...box, checked: false}))
        this.setState({
          boxes: newBoxes
        })
      } else {
        const newBoxes = boxes.map(box => ({...box, checked: true}))
        this.setState({
          boxes: newBoxes
        })
      }
    } else {
      const newBoxes = boxes.map(bx => bx[labelKey] === box[labelKey] ? {...box, checked: !box.checked} : bx)
      const newCheckedCounter = box.checked ? this.checkedCounter - 1 : this.checkedCounter + 1
      if (this.checkedAll) {
        newBoxes[0].checked = false
      } else if (newCheckedCounter === boxes.length - 1) {
        newBoxes[0].checked = true
      }
      this.setState({
        boxes: newBoxes
      })
    }
  }

  onTextFilterChange (event) {
    const {labelKey} = this.props
    const {boxes} = this.state
    const textFilter = event.target.value
    const filteredBoxes = this.applyTextFilter(textFilter, boxes, labelKey)
    this.setState({textFilter, boxes: filteredBoxes})
  }

  applyTextFilter (value, boxes, labelKey) {
    const textFilter = value.toLowerCase()
    const filteredBoxes = boxes.map(box =>
      box[labelKey].toLowerCase().startsWith(textFilter) ? {...box, filtered: true} : {...box, filtered: false}
    )
    if (textFilter) {
      filteredBoxes[0] = {...filteredBoxes[0], filtered: false}
    } else {
      filteredBoxes[0] = {...filteredBoxes[0], filtered: true}
    }
    return filteredBoxes
  }

  get checkedBoxes () {
    const {labelKey} = this.props
    const {boxes} = this.state
    if (this.checkedAll) {
      return boxes.slice(1).map(box => box[labelKey])
    } else {
      return boxes.slice(1)
        .filter(box => box.filtered)
        .filter(box => box.checked)
        .map(box => box[labelKey])
    }
  }

  get checkedAll () {
    const {boxes, textFilter} = this.state
    return boxes[0].checked && !textFilter
  }

  get checkedCounter () {
    const {boxes} = this.state
    return boxes
      .filter(box => box.filtered)
      .filter(box => box.checked)
      .length
  }

  render () {
    // console.log(this)
    const {rowHeight} = this.props
    const {boxes, textFilter} = this.state
    const filteredBoxes = boxes.filter(box => box.filtered)
    return (
      <AutoSizer>
          {({width, height}) =>
            <div>
              <div style={{height: rowHeight}}>
                <input
                  type='text'
                  id='filter'
                  placeholder='Filter boxes'
                  value={textFilter}
                  onChange={this.onTextFilterChange}
                />
              </div>
              <VirtualScroll
                height={height - 2 * rowHeight}
                width={width}
                rowCount={filteredBoxes.length}
                rowHeight={rowHeight}
                rowRenderer={this._checkboxRenderer}
                boxes={filteredBoxes}
                {...this.props}
              />
              <div style={{display: 'flex', width, height: rowHeight}}>
                <input type='button' value='Ok' onClick={() => this.props.onOk(this.checkedAll, this.checkedBoxes)} />
                <input type='button' value='Cancel' onClick={() => this.props.onCancel()} />
              </div>
            </div>
          }
      </AutoSizer>
    )
  }

  _checkboxRenderer ({index, isScrolling}) {
    const {valueKey, labelKey} = this.props
    const {boxes} = this.state
    let box = boxes.filter(box => box.filtered)[index]
    if (box[valueKey] === '#ALL#') { box = {...box, style: {color: 'black'}} }
    return <Checkbox key={box[labelKey]} onChange={() => this.onChange(box)} label={box[labelKey]} {...box} />
  }
}

export default VirtualizedCheckbox
