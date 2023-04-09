export default sdk => {
  let localConnection
  let remoteConnection
  let sendChannel
  let receiveChannel

  const createConnection = () => {
    const servers = null
    localConnection = new RTCPeerConnection(servers)

    console.log("Created local peer connection object localConnection")

    sendChannel = localConnection.createDataChannel("base")

    sendChannel.onopen = onSendChannelStateChange
    sendChannel.onclose = onSendChannelStateChange

    localConnection.onicegatheringstatechange = () => {
      if (localConnection.iceGatheringState !== "complete") return

      localConnection
        .createOffer()
        .then(gotLocalOfferWithCandidates, onCreateSessionDescriptionError)
    }

    localConnection.ondatachannel = receiveChannelCallback

    localConnection
      .createOffer()
      .then(desc => localConnection.setLocalDescription(desc), onCreateSessionDescriptionError)
  }

  const onCreateSessionDescriptionError = error => {
    console.log("Failed to create session description: " + error.toString())
  }

  const sendData = data => {
    sendChannel.send(data)
    console.log("Sent Data: " + data)
  }

  const closeDataChannels = () => {
    console.log("Closing data channels")
    sendChannel.close()
    console.log("Closed data channel with label: " + sendChannel.label)
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

  const receiveChannelCallback = event => {
    receiveChannel = event.channel
    receiveChannel.onmessage = onReceiveMessageCallback
    receiveChannel.onopen = onReceiveChannelStateChange
    receiveChannel.onclose = onReceiveChannelStateChange
  }

  const onReceiveMessageCallback = event => {
    console.log("Received Message", event.data)
  }

  const onSendChannelStateChange = () => {
    const readyState = sendChannel.readyState
    sendData("hello")
    console.log("Send channel state is: " + readyState)
  }

  const onReceiveChannelStateChange = () => {
    const readyState = receiveChannel.readyState
    console.log(`Receive channel state is: ${readyState}`)
  }

  createConnection()

  return closeDataChannels
}
