import { useEffect } from "react";

interface StartingAnimationProps {
  onComplete?: () => void;
}

export default function StartingAnimation({ onComplete }: StartingAnimationProps) {
  useEffect(() => {
    // Check session
    const hasPlayed = sessionStorage.getItem("svap_intro_played");
    if (hasPlayed && onComplete) {
      onComplete();
      return;
    }

    // Auto-complete after video duration (4 seconds + 0.5s fade)
    const timer = setTimeout(() => {
      sessionStorage.setItem("svap_intro_played", "true");
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem("svap_intro_played", "true");
    if (onComplete) onComplete();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <video
        autoPlay
        muted
        playsInline
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto'
        }}
      >
        <source src="/starting-animation.mp4" type="video/mp4" />
      </video>

      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '10px 24px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 999,
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        Skip
      </button>
    </div>
  );
}
