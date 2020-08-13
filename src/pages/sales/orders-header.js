const header = [
  {
    id: 'id',
    title: 'ID',
    sortable: true,
    sortType: 'number'
  },
  {
    id: 'user',
    title: 'Клиент',
    sortable: true,
    sortType: 'string'
  },
  {
    id: 'createdAt',
    title: 'Дата',
    sortable: true,
    sortType: 'custom',
    sort: (a, b) => new Date(a) - new Date(b),
    template: data => {
      return `<div class="sortable-table__cell">
          ${new Date(data).toLocaleString('default', {dateStyle: 'medium'})}
        </div>`;
    }
  },
  {
    id: 'totalCost',
    title: 'Стоимость',
    sortable: true,
    sortType: 'number',
    template: data => {
      return `<div class="sortable-table__cell">
          $${data}
        </div>`;
    }
  },
  {
    id: 'delivery',
    title: 'Статус',
    sortable: false,
  },
];

export default header;

// function formatDate(data) {
//   const date = new Date(data);
//
//   const formattedDate = date.getDate();
//   const month = date.getMonth();
//   const year = date.getFullYear();
//
//   const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
//     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//   ];
//
//   const dateStr = formattedDate + " " + monthNames[month] + ", " + year;
//
//   return dateStr;
// }
