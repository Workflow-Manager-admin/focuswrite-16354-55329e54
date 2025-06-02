import React, { useState, useRef, useEffect } from 'react';
import './App.css';
// Import Howler core and the Howl class for soundscape
import { Howl } from 'howler';

/*
 * PUBLIC_INTERFACE
 * SerenityWrite Main Container
 * - Minimalist distraction-free writing app shell.
 * - Contains placeholders for analytics, pomodoro, soundscape, AI, streak/goals, and print mode.
 * - Demonstrates ambient soundscapes using howler.js.
 */
function App() {
  // Soundscape setup
  const [currentSound, setCurrentSound] = useState(null); // "rain", "cafe", "forest"
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // Example static sound URLs (these can be replaced by actual static assets)
  // Placeholder public online samples, for demo purposes only.
  const sounds = {
    rain: {
      label: 'Rain',
      url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_124b3f2dcf.mp3'
    },
    cafe: {
      label: 'Café',
      url: 'https://cdn.pixabay.com/audio/2022/08/20/audio_12bcf5ebe9.mp3'
    },
    forest: {
      label: 'Forest',
      url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_124bfbac46.mp3'
    }
  };

  // Store Howl instance in ref to avoid re-renders
  const [howlObj, setHowlObj] = useState(null);

  // Handler for playing a soundscape
  const handlePlaySound = (soundKey) => {
    // If a sound is already playing, stop it
    if (howlObj) {
      howlObj.stop();
    }
    // New Howl instance
    const sound = new Howl({
      src: [sounds[soundKey].url],
      volume,
      loop: true,
      html5: true,
      onend: () => setIsPlaying(false),
    });
    setHowlObj(sound);
    setCurrentSound(soundKey);
    setIsPlaying(true);
    sound.play();
  };

  // Handler for toggling play/pause
  const handleToggleSound = () => {
    if (!howlObj) return;
    if (isPlaying) {
      howlObj.pause();
      setIsPlaying(false);
    } else {
      howlObj.play();
      setIsPlaying(true);
    }
  };

  // Handler for stopping sound
  const handleStopSound = () => {
    if (howlObj) {
      howlObj.stop();
      setHowlObj(null);
      setCurrentSound(null);
      setIsPlaying(false);
    }
  };

  // Handler for volume change
  const handleChangeVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (howlObj) {
      howlObj.volume(v);
    }
  };

  // Print mode toggle (minimal demonstration)
  const [printMode, setPrintMode] = useState(false);

  return (
    <div className={printMode ? "app print-mode" : "app"}>
      {/* Top Bar / Navbar */}
      <nav className="navbar" style={{ backgroundColor: 'var(--base-dark)' }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <div className="logo">
            <span className="logo-symbol" style={{ color: "#A3BE8C" }}>✦</span>
            <span style={{ letterSpacing: 1.2 }}>SerenityWrite</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Analytics and Streak placeholder icons/buttons */}
            <button className="btn" style={{ marginRight: 8 }}>
              <span role="img" aria-label="Analytics">📊</span>&nbsp;Analytics
            </button>
            <button className="btn" style={{ marginRight: 8 }}>
              <span role="img" aria-label="Streak">🔥</span>&nbsp;Streak
            </button>
            <button className="btn" onClick={() => setPrintMode(!printMode)}>
              <span role="img" aria-label="Print">🖨️</span> Print Mode
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout: Sidebar (feature modules) + Center Writing Area + Right Panel */}
      <main style={{
        display: "flex",
        flexDirection: "row",
        paddingTop: 80,
        minHeight: "calc(100vh - 80px)",
        background: "linear-gradient(to right, #262b36 80%, #232634 100%)"
      }}>
        {/* Feature Sidebar (left) */}
        <aside style={{
          width: 80,
          background: "#2E3440",
          borderRight: "1.5px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 36,
          gap: 24,
          minHeight: "100%"
        }}>
          {/* Pomodoro Timer Placeholder */}
          <button className="btn" title="Pomodoro" style={{ width: 44, height: 44, borderRadius: 8 }}>
            <span role="img" aria-label="Pomodoro">⏲️</span>
          </button>
          {/* Soundscape Section */}
          <div style={{ width: "44px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 22, color: "#A3BE8C", marginBottom: 10 }}>
              <span role="img" aria-label="Soundscape">🎵</span>
            </span>
            {/* Sound buttons */}
            {Object.keys(sounds).map(skey => (
              <button
                key={skey}
                className="btn"
                title={sounds[skey].label}
                style={{
                  backgroundColor: (currentSound === skey && isPlaying) ? "#A3BE8C" : "#333",
                  color: (currentSound === skey && isPlaying) ? "#262b36" : "#fff",
                  width: 38,
                  height: 38,
                  marginBottom: 4,
                  fontSize: 13,
                  borderRadius: 6,
                  border: currentSound === skey ? "2px solid #A3BE8C" : "1px solid #444"
                }}
                onClick={() => handlePlaySound(skey)}
              >
                {sounds[skey].label[0]}
              </button>
            ))}
            {/* Play/Pause and stop controls */}
            <button
              className="btn"
              aria-label="Pause/Play"
              style={{
                background: "#232634",
                borderRadius: 16,
                fontSize: 17,
                marginTop: 3,
                color: "#A3BE8C"
              }}
              onClick={handleToggleSound}
              disabled={!currentSound}
            >
              {isPlaying ? "⏸" : "▶️"}
            </button>
            <button
              className="btn"
              aria-label="Stop"
              style={{
                background: "#232634",
                borderRadius: 16,
                fontSize: 13,
                marginTop: 3,
                color: "#A3BE8C"
              }}
              onClick={handleStopSound}
              disabled={!currentSound}
            >
              ⏹
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              style={{ marginTop: 8, accentColor: "#A3BE8C", width: 39 }}
              onChange={handleChangeVolume}
            />
          </div>
          {/* AI Enhancement Button Placeholder */}
          <button className="btn" title="AI Enhancement" style={{ width: 44, height: 44, borderRadius: 8 }}>
            <span role="img" aria-label="AI Enhance">🤖</span>
          </button>
        </aside>

        {/* Writing Area (center) */}
        <section style={{
          flex: "1 1 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "30px 0"
        }}>
          <div style={{
            maxWidth: 720,
            width: "100%",
            minHeight: 360,
            background: printMode ? "#fff" : "#262b36",
            color: printMode ? "#232634" : "#fff",
            borderRadius: 16,
            boxShadow: printMode ? "none" : "0 2px 18px rgba(44,53,72,0.09)",
            padding: "40px 32px",
            fontSize: "1.25rem",
            lineHeight: 1.7,
            marginBottom: 18,
            outline: printMode ? "none" : "2px solid #313944"
          }}
            contentEditable={!printMode}
            suppressContentEditableWarning={true}
            spellCheck={true}
            aria-label="SerenityWrite main writing area"
          >
            {/* Placeholder for writing content */}
            <span style={{ opacity: 0.38, fontStyle: "italic" }}>[ Start writing here... ]</span>
          </div>
          {/* Session Analytics, Pomodoro, Goals: placeholder below writing area */}
          <div style={{ display: "flex", flexDirection: "row", gap: 36, justifyContent: "center", alignItems: "center", marginTop: 6 }}>
            <div style={{ color: "#A3BE8C", fontSize: 15, fontWeight: 500 }}>
              <span role="img" aria-label="Word Count">✍️</span> 0 words
            </div>
            <div style={{ color: "#8FBCBB", fontSize: 15 }}>
              <span role="img" aria-label="Timer">⏰</span> 00:00
            </div>
            <div style={{ color: "#A3BE8C", fontSize: 15 }}>
              <span role="img" aria-label="Goal">🎯</span> 0 / 500 words
            </div>
          </div>
        </section>

        {/* Right Panel: Analytics, Progress/Goals */}
        <aside style={{
          width: 220,
          background: "#232634",
          borderLeft: "1.5px solid var(--border-color)",
          minHeight: "100%",
          padding: "36px 18px 0 18px",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "1.02rem", color: "#A3BE8C", fontWeight: 600, marginBottom: 7, letterSpacing: ".05em" }}>
              Analytics
            </div>
            <div style={{ color: "#fff", fontSize: "1.07rem" }}>[ Word count, session typing speed, focus streak ]</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "1.02rem", color: "#A3BE8C", fontWeight: 600, marginBottom: 7 }}>
              Pomodoro
            </div>
            <div style={{ color: "#fff", fontSize: "1.07rem" }}>[ Pomodoro controls here ]</div>
          </div>
          <div>
            <div style={{ fontSize: "1.02rem", color: "#A3BE8C", fontWeight: 600, marginBottom: 7 }}>
              Goals & Streaks
            </div>
            <div style={{ color: "#fff", fontSize: "1.07rem" }}>[ Progress bars, writing streak ]</div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
