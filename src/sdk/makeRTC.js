export default sdk => {
  let rtcConnection
  let baseChannel
  let receiveChannel

  const createConnection = () => {
    const servers = null
    rtcConnection = new RTCPeerConnection(servers)

    console.log("Created local peer connection object rtcConnection")

    baseChannel = rtcConnection.createDataChannel("base")

    baseChannel.onopen = onChannelOpen
    baseChannel.onclose = onChannelClose
    baseChannel.onmessage = event => {
      console.log(event.data)
    }

    // rtcConnection.onicegatheringstatechange = () => {
    //   if (rtcConnection.iceGatheringState !== "complete") return

    //   rtcConnection.createOffer().then(gotLocalOfferWithCandidates, onCreateSessionDescriptionError)
    // }

    rtcConnection.ondatachannel = channelCallback

    rtcConnection.onconnectionstatechange = () => {
      if (!rtcConnection) return

      switch (rtcConnection.connectionState) {
        case "new":
        case "checking":
          console.log("Connection Connecting…")
          break
        case "connected":
          console.log("Connection Online")
          break
        case "disconnected":
          console.log("Connection Disconnecting…")
          createConnection()
          break
        case "closed":
          console.log("Connection Offline")
          break
        case "failed":
          console.log("Connection Error")
          break
        default:
          console.log("Connection Unknown")
          break
      }
    }

    rtcConnection.createOffer().then(gotLocalOfferWithCandidates, onCreateSessionDescriptionError)
  }

  const onCreateSessionDescriptionError = error => {
    console.log("Failed to create session description: " + error.toString())
  }

  const sendData = data => {
    baseChannel.send(data)
    console.log("Sent Data: " + data)
  }

  const closeDataChannels = () => {
    console.log("Closing data channels")
    baseChannel.close()
    console.log("Closed data channel with label: " + baseChannel.label)
    receiveChannel.close()
    console.log("Closed data channel with label: " + receiveChannel.label)
    rtcConnection.close()
    rtcConnection = null
    console.log("Closed peer connections")
  }

  const gotLocalOfferWithCandidates = desc => {
    rtcConnection.setLocalDescription(desc)

    const url = `${sdk.getRoot().getAttribute("host")}/rtc_offer`

    fetch(url, {
      method: "POST",
      body: desc.sdp,
    })
      .then(response => response.json())
      .then(({ sdp, candidates }) => {
        rtcConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }))

        candidates.forEach(candidate => {
          rtcConnection
            .addIceCandidate(new RTCIceCandidate({ candidate, sdpMid: null, sdpMLineIndex: 0 }))
            .then(onAddIceCandidateSuccess, onAddIceCandidateError)
        })
      })
  }

  const onAddIceCandidateSuccess = () => {
    console.log("AddIceCandidate success.")
  }

  const onAddIceCandidateError = error => {
    console.warn(`Failed to add Ice Candidate: ${error.toString()}`)
  }

  const channelCallback = event => {
    debugger
    receiveChannel = event.channel
    receiveChannel.onmessage = onReceiveMessageCallback
    receiveChannel.onopen = onReceiveChannelStateChange
    receiveChannel.onclose = onReceiveChannelStateChange
  }

  const onReceiveMessageCallback = event => {
    console.log("Received Message", event.data)
  }

  const onChannelOpen = () => {
    const readyState = baseChannel.readyState
    sdk.trigger("rtc:ready")
    sendData("hello")
    console.log("Send channel state is: " + readyState)
  }

  const onChannelClose = () => {
    const readyState = baseChannel.readyState
    console.log("Send channel state is: " + readyState)
  }

  const onReceiveChannelStateChange = () => {
    const readyState = receiveChannel.readyState
    console.log(`Receive channel state is: ${readyState}`)
  }

  createConnection()

  sdk.rtcConnection = rtcConnection
}
