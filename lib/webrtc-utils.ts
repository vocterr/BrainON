// FILE: lib/webrtc-utils.ts
// Keep the ICE_SERVERS export for backward compatibility
export const ICE_SERVERS = [
        { urls: "stun:openrelay.metered.ca:80" },

        // Publiczne serwery TURN z Open Relay Project
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
        }
    ]

// The rest of your existing code remains exactly the same
const FALLBACK_MEDIA_CONSTRAINTS: MediaStreamConstraints[] = [
    {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    },
    {
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    },
    {
        video: { facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    },
    {
        video: true,
        audio: true
    }
];

export const getMediaStreamWithFallback = async (): Promise<MediaStream> => {
    for (const constraints of FALLBACK_MEDIA_CONSTRAINTS) {
        try {
            console.log("[getMediaStream] Trying constraints:", JSON.stringify(constraints));
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("[getMediaStream] Success with constraints:", JSON.stringify(constraints));
            return stream;
        } catch (error) {
            console.warn("[getMediaStream] Failed with constraints. Trying next...");
        }
    }
    throw new Error("Could not get media stream with any of the available constraints.");
};

export const handleMediaStreamError = (error: any): string => {
    if (error?.message?.includes("Could not get media stream")) {
        return "Your browser was unable to access the camera/microphone with any available setting."
    }
    let errorMessage = 'Failed to access media devices';
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permissions denied. Please allow access and refresh.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application.';
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera/microphone doesn\'t support the requested quality settings.';
    } else if (error.name === 'TypeError') {
        errorMessage = 'Invalid media constraints provided.';
    }
    return errorMessage;
};

export const checkMediaPermissions = async (): Promise<{
    camera: PermissionState;
    microphone: PermissionState;
}> => {
    try {
        const permissions = await Promise.all([
            navigator.permissions.query({ name: 'camera' as PermissionName }),
            navigator.permissions.query({ name: 'microphone' as PermissionName })
        ]);
        
        return {
            camera: permissions[0].state,
            microphone: permissions[1].state
        };
    } catch (error) {
        console.error('Error checking permissions:', error);
        return { camera: 'prompt' as PermissionState, microphone: 'prompt' as PermissionState };
    }
};

export const getConnectionQuality = async (pc: RTCPeerConnection): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    stats: {
        latency?: number;
        jitter?: number;
        packetLoss?: number;
        bitrate?: number;
    };
}> => {
    if (!pc) return { quality: 'unknown', stats: {} };

    try {
        const stats = await pc.getStats();
        let totalPacketsLost = 0;
        let totalPacketsReceived = 0;
        let currentBitrate = 0;
        let latency = 0;
        let jitter = 0;

        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                totalPacketsLost += report.packetsLost || 0;
                totalPacketsReceived += report.packetsReceived || 0;
                jitter = report.jitter || 0;
                
                if (report.bytesReceived && report.timestamp) {
                    currentBitrate = (report.bytesReceived * 8) / (report.timestamp / 1000);
                }
            } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                latency = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
            }
        });

        const packetLossRate = totalPacketsReceived > 0 
            ? (totalPacketsLost / (totalPacketsLost + totalPacketsReceived)) * 100 
            : 0;

        let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' = 'unknown';
        
        if (packetLossRate < 0.5 && latency < 50) {
            quality = 'excellent';
        } else if (packetLossRate < 1 && latency < 100) {
            quality = 'good';
        } else if (packetLossRate < 3 && latency < 200) {
            quality = 'fair';
        } else {
            quality = 'poor';
        }

        return {
            quality,
            stats: {
                latency: Math.round(latency),
                jitter: Math.round(jitter * 1000),
                packetLoss: Math.round(packetLossRate * 100) / 100,
                bitrate: Math.round(currentBitrate / 1000)
            }
        };
    } catch (error) {
        console.error('Error getting connection stats:', error);
        return { quality: 'unknown', stats: {} };
    }
};

export const createSafeOffer = async (
    pc: RTCPeerConnection,
    options?: RTCOfferOptions
): Promise<RTCSessionDescriptionInit | null> => {
    try {
        const offer = await pc.createOffer(options || {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        return offer;
    } catch (error) {
        console.error('Error creating offer:', error);
        return null;
    }
};

export const createSafeAnswer = async (
    pc: RTCPeerConnection,
    options?: RTCAnswerOptions
): Promise<RTCSessionDescriptionInit | null> => {
    try {
        const answer = await pc.createAnswer(options);
        return answer;
    } catch (error) {
        console.error('Error creating answer:', error);
        return null;
    }
};