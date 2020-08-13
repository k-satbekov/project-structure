import fetchJson from "../../utils/fetch-json.js";

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  element;
  subElements = {};
  headerConfig = [];
  data = [];
  isSales;

  step = 20;
  start = 1;
  end = this.start + this.step;

  constructor(headerConfig, {url = '', step = 20, start = 1, end = start + step, sortingLocally = false,
    defaultSorting = {id: headerConfig.find(item => item.sortable).id, order: 'asc'}, isSales = false} = {}) {
    this.headerConfig = headerConfig;
    this.defaultSorting = defaultSorting;
    this.url = new URL(url, BACKEND_URL);
    this.step = step;
    this.start = start;
    this.end = end;
    this.sortingLocally = sortingLocally;
    this.isSales = isSales;
    this.render();
  }

  getTable() {
    return `
      <div class="sortable-table">
        ${this.getTableHeader()}
        ${this.getTableBody(this.data)}
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          No products
        </div>
      </div>
    `;
  }

  getTableHeader() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerConfig.map(item => this.getHeaderRow(item)).join('')}
      </div>
    `;
  }

  getHeaderRow({id, title, sortable}) {
    const order = this.defaultSorting.id === id ? this.defaultSorting.order : 'asc';

    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="${order}">
        <span>${title}</span>
        ${this.getHeaderSortingArrow(id)}
      </div>
    `;
  }

  getHeaderSortingArrow(id) {
    const isOrder = this.defaultSorting.id === id ? this.defaultSorting.order : '';
    return isOrder ?
      `<span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>` : '';
  }

  getTableBody(data) {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.getTableRows(data)}
      </div>
    `;
  }

  getTableRows(data) {
    return data.map(item => `
      <div class="sortable-table__row">
        ${this.getTableRow(item, data)}
      </div>`
    ).join('');
  }

  getTableRow(item) {
    const cells = this.headerConfig.map(({id, template}) => {
      return {
        id,
        template
      };
    });

    return cells.map(({id, template}) => {
      return template
        ? template(item[id])
        : `<div class="sortable-table__cell">${item[id]}</div>`;
    }).join('');
  }

  async loadProductsData(id, order, start = this.start, end = this.end) {
    if(!this.isSales) {
      this.url.searchParams.set('_sort', id);
      this.url.searchParams.set('_order', order);
      this.url.searchParams.set('_start', start);
      this.url.searchParams.set('_end', end);
    }

    this.element.classList.add('sortable-table_loading');

    const tableProductsData = await fetchJson(this.url);

    this.element.classList.remove('sortable-table_loading');

    return tableProductsData;
  }

  async render() {
    const { id, order } = this.defaultSorting;
    const element = document.createElement('div');

    element.innerHTML = this.getTable();
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(element);

    const data = await this.loadProductsData(id, order, this.start, this.end);
    this.loadRowsWithServerData(data);

    this.addEventListeners();
  }

  onWindowScroll = async () => {
    const { bottom } = this.element.getBoundingClientRect();
    const { id, order } = this.defaultSorting;

    if (bottom < document.documentElement.clientHeight && !this.loading) {
      this.start = this.end;
      this.end = this.start + this.step;
      this.loading = true;

      if(this.isSales) {
        const data = await fetchJson(`${BACKEND_URL}/api/rest/orders?&createdAt_gte=${this.fromSalesDate.toISOString()}&createdAt_lte=${this.toSalesDate.toISOString()}&_sort=createdAt&_order=desc&_start=${this.start}&_end=${this.end}`);
        this.addAdditionalRows(data);

        this.loading = false;
      } else {
        const data = await this.loadProductsData(id, order, this.start, this.end);
        this.addAdditionalRows(data);

        this.loading = false;
      }

    }
  };

  addAdditionalRows(data) {
    const rows = document.createElement('div');

    this.data = [...this.data, ...data];
    rows.innerHTML = this.getTableRows(data);

    this.subElements.body.append(...rows.childNodes);
  }

  async addEventListeners() {
    const columnRows = this.element.querySelectorAll('[data-sortable="true"]');

    columnRows.forEach(columnItem => {
      let eventTriggered = false;

      columnItem.addEventListener('pointerdown', () => {
        const arrow = columnItem.querySelector('.sortable-table__sort-arrow');

        if(!arrow) {
          columnItem.append(this.subElements.arrow);
          columnItem.dataset.order = 'desc';
          this.sortOnServer(columnItem.dataset.id, columnItem.dataset.order, 1, 1 + this.step, columnItem);
          eventTriggered = true;
        } else {
          columnItem.dataset.order = eventTriggered === false ? 'desc' : 'asc';
          this.sortOnServer(columnItem.dataset.id, columnItem.dataset.order, 1, 1 + this.step, columnItem);
          eventTriggered = !eventTriggered;
        }

      });
    });

    document.addEventListener('scroll', this.onWindowScroll);
  }

  async sortOnServer(itemId, itemOrder, start, end, item) {
    const data = await this.loadProductsData(itemId, itemOrder, start, end);

    this.loadRowsWithServerData(data, item);
  }

  loadRowsWithServerData(data, item = null, from = null, to = null) {
    if(data.length) {
      const { body } = this.subElements;

      if(item) {
        const { id, order } = item.dataset;
        this.element.classList.remove('sortable-table_empty');
        this.data = data;
        const sorted = this.sortByColumnTitle(id, order);
        body.innerHTML = this.getTableRows(sorted);
      } else {
        this.element.classList.remove('sortable-table_empty');
        this.data = data;

        this.fromSalesDate = from;
        this.toSalesDate = to;

        // console.log('fetched data: ' + this.data);

        body.innerHTML = this.getTableRows(data);
      }

    } else {
      this.element.classList.add('sortable-table_empty');
    }
  }

  sortByColumnTitle(field, order) {
    const fetchedData = [...this.data];
    const column = this.headerConfig.find(item => item.id === field);
    const { sortType, customSorting } = column;

    return fetchedData.sort((a, b) => {
      switch(sortType) {
      case 'string':
        if(order === 'asc') {
          return a[field].localeCompare(b[field], 'ru-RU', {caseFirst: 'upper'});
        }
        return b[field].localeCompare(a[field], 'ru-RU', {caseFirst: 'upper'});
      case 'number':
        if(order === 'asc') {
          return a[field] - b[field];
        }
        return b[field] - a[field];
      case 'custom':
        if(order === 'asc') {
          return customSorting(a, b);
        }
        return customSorting(b, a);
      }
    });
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;
      return accum;
    }, {});

  }

  removeListeners() {
    document.removeEventListener('scroll', this.onWindowScroll);
    const { loading } = this.subElements;
    loading.removeAttribute('data-element');
    loading.classList.remove('loading-line');
    loading.classList.remove('sortable-table__loading-line');
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.subElements = {};
  }

}
