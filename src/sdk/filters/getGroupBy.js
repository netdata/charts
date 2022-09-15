const byChartDefaultGroupBy = {
  "postgres.db_transactions_rate": "database",
  "postgres.db_connections_utilization": "database",
  "postgres.db_connections_count": "database",
  "postgres.db_cache_io_ratio": "database",
  "postgres.db_io_rate": "database",
  "postgres.db_ops_fetched_rows_ratio": "database",
  "postgres.db_ops_read_rows_rate": "database",
  "postgres.db_ops_write_rows_rate": "database",
  "postgres.db_conflicts_rate": "database",
  "postgres.db_conflicts_reason_rate": "database",
  "postgres.db_deadlocks_rate": "database",
  "postgres.db_locks_held_count": "database",
  "postgres.db_locks_awaited_count": "database",
  "postgres.db_temp_files_created_rate": "database",
  "postgres.db_temp_files_io_rate": "database",
  "postgres.db_size": "database",
}

const getDefaultGroupBy = chart => {
  const chartId = chart.getAttribute("id")

  if (chart.getAttribute("groupBy")) return chart.getAttribute("groupBy")
  if (chartId in byChartDefaultGroupBy) return byChartDefaultGroupBy[chartId]
  return "dimension"
}

export default getDefaultGroupBy
