export default sdk => {
  let localConnection
  let remoteConnection
  let sendChannel
  let receiveChannel

  const createConnection = () => {
    const servers = {
      iceCandidatePoolSize: 16,
      iceTransportPolicy: "all",
      rtcpMuxPolicy: "negotiate",
    }
    localConnection = new RTCPeerConnection(servers)

    console.log("Created local peer connection object localConnection")

    sendChannel = localConnection.createDataChannel("sendDataChannel")
    console.log("Created send data channel")

    localConnection.onicecandidate = e => {
      onIceCandidate(localConnection, e)
    }
    sendChannel.onopen = onSendChannelStateChange
    sendChannel.onclose = onSendChannelStateChange

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
    console.log(`Offer from localConnection\n${desc.sdp}`)

    const url = `${sdk.getRoot().getAttribute("host")}/rtc_offer`

    fetch(url, {
      method: "POST",
      body: desc.sdp,
    })
        .then(response => response.json())
        .then(data => {
          console.log(`Answer from remoteConnection`, data)
          const offer = data.sdp;
          const candidates = data.candidates;
          console.log(`Offer from remoteConnection`, offer)
          localConnection.setRemoteDescription({ type: "offer", sdp: offer })
          candidates.forEach(candidate =>
              localConnection
              .addIceCandidate(candidate)
              .then(onAddIceCandidateSuccess, onAddIceCandidateError)
          )
    })
  }

  const onIceCandidate = (pc, event) => {
    localConnection.createOffer().then(gotLocalOfferWithCandidates, onCreateSessionDescriptionError)

    console.log(`ICE candidate: ${event.candidate ? event.candidate.candidate : "(null)"}`)
  }

  const onAddIceCandidateSuccess = () => {
    console.log("AddIceCandidate success.")
  }

  const onAddIceCandidateError = error => {
    console.log(`Failed to add Ice Candidate: ${error.toString()}`)
  }

  const receiveChannelCallback = event => {
    console.log("Receive Channel Callback")
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
    console.log("Send channel state is: " + readyState)
  }

  const onReceiveChannelStateChange = () => {
    const readyState = receiveChannel.readyState
    console.log(`Receive channel state is: ${readyState}`)
  }

  createConnection()

  // let dataToSend = 1
  // const send = () => {
  //   setTimeout(() => {
  //     sendData(dataToSend)
  //     dataToSend = dataToSend + 1
  //     send()
  //   }, 1000)
  // }
  // send()

  return closeDataChannels
}
