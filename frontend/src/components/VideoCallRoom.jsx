import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useToast } from "./useToast";

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

function VideoCallRoom({ socket, partnerId, partnerName, isIncoming, initialOffer, onClose }) {
  const { showToast } = useToast();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState(isIncoming ? "Incoming call..." : "Calling...");

  useEffect(() => {
    let internalStream = null;

    const initCall = async () => {
      try {
        internalStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(internalStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = internalStream;

        peerConnectionRef.current = new RTCPeerConnection(iceServers);

        internalStream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, internalStream);
        });

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus("Connected");
          }
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { targetUserId: partnerId, candidate: event.candidate });
          }
        };

        if (isIncoming && initialOffer) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(initialOffer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit("answer-call", { callerId: partnerId, answer });
        } else {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit("call-user", { targetUserId: partnerId, offer, callerName: "You" });
        }
      } catch (err) {
        showToast("Camera/Mic access denied or unavailable", "error");
        onClose();
      }
    };

    initCall();

    const handleAnswer = async ({ answer }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleICECandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleEndCall = () => {
      showToast("Call ended by partner", "info");
      onClose();
    };

    socket.on("call-answered", handleAnswer);
    socket.on("ice-candidate", handleICECandidate);
    socket.on("call-ended", handleEndCall);

    return () => {
      socket.off("call-answered", handleAnswer);
      socket.off("ice-candidate", handleICECandidate);
      socket.off("call-ended", handleEndCall);
      
      if (internalStream) {
        internalStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [partnerId, isIncoming, initialOffer, socket, onClose, showToast]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    socket.emit("end-call", { targetUserId: partnerId });
    onClose();
  };

  return (
    <div style={overlayStyle}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={containerStyle}
      >
        <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
          <h2 style={{ margin: 0, color: "white", fontSize: 24, fontWeight: 600 }}>{partnerName}</h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)" }}>{callStatus}</p>
        </div>

        <video ref={remoteVideoRef} autoPlay playsInline style={remoteVideoStyle} />
        
        <div style={localVideoWrapStyle}>
          <video ref={localVideoRef} autoPlay playsInline muted style={localVideoStyle} />
        </div>

        <div style={controlsStyle}>
          <button onClick={toggleMute} style={controlBtnStyle}>
            {isMuted ? <MicOff color="white" /> : <Mic color="var(--bg-main)" />}
          </button>
          <button onClick={endCall} style={{ ...controlBtnStyle, background: "var(--danger)" }}>
            <PhoneOff color="white" />
          </button>
          <button onClick={toggleVideo} style={controlBtnStyle}>
            {isVideoOff ? <VideoOff color="white" /> : <Video color="var(--bg-main)" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 20
};

const containerStyle = {
  width: "100%", maxWidth: 1000, height: "80vh",
  background: "#111", borderRadius: 24,
  position: "relative", overflow: "hidden",
  boxShadow: "0 24px 48px rgba(0,0,0,0.5)"
};

const remoteVideoStyle = { width: "100%", height: "100%", objectFit: "cover", background: "#000" };

const localVideoWrapStyle = {
  position: "absolute", bottom: 20, right: 20,
  width: 200, height: 280, borderRadius: 16,
  overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)",
  boxShadow: "0 12px 24px rgba(0,0,0,0.4)"
};

const localVideoStyle = { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", background: "#222" };

const controlsStyle = {
  position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
  display: "flex", gap: 16, background: "rgba(0,0,0,0.6)",
  padding: "12px 24px", borderRadius: 999, backdropFilter: "blur(10px)"
};

const controlBtnStyle = {
  width: 56, height: 56, borderRadius: "50%",
  border: "none", background: "white", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "transform 0.2s ease"
};

export default VideoCallRoom;
