export default class SortableList {
  element;
  currentDraggingItem;
  placeHolderElement;
  currentItemIndex;

  mouseOffset = {
    x: 0,
    y: 0,
  };

  pointerDownHandler = (event) => {
    const currentItem = event.target.closest('.sortable-list__item');

    if(currentItem) {
      if (event.target.closest('[data-grab-handle]')) {
        event.preventDefault();
        this.dragListItem(currentItem, event);
      }
      if (event.target.closest('[data-delete-handle]')) {
        event.preventDefault();
        currentItem.remove();
      }
    }
  }

  pointerMoveHandler = (event) => {
    event.preventDefault();

    const { clientX, clientY } = event;
    this.moveCurrentItem(clientX, clientY);

    const { firstElementChild, children } = this.element;

    if(clientY < firstElementChild.getBoundingClientRect().top) {
      this.rearrangePlaceHolder(0);
    } else if(clientY > this.element.getBoundingClientRect().bottom) {
      this.rearrangePlaceHolder(children.length);
    } else {
      for(const [index, child] of Array.from(this.element.children).entries()) {
        const {offsetHeight: height} = child;
        const {top, bottom} = child.getBoundingClientRect();
        if (child !== this.currentDraggingItem && child !== this.placeHolderElement) {
          // current dragging item's index is greater than child's index
          if (clientY > top && clientY < bottom) {
            if (clientY < bottom - (height / 2)) {
              this.rearrangePlaceHolder(index);
              break;
            }
          }
          // current dragging item's index is less than child's index
          if (clientY > top && clientY < bottom) {
            if (clientY > top + (height / 2)) {
              this.rearrangePlaceHolder(index + 1);
              break;
            }
          }
        }
      }
    }
  }

  pointerUpHandler = () => {
    this.stopDragListItem();
  }

  dragListItem(listItem, event) {
    const { x, y } = listItem.getBoundingClientRect();
    const {clientX, clientY } = event;

    this.mouseOffset = {
      x: clientX - x,
      y: clientY - y,
    };

    listItem.style.width = `${listItem.offsetWidth}px`;
    listItem.style.height = `${listItem.offsetHeight}px`;
    listItem.classList.add('sortable-list__item_dragging');

    this.initPlaceHolder(listItem.style.width, listItem.style.height);
    this.currentDraggingItem = listItem;
    this.element.insertBefore(this.placeHolderElement, listItem);
    this.currentItemIndex = Array.from(this.element.children).indexOf(listItem);

    this.moveCurrentItem(clientX, clientY);

    document.addEventListener('pointermove', this.pointerMoveHandler);
    document.addEventListener('pointerup', this.pointerUpHandler);
  }

  stopDragListItem() {
    this.currentDraggingItem.classList.remove('sortable-list__item_dragging');
    this.placeHolderElement.replaceWith(this.currentDraggingItem);

    this.currentDraggingItem.style.left = '';
    this.currentDraggingItem.style.top = '';

    this.currentDraggingItem = null;
    this.removeEventListeners();
  }

  moveCurrentItem(x, y) {
    this.currentDraggingItem.style.left = `${x - this.mouseOffset.x}px`;
    this.currentDraggingItem.style.top = `${y - this.mouseOffset.y}px`;
  }

  initPlaceHolder(width, height) {
    this.placeHolderElement = document.createElement('li');
    this.placeHolderElement.classList.add('sortable-list__placeholder');
    this.placeHolderElement.style.width = width;
    this.placeHolderElement.style.height = height;
  }

  rearrangePlaceHolder(index) {
    const child = this.element.children[index];
    if(child !== this.placeHolderElement) {
      this.element.insertBefore(this.placeHolderElement, child);
    }
  }

  constructor({items: listData = []} = {}) {
    this.listData = listData;
    this.render();
    this.initEventListeners();
  }

  initEventListeners() {
    this.element.addEventListener('pointerdown', this.pointerDownHandler);
  }

  render() {
    const mainListElement = document.createElement('ul');
    mainListElement.classList.add('sortable-list');
    this.element = mainListElement;

    this.listData.forEach(listItem => {
      this.addListItem(listItem);
    });
  }

  addListItem(listItem) {
    listItem.classList.add('sortable-list__item');
    listItem.ondragstart = () => false;
    this.element.append(listItem);
  }

  removeEventListeners() {
    document.removeEventListener('pointerdown', this.pointerDownHandler);
    document.removeEventListener('pointermove', this.pointerMoveHandler);
    document.removeEventListener('pointerup', this.pointerUpHandler);
  }

  remove() {
    this.element.remove();
    this.removeEventListeners();
  }

  destroy() {
    this.remove();
  }
}
