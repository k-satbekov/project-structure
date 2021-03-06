import fetchJson from '../../utils/fetch-json.js';

import SortableList from '../../components/sortable-list';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class Page {
  element;
  subElements = {};
  components = {};

  get template() {
    return `<div class="categories">
        <div class="content__top-panel">
          <h1 class="page-title">Категории товаров</h1>
        </div>
        <div data-element="categoriesContainer">
        </div>
      </div>`;
  }

  getCategoryRow(category, index) {
    let someData = '';
    someData += `
        <div class="category category_open" data-id="${category.id}">
          <header class="category__header">${category.title}</header>
          <div class="category__body">
            <div class="subcategory-list" data-element="sub-list${index}">
            </div>
          </div>
        </div>
      `;
    return someData;
  }

  renderSingleListElement(category, index) {
    const subcategoryData = [];

    for(const subcategory of category.subcategories) {
      subcategoryData.push({"title":subcategory.title, "count":subcategory.count, "id":subcategory.id});
    }

    const list = new SortableList({
      items: subcategoryData.map(item => {
        const element = document.createElement('li');

        element.innerHTML = `
        <strong>${item.title}</strong>
        <span><b>${item.count}</b> products</span>
      `;

        element.classList.add('categories__sortable-list-item');
        element.setAttribute('data-grab-handle','');
        element.setAttribute('data-id', `${item.id}`);
        element.setAttribute('style','');
        return element;
      })
    });

    const str = `sub-list${index}`;
    this.components[str] = list;

    // const { categoriesContainer } = this.subElements;
    // const subL = categoriesContainer.querySelector(`[data-element="sub-list${index}"]`);
    //
    // subL.append(list.element);
  }

  async loadCategories() {
    return await fetchJson(`${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`);
  }

  renderSortableList() {
    const { categoriesContainer } = this.subElements;

    for(let i = 0; i < this.categories.length; i++) {
      const category = this.categories[i];
      categoriesContainer.innerHTML += this.getCategoryRow(category, i);
      this.renderSingleListElement(category, i);
    }

    this.prepareSubElements(this.element);
    this.renderComponents();
  }

  renderComponents () {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];

      root.append(element);
    });
  }

  async render() {
    const mainElement = document.createElement('div');
    mainElement.innerHTML = this.template;
    this.element = mainElement.firstElementChild;
    this.prepareSubElements(this.element);

    const categoriesData = await this.loadCategories();
    this.categories = categoriesData;
    this.renderSortableList();

    return this.element;
  }

  prepareSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    for(const subElement of elements) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }
}
