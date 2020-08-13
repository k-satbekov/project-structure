const BACKEND_URL = 'https://course-js.javascript.ru';

import RangePicker from '../../components/range-picker';
import SortableTable from '../../components/sortable-table';
import header from '../sales/orders-header';
import fetchJson from '../../utils/fetch-json';

export default class Page {
  element;
  subElements = {};
  components = {};

  get template() {
    return `
      <div class="sales full-height flex-column">
        <div class="content__top-panel">
          <h1 class="page-title">Продажи</h1>
          <div class="rangepicker" data-element="rangePicker">
          </div>
        </div>
        <div data-element="ordersContainer" class="full-height flex-column">
          <div class="sortable-table" data-element="sortableTable">
          </div>
        </div>
    `;
  }

  initComponents() {
    const to = new Date();
    const from = new Date(to.getTime() - (30 * 24 * 60 * 60 * 1000));

    const rangePicker = new RangePicker({
      from,
      to
    });

    const sortableTable = new SortableTable(header, {
      url: `api/rest/orders?&createdAt_gte=${from.toISOString()}&createdAt_lte=${to.toISOString()}&_sort=createdAt&_order=desc&_start=0&_end=30`,
      isSortLocally: false,
      isSales: true
    });

    this.components.rangePicker = rangePicker;
    this.components.sortableTable = sortableTable;
  }

  async updateTableComponent (from, to) {
    const data = await fetchJson(`${BACKEND_URL}/api/rest/orders?&createdAt_gte=${from.toISOString()}&createdAt_lte=${to.toISOString()}&_sort=createdAt&_order=desc&_start=0&_end=30`);

    this.components.sortableTable.loadRowsWithServerData(data, undefined, from, to);
  }

  async render() {
    const mainElement = document.createElement('div');
    mainElement.innerHTML = this.template;
    this.element = mainElement.firstElementChild;
    this.prepareSubElements(this.element);

    this.initComponents();
    this.prepareSubElements(this.element);
    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  renderComponents () {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];

      root.append(element);
    });
  }

  initEventListeners () {
    this.components.rangePicker.element.addEventListener('date-select', event => {
      const { from, to } = event.detail;
      this.updateTableComponent(from, to);
    });
  }

  prepareSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    for(const subElement of elements) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }
}
