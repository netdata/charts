export default {
  id: "system.cpu",
  title: "Total CPU utilization (system.cpu)",
  context: "system.cpu",
  units: "percentage",
  dimensions: [
    { id: "guest", name: "guest" },
    { id: "nice", name: "nice" },
    { id: "iowait", name: "iowait" },
    { id: "system", name: "system" },
    { id: "guest_nice", name: "guest_nice" },
    { id: "steal", name: "steal" },
    { id: "softirq", name: "softirq" },
    { id: "irq", name: "irq" },
    { id: "user", name: "user" },
  ],
}
