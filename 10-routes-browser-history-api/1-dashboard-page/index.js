import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

export default class Page {
  subElements = {};
  components = {};
  defaultFrom = new Date();
  defaultTo = new Date();

  setDefaultRange() {
    const month = this.defaultTo.getMonth();
    this.defaultFrom.setMonth(month - 1);

    if (this.defaultFrom.getMonth() === month) {
      this.defaultFrom.setDate(0);
      this.defaultFrom.setHours(0, 0, 0, 0);
    }
  }

  getTemplate() {
    return `
      <div class="dashboard full-height flex-column">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <div data-element="rangePicker" class="rangepicker"></div>
        </div>
        <div class="dashboard__charts">
          <div data-element="ordersChart" class="column-chart dashboard__chart_orders"></div>
          <div data-element="salesChart" class="column-chart dashboard__chart_sales"></div>
          <div data-element="customersChart" class="column-chart dashboard__chart_customers"></div>
        </div>
        <h3 class="block-title">Best sellers</h3>
        <div data-element="sortableTable" class="sortable-table"></div>
      </div>
`
  }

  initialize() {
    this.components = {
      rangePicker: new RangePicker({ from: this.defaultFrom, to: this.defaultTo }),
      ordersChart: new ColumnChart({
        range: {
          from: this.defaultFrom,
          to: this.defaultTo
        },
        url: 'api/dashboard/orders',
        label: 'orders',
        link: '#',
      }),
      salesChart: new ColumnChart({
        range: {
          from: this.defaultFrom,
          to: this.defaultTo
        },
        url: 'api/dashboard/sales',
        label: 'sales',
        formatHeading: data => `$${data}`
      }),
      customersChart: new ColumnChart({
        range: {
          from: this.defaultFrom,
          to: this.defaultTo
        },
        url: 'api/dashboard/customers',
        label: 'customers',
      }),
      sortableTable: new SortableTable(header, {
        url: 'api/dashboard/bestsellers',
        range: {
          from: this.defaultFrom,
          to: this.defaultTo
        }
      })
    }

    this.renderComponents();
  }

  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;
    this.setDefaultRange();
    this.subElements = this.getSubElements(this.element);
    this.initialize();
    this.attachEventListeners();
    return this.element;
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((accumulator, subElement) => {
      accumulator[subElement.dataset.element] = subElement;
      return accumulator;
    }, {})
  }

  renderComponents() {
    Object.keys(this.components).forEach((component) => {
      const container = this.subElements[component];
      const { element } = this.components[component];
      container.append(element);
    })
  }

  async updateComponents(range) {
    this.components.ordersChart.update(range.detail.from, range.detail.to);
    this.components.salesChart.update(range.detail.from, range.detail.to);
    this.components.customersChart.update(range.detail.from, range.detail.to);
    this.components.sortableTable.sortOnServer({
      from: range.detail.from,
      to: range.detail.to,
    })
  }

  dateSelectHandler = (event) => {
    this.updateComponents(event);
  }

  menuToggleHandler = () => {
    document.body.classList.toggle('is-collapsed-sidebar');
  }

  attachEventListeners() {
    document.addEventListener('date-select', this.dateSelectHandler);
    document.querySelector('.sidebar__toggler')?.addEventListener('pointerdown', this.menuToggleHandler);
  }

  removeListeners() {
    document.removeEventListener('date-select', this.dateSelectHandler);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeListeners();
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
    this.remove();
    this.subElements = {};
  }
}
