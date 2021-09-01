export default payload => {
  const {
    update_every,
    view_update_every,
    first_entry,
    last_entry,
    dimension_names,
    dimension_ids,
    latest_values,
    view_latest_values,
    result,
    ...rest
  } = payload

  const { labels, data, post_aggregated_data } = result

  return {
    updateEvery: update_every,
    viewUpdateEvery: view_update_every,
    firstEntry: first_entry,
    lastEntry: last_entry,
    dimensionNames: dimension_names,
    dimensionIds: dimension_ids,
    latestValues: latest_values,
    viewLatestValues: view_latest_values,
    result: {
      labels,
      data,
      postAggregatedData: post_aggregated_data,
    },
    ...rest,
  }
}
