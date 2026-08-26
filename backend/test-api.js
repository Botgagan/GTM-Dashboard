const { submitEventToCohortApi } = require('./src/apiClient');
const payload = {
  title: "Test Multi-day Event",
  date: "2026-09-01",
  endDate: "2026-09-05",
  startTime: "10:00:00",
  description: "Test event spanning multiple days",
  location: "Online",
  price: "100",
  ticketVariants: JSON.stringify([{"name":"General","price":100,"quantity":100}]),
  frequency: "none"
};
submitEventToCohortApi(payload).then(console.log).catch(console.error);
