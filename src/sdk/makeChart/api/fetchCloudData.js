import { buildDataRequest } from "../../dataQuery/request"
import { fetchDataRequest } from "../../dataQuery/transport"
import { getChartDataRequestAttributes } from "./helpers"

export default (chart, { attrs, ...options } = {}) => {
  const request = buildDataRequest({
    ...getChartDataRequestAttributes(chart, attrs),
    agent: false,
  })

  return fetchDataRequest(request, options, {
    rejectHttpErrors: false,
    wrapJsonErrors: false,
  })
}
