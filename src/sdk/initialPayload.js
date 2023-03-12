export default {
  api: 2,
  db: {
    update_every: 1,
    first_entry: null,
    last_entry: null,
  },
  result: {
    labels: [],
    data: [],
    tree: {},
  },
  min: null,
  max: null,
  timings: {
    prep_ms: 0,
    query_ms: 0,
    group_by_ms: 0,
    output_ms: 0,
    total_ms: 0,
  },
}
