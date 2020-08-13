export default class RangePicker {
  element;
  subElements = {};
  calendarDateSelected = {};
  selectFrom = true;

  static formatDate(date) {
    return date.toLocaleString("ru", {dateStyle: 'short'});
  }

  onDocClick = event => {
    const pickerIsOpen = this.element.classList.contains('rangepicker_open');
    const isRangePicker = this.element.contains(event.target);

    if(pickerIsOpen && !isRangePicker) {
      this.closeRangePicker();
    }
  }

  toggleRangePicker() {
    this.element.classList.toggle('rangepicker_open');
    this.renderRangePickerSelector();
  }

  closeRangePicker() {
    this.element.classList.remove('rangepicker_open');
  }

  handleSelectorClick = event => {
    const cell = event.target;
    if(cell.classList.contains('rangepicker__cell')) {
      this.rangePickerCellClickHandle(cell);
    }
  }

  rangePickerCellClickHandle(cell) {
    const { value } = cell.dataset;
    const { from, to} = this.subElements;

    if(value) {
      const dateValue = new Date(value);
      if(this.selectFrom) {
        this.calendarDateSelected.from = dateValue;
        this.calendarDateSelected.to = null;
        this.selectFrom = false;
        this.showHighlighting();
      } else {
        if(dateValue > this.calendarDateSelected.from) {
          this.calendarDateSelected.to = dateValue;
        } else {
          this.calendarDateSelected.from = dateValue;
          this.calendarDateSelected.to = this.calendarDateSelected.from;
        }
        this.selectFrom = true;
        this.showHighlighting();
      }
    }

    if(this.calendarDateSelected.from && this.calendarDateSelected.to) {
      this.closeRangePicker();
      from.innerHTML = RangePicker.formatDate(this.calendarDateSelected.from);
      to.innerHTML = RangePicker.formatDate(this.calendarDateSelected.to);

      this.element.dispatchEvent(new CustomEvent('date-select', {
        bubbles: true,
        detail: this.calendarDateSelected,
      }));
    }
  }

  renderRangePickerSelector = () => {
    const { selector } = this.subElements;
    const date1 = new Date(this.dateFrom);
    const date2 = new Date(this.dateFrom);

    let newDate2;
    if (date2.getMonth() === 11) {
      newDate2 = new Date(date2.getFullYear() + 1, 0, 1);
    } else {
      newDate2 = new Date(date2.getFullYear(), date2.getMonth() + 1, 1);
    }

    selector.innerHTML = `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
      ${this.renderCalendar(date1)}
      ${this.renderCalendar(newDate2)}
    `;

    const leftArrow = selector.querySelector('.rangepicker__selector-control-left');
    const rightArrow = selector.querySelector('.rangepicker__selector-control-right');

    leftArrow.addEventListener('click', () => {
      this.dateFrom.setMonth(this.dateFrom.getMonth() - 1);
      this.renderRangePickerSelector();
    });

    rightArrow.addEventListener('click', () => {
      this.dateFrom.setMonth(this.dateFrom.getMonth() + 1);
      this.renderRangePickerSelector();
    });

    this.showHighlighting();
  }

  renderCalendar(date) {
    const startDate = new Date(date);
    const monthOptions = { month: 'long' };
    const currentMonth = startDate.toLocaleDateString("ru-RU", monthOptions);

    // set the current date to the first day of the month
    startDate.setDate(1);

    let innerHtml = `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="${currentMonth}">${currentMonth}</time>
        </div>
        <div class="rangepicker__day-of-week">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div>Сб</div>
          <div>Вс</div>
        </div>
        <div class="rangepicker__date-grid">
    `;

    const getCorrectIndex = index => {
      const correctIndex = index === 0 ? 7 : index;
      return correctIndex;
    }

    innerHtml += `
      <button type="button" class="rangepicker__cell"
      data-value="${startDate.toISOString()}"
      style="--start-from: ${getCorrectIndex(startDate.getDay())}">${startDate.getDate()}</button>
    `;

    startDate.setDate(2);

    const getDaysInMonth = function (month, year) {
      return new Date(year, month+1, 0).getDate();
    }

    const numberOfDays = getDaysInMonth(startDate.getMonth(), startDate.getFullYear());

    for(let i = startDate.getDate(); i <= numberOfDays; i++) {
      innerHtml += `
        <button type="button" class="rangepicker__cell"
        data-value="${startDate.toISOString()}">${startDate.getDate()}</button>
      `;
      startDate.setDate(startDate.getDate() + 1);
    }

    innerHtml += `</div></div>`;

    return innerHtml;
  }

  showHighlighting() {
    const { from, to } = this.calendarDateSelected;
    const { selector } = this.subElements;
    const cells =  selector.querySelectorAll('.rangepicker__cell');

    for(const cell of cells) {
      const { value } = cell.dataset;
      const cellDate = new Date(value);

      cell.classList.remove('rangepicker__selected-from');
      cell.classList.remove('rangepicker__selected-between');
      cell.classList.remove('rangepicker__selected-to');

      if(from && value === from.toISOString()) {
        cell.classList.add('rangepicker__selected-from');
      } else if(to && value === to.toISOString()) {
        cell.classList.add('rangepicker__selected-to');
      } else if(from && to && cellDate >= from && cellDate <= to) {
        cell.classList.add('rangepicker__selected-between');
      }
    }
  }

  constructor({ from = new Date(), to = new Date()} = {}) {
    this.dateFrom = new Date(from);
    this.calendarDateSelected.from = from;
    this.calendarDateSelected.to = to;
    this.render();
  }

  get template() {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from">${RangePicker.formatDate(this.calendarDateSelected.from)}</span> -
          <span data-element="to">${RangePicker.formatDate(this.calendarDateSelected.to)}</span>
        </div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `;
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.prepareSubElements(this.element);
    this.initEventListeners();
  }

  initEventListeners() {
    const { input, selector } = this.subElements;
    document.addEventListener('click', this.onDocClick, true);
    input.addEventListener('click', () => this.toggleRangePicker());
    selector.addEventListener('click', this.handleSelectorClick);
  }

  prepareSubElements(element) {
    for(const subElement of element.querySelectorAll('[data-element]')) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
