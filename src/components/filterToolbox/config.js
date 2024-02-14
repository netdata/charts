import React, { useRef, useState } from "react"
import {
  Flex,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
} from "@netdata/netdata-ui"
import { useChart } from "@/components/provider/selectors"
import Label from "./label"
import FullFilters from "."

const tooltipProps = {
  heading: "Show/hide filters and aggregations",
}

const ShowPostAggregations = ({ labelProps }) => {
  const [isOpen, setOpen] = useState(false)
  const chart = useChart()
  const ref = useRef()
  const onClose = () => setOpen(false)

  return (
    <Flex>
      <Label
        ref={ref}
        {...labelProps}
        onClick={() => setOpen(prev => !prev)}
        data-track={chart.track("showConfig")}
        tooltipProps={tooltipProps}
        title={tooltipProps.heading}
      />
      {isOpen && (
        <Modal onClickOutside={onClose} onEsc={onClose} backdropProps={{ backdropBlur: true }}>
          <ModalContent>
            <ModalHeader>
              Chart configuration
              <ModalCloseButton testId="close-button" onClick={onClose} />
            </ModalHeader>
            <ModalBody>
              <Flex width={80} padding={[3]}>
                <FullFilters border={false} />
              </Flex>
            </ModalBody>
            <ModalFooter>
              <Button neutral label="Close" onClick={onClose} />
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Flex>
  )
}

export default ShowPostAggregations
