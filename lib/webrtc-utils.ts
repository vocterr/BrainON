// Utility functions for WebRTC

export const getMediaConstraints = () => ({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

export const checkMediaPermissions = async () => {
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
    return { camera: 'prompt', microphone: 'prompt' };
  }
};

export const getNetworkQuality = (pc: RTCPeerConnection): Promise<string> => {
  return new Promise((resolve) => {
    if (!pc) {
      resolve('unknown');
      return;
    }

    pc.getStats().then(stats => {
      let packetsLost = 0;
      let packetsReceived = 0;
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          packetsLost += report.packetsLost || 0;
          packetsReceived += report.packetsReceived || 0;
        }
      });
      
      const packetLossRate = packetsReceived > 0 
        ? (packetsLost / (packetsLost + packetsReceived)) * 100 
        : 0;
      
      if (packetLossRate < 1) resolve('excellent');
      else if (packetLossRate < 3) resolve('good');
      else if (packetLossRate < 7) resolve('fair');
      else resolve('poor');
    }).catch(() => resolve('unknown'));
  });
};