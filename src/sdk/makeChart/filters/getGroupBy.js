const groupByLabelByContext = {
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
  "httpcheck.in_state": "_collect_job",
  "httpcheck.status": "_collect_job",
  "httpcheck.response_length": "_collect_job",
  "httpcheck.response_time": "_collect_job",
  "nvme.device_estimated_endurance_perc": "device",
  "nvme.device_available_spare_perc": "device",
  "nvme.device_composite_temperature": "device",
  "nvme.device_power_cycles_count": "device",
  "nvme.device_power_on_time": "device",
  "nvme.device_unsafe_shutdowns_count": "device",
  "nvme.device_media_errors_rate": "device",
  "nvme.device_error_log_entries_rate": "device",
  "nvme.device_warning_composite_temperature_time": "device",
  "nvme.device_critical_composite_temperature_time": "device",
  "nvme.device_thermal_mgmt_temp1_transitions_rate": "device",
  "nvme.device_thermal_mgmt_temp2_transitions_rate": "device",
  "nvme.device_thermal_mgmt_temp1_time": "device",
  "nvme.device_thermal_mgmt_temp2_time": "device",
}

const getGroupBy = chart => {
  const contexts = chart.getAttribute("contextScope")
  const groupByLabel = chart.getAttribute("groupByLabel")
  const groupBy = chart.getAttribute("groupBy")

  return [
    groupBy.length ? groupBy : ["dimension"],
    groupBy.length
      ? []
      : groupByLabel.length
      ? groupByLabel
      : groupByLabelByContext[contexts[0]]
      ? [groupByLabelByContext[contexts[0]]]
      : [],
  ]
}

export default getGroupBy
