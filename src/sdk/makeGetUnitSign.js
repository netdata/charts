const unitMap = {
  "active connections": "a-con",
  arrays: "arrays",
  bytes: "bytes",
  "bytes/s": "b/s",
  "calls/s": "c/s",
  Celsius: "cels",
  charts: "charts",
  "connected clients": "con-c",
  "connections/s": "c/s",
  containers: "cont",
  "context switches/s": "co-sw",
  dBm: "dBm",
  descriptors: "descr",
  difference: "dif",
  "drops/s": "d/s",
  entropy: "entr",
  "errors/s": "err/s",
  events: "events",
  "events/s": "e/s",
  "faults/s": "f/s",
  "files/s": "f/s",
  "frames/s": "f/s",
  GiB: "GiB",
  "gigabits/s": "gb/s",
  inodes: "inodes",
  "interrupts/s": "i/s",
  KiB: "KiB",
  "KiB/operation": "Kib/op",
  "KiB/s": "KiB/s",
  "kilobits/s": "kb/s",
  load: "load",
  "merged operations/s": "m-o/s",
  "messages/s": "m/s",
  metrics: "metrics",
  MHz: "MHz",
  MiB: "MiB",
  "MiB/s": "MiB/s",
  "megabits/s": "mb/s",
  "microseconds lost/s": "µs l/s",
  milliseconds: "ms",
  "milliseconds/operation": "ms/o",
  "milliseconds/request": "ms/r",
  "milliseconds/run": "ms/run",
  "milliseconds/s": "ms/s",
  ms: "ms",
  "% of time working": "%time",
  "open files": "o-f",
  "open pipes": "o-p",
  "open sockets": "o-s",
  "operations/s": "ops/s",
  "packets/s": "p/s",
  "page faults/s": "p-f/s",
  pages: "pages",
  percentage: "%",
  processes: "prc",
  "processes/s": "prc/s",
  "reads/s": "read/s",
  "reports/s": "rep/s",
  "requests/s": "req/s",
  "Rotations/min": "rot/min",
  seconds: "secs",
  segments: "segm",
  semaphores: "semph",
  sockets: "socket",
  "softirqs/s": "s-irq/s",
  state: "state",
  status: "status",
  threads: "thr",
  value: "value",
  Volts: "V",
  Watt: "W",
}

// first second -> f-s
// first -> first
// firstly -> firstl

const getUnit = unit => {
  if (unit.length < 6) return unit.toLowerCase()

  const words = unit.match(/ ./gi)

  const value = words ? [unit[0], ...words.map(w => w[1])].join("-") : unit

  return value.toLowerCase().substring(0, 6)
}

export default node => () => {
  const units = node.getUnits()
  return unitMap[units] || getUnit(units)
}
