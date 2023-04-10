export default sdk => {
  let localConnection
  let remoteConnection
  let baseChannel
  let receiveChannel

  const createConnection = () => {
    const servers = null
    localConnection = new RTCPeerConnection(servers)

    console.log("Created local peer connection object localConnection")

    baseChannel = localConnection.createDataChannel("base")

    baseChannel.onopen = onChannelOpen
    baseChannel.onclose = onChannelClose
    baseChannel.onmessage = event => {
      console.log(event.data)
    }

    localConnection.onicegatheringstatechange = () => {
      if (localConnection.iceGatheringState !== "complete") return

      localConnection
        .createOffer()
        .then(gotLocalOfferWithCandidates, onCreateSessionDescriptionError)
    }

    localConnection.ondatachannel = channelCallback

    localConnection
      .createOffer()
      .then(desc => localConnection.setLocalDescription(desc), onCreateSessionDescriptionError)
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
    localConnection.close()
    remoteConnection.close()
    localConnection = null
    remoteConnection = null
    console.log("Closed peer connections")
  }

  const gotLocalOfferWithCandidates = desc => {
    localConnection.setLocalDescription(desc)

    const url = `${sdk.getRoot().getAttribute("host")}/rtc_offer`

    fetch(url, {
      method: "POST",
      body: desc.sdp,
    })
      .then(response => response.json())
      .then(({ sdp, candidates }) => {
        localConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }))

        candidates.forEach(candidate => {
          localConnection
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

  return { rtcConnection: localConnection, rtcDestroy: closeDataChannels }
}
