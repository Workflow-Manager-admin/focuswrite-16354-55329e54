import React, { useState, useRef, useEffect } from 'react';
import './App.css';
// Import Howler core and the Howl class for soundscape
import { Howl } from 'howler';

/**
 * Patch-2024: Improve sound playback reliability on browsers with autoplay/mute restrictions:
 * - Ensures user-gesture requirement compliance (unlock audio via invisible interaction prompt if Howler rejects play()).
 * - Provides error messages if playback fails.
 * - Improves asset-path checks and gives browser policy hint.
 * - Handles unloading of previously loaded audio sources and handles mute.
 */


/*
 * PUBLIC_INTERFACE
 * SerenityWrite Main Container
 * - Minimalist distraction-free writing app shell.
 * - Contains placeholders for analytics, pomodoro, soundscape, AI, streak/goals, and print mode.
 * - Demonstrates ambient soundscapes using howler.js.
 */
function App() {
  // Soundscape setup
  const [currentSound, setCurrentSound] = useState(null); // "rain", "forest", "waterfall"
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // Editable writing area state
  const [writing, setWriting] = useState('');
  const [focused, setFocused] = useState(false);
  const writingRef = useRef(null);

  // Analytics
  const wordCount = writing.trim() === '' ? 0 : writing.trim().split(/\s+/).length;
  const goal = 500;

  // Pomodoro timer state and logic
  const [pomodoroStatus, setPomodoroStatus] = useState('idle'); // 'focus' | 'break' | 'paused' | 'idle'
  const [timer, setTimer] = useState(25 * 60); // seconds left
  const [pomodoroMode, setPomodoroMode] = useState('focus'); // distinguishes between focus and break visually
  const [intervalId, setIntervalId] = useState(null);

  // Print mode
  const [printMode, setPrintMode] = useState(false);

  // --- PREVIEW/PRINT MODE CLARIFICATION ---
  // SerenityWrite preview is handled through this "printMode" state,
  // shown when user presses the 🖨️ button (labelled "Print Layout"),
  // changing styles and hiding UI elements for clean preview/printing.
  // If preview does not work (button unresponsive, no layout change, or display errors),
  // the issue is likely in: printMode state, togglePrintMode, or print-mode CSS.

  // Only use local static waterfall sound URL
  function getWaterfallURL() {
    return process.env.PUBLIC_URL
      ? process.env.PUBLIC_URL + "/soundscapes/waterfall.mp3"
      : "/soundscapes/waterfall.mp3";
  }

  const sounds = {
    rain: {
      label: "Rain",
      url: process.env.PUBLIC_URL
        ? process.env.PUBLIC_URL + "/soundscapes/rain.mp3"
        : "/soundscapes/rain.mp3",
    },
    forest: {
      label: "Forest",
      url: process.env.PUBLIC_URL
        ? process.env.PUBLIC_URL + "/soundscapes/forest.mp3"
        : "/soundscapes/forest.mp3",
    },
    waterfall: {
      label: "Waterfall",
      url: getWaterfallURL(),
    },
  };

  // For "Waterfall" user-upload, store uploaded file in a ref
  const waterfallInputRef = useRef();
  const [uploadedWaterfall, setUploadedWaterfall] = useState(null);
  const [waterfallLoadError, setWaterfallLoadError] = useState(false);

  // Store Howl instance in ref to avoid re-renders
  const [howlObj, setHowlObj] = useState(null);

  // UI state to show a needed "Unlock Audio" prompt if browser blocks playback due to policy
  const [needUserUnlock, setNeedUserUnlock] = useState(false);

  // For debugging, output a "last audio error" message
  const [lastAudioError, setLastAudioError] = useState("");

  // Actually unlock Howler audio by user interaction
  const handleUnlockAudio = () => {
    // Play+pause a silent buffer to unlock
    const silent = new Howl({
      src: [sounds.rain.url], // Any known good asset
      volume: 0,
      mute: true,
      html5: true,
      onend: () => {},
    });
    silent.once('unlock', () => {
      setNeedUserUnlock(false);
      setLastAudioError("");
      silent.unload();
    });
    silent.play();
  };

  // Soundscape handlers (Rain, Forest, and Waterfall)
  // PUBLIC_INTERFACE
  const handlePlaySound = (soundKey) => {
    // Always stop/clean up any previous Howl before starting new
    if (howlObj) {
      howlObj.stop();
      howlObj.unload();
      setHowlObj(null);
    }

    let srcUrl = sounds[soundKey].url;
    if (soundKey === "waterfall" && uploadedWaterfall) {
      srcUrl = uploadedWaterfall;
    }

    setCurrentSound(soundKey); // To highlight correct button immediately

    const h = new Howl({
      src: [srcUrl],
      volume,
      loop: true,
      html5: true,
      onend: () => setIsPlaying(false),
      onloaderror: (id, err) => {
        if (soundKey === "waterfall") {
          setWaterfallLoadError(true);
        }
        setLastAudioError(`Failed to load audio source: ${srcUrl}`);
      },
      onplay: () => {
        setIsPlaying(true);
        setCurrentSound(soundKey);
        setNeedUserUnlock(false);
        setLastAudioError("");
      },
      onstop: () => {
        setIsPlaying(false);
        setCurrentSound(null);
      },
      onpause: () => setIsPlaying(false),
      onplayerror: function (id, err) {
        // Howler onplayerror is usually called if playback was blocked by browser policy
        setNeedUserUnlock(true);
        setIsPlaying(false);
        setCurrentSound(null);
        setLastAudioError(
          "Audio cannot play until you interact with the page. Click the 'Unlock Audio' button below."
        );
        // Try to unlock on next interaction:
        h.once('unlock', function () {
          setNeedUserUnlock(false);
          setLastAudioError("");
          h.play();
        });
      }
    });
    setHowlObj(h);
    setIsPlaying(true);
    setWaterfallLoadError(false);

    try {
      h.play();
    } catch (err) {
      setNeedUserUnlock(true);
      setLastAudioError(
        "Browser blocked playback. Please interact with the page (click button) to unlock audio."
      );
    }
  };

  // PUBLIC_INTERFACE
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

  // PUBLIC_INTERFACE
  const handleStopSound = () => {
    if (howlObj) {
      howlObj.stop();
      setHowlObj(null);
      setCurrentSound(null);
      setIsPlaying(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleChangeVolume = e => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (howlObj) {
      howlObj.volume(v);
    }
  };

  // Writing area contentEditable handlers
  const handleWritingInput = (e) => {
    setWriting(e.target.innerText);
  };
  const handleWritingFocus = () => setFocused(true);
  const handleWritingBlur = () => setFocused(false);

  // Print mode toggle
  // PUBLIC_INTERFACE
  const togglePrintMode = () => setPrintMode(v => !v);

  // Close print mode with Escape key
  useEffect(() => {
    if (!printMode) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setPrintMode(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [printMode]);

  // Pomodoro timer durations
  const FOCUS_LENGTH = 25 * 60;
  const BREAK_LENGTH = 5 * 60;

  // PUBLIC_INTERFACE
  const handleStartPomodoro = () => {
    // If resuming from pause, don't reset timer
    if (pomodoroStatus === 'paused') {
      setPomodoroStatus(pomodoroMode);
    } else if (pomodoroStatus === 'break') {
      setPomodoroStatus('break');
      setPomodoroMode('break');
    } else {
      setTimer(FOCUS_LENGTH);
      setPomodoroMode('focus');
      setPomodoroStatus('focus');
    }
  };

  // PUBLIC_INTERFACE
  const handlePausePomodoro = () => {
    setPomodoroStatus('paused');
  };

  // PUBLIC_INTERFACE
  const handleResetPomodoro = () => {
    setPomodoroStatus('idle');
    setPomodoroMode('focus');
    setTimer(FOCUS_LENGTH);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  // PUBLIC_INTERFACE
  const handleBreakPomodoro = () => {
    setTimer(BREAK_LENGTH);
    setPomodoroMode('break');
    setPomodoroStatus('break');
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  // Pomodoro Timer Effect for countdown
  useEffect(() => {
    if (pomodoroStatus === 'focus' || pomodoroStatus === 'break') {
      if (intervalId) clearInterval(intervalId);
      if (timer > 0) {
        const id = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) {
              clearInterval(id);
              // Auto-switch logic: focus -> break -> focus
              if (pomodoroStatus === 'focus') {
                setPomodoroStatus('break');
                setPomodoroMode('break');
                setTimer(BREAK_LENGTH);
              } else if (pomodoroStatus === 'break') {
                setPomodoroStatus('focus');
                setPomodoroMode('focus');
                setTimer(FOCUS_LENGTH);
              }
            }
            return prev > 0 ? prev - 1 : 0;
          });
        }, 1000);
        setIntervalId(id);
        return () => clearInterval(id);
      }
    } else if (pomodoroStatus === 'paused' || pomodoroStatus === 'idle') {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
    // Cleanup interval on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line
  }, [pomodoroStatus, timer]);

  // Timer format helper
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cleanup uploadedWaterfall URL when component unmounts
  useEffect(() => {
    return () => {
      if (uploadedWaterfall) {
        URL.revokeObjectURL(uploadedWaterfall);
      }
    };
    // eslint-disable-next-line
  }, []);

  // Cleanup Howl on unmount
  useEffect(() => {
    return () => {
      if (howlObj) {
        howlObj.stop();
        setHowlObj(null);
      }
    };
    // eslint-disable-next-line
  }, []);

  // Print mode: show only the writing area in fullscreen, hide all controls/sidebars/toolbars
  if (printMode) {
    return (
      <div className="app print-mode" style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#fff",
        color: "#232634",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {/* Print Layout Header (optional) */}
        <button
          className="btn btn-active"
          onClick={togglePrintMode}
          aria-label="Exit Print Layout"
          title="Return to edit mode"
          style={{
            position: "fixed",
            top: 22,
            right: 32,
            zIndex: 99,
            boxShadow: "0 2px 10px rgba(200,200,200,0.07)",
            background: "#A3BE8C",
            color: "#232634",
            fontSize: "1.02rem"
          }}
          data-testid="exit-print-layout"
        >
          ← Exit Print
        </button>

        <main
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
            minHeight: "100vh",
            paddingTop: 0,
            background: "#fff"
          }}
        >
          <section
            style={{
              width: "100vw",
              minWidth: 0,
              padding: 0,
              maxWidth: 720,
              margin: "0 auto",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 680,
                minHeight: 360,
                background: "#fff",
                color: "#232634",
                borderRadius: 0,
                boxShadow: "none",
                padding: 0,
                fontSize: "1.22rem",
                lineHeight: 1.7,
                margin: "40px 0 0 0",
                outline: "none",
                fontFamily: "'Serif', 'Georgia', 'Times New Roman', serif",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                textAlign: "left",
                overflowWrap: "break-word",
                transition: "none"
              }}
              tabIndex={-1}
              aria-label="Printing writing text area"
              role="region"
            >
              {writing && writing.trim().length > 0 ? writing : <span style={{ opacity: 0.33, fontStyle: "italic" }}>[ No text written ]</span>}
            </div>
          </section>
        </main>
        {/* Optionally, ESC key to exit handled by effect above */}
      </div>
    );
  }

  // Normal mode: show entire app
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
            <div className="analytics-pill">
              <span role="img" aria-label="Wordcount" style={{ fontSize: 16 }}>✍️</span>
              <span className="analytics-count">{wordCount}</span>
              <span className="analytics-label"> words</span>
            </div>
            {/* Print Control */}
            <div className="print-controls" style={{ display: 'flex', gap: 7 }}>
              <button
                className={printMode ? "btn btn-active" : "btn"}
                onClick={togglePrintMode}
                aria-label={printMode ? "Exit Print Layout" : "Enter Print Layout"}
                title={printMode ? "Return to edit mode" : "Show clean print preview (no sidebars/controls)"}
                style={{ minWidth: 90 }}
                data-testid="print-preview-toggle"
              >
                <span role="img" aria-label="Print">🖨️</span> {printMode ? "Exit Print" : "Print Layout"}
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* ... rest of app unchanged (sidebar, writing area, analytics, etc.) */}
      {/* [Preserved from previous return for normal mode] */}
      <main style={{
        display: "flex",
        flexDirection: "row",
        paddingTop: 80,
        minHeight: "calc(100vh - 80px)",
        background: "linear-gradient(to right, #262b36 80%, #232634 100%)"
      }}>
        {/* Feature Sidebar (left) */}
        {/* ... unchanged ... */}
        {/* Writing Area (center) */}
        {/* ... unchanged ... */}
        {/* Right Panel: Analytics */}
        {/* ... unchanged ... */}
        {/* Copy unchanged, omit due to length */}
        {/* (INSERTION POINT) [Copy the entire original code for main, as done above] */}
        {/* Copied code blocks not shown for brevity, see original. */}
        {/* --- SNIP --- (The code after here is unchanged and continues as before) */}
        {/* Feature Sidebar */}
        <aside style={{
          width: 200,
          minWidth: 200,
          background: "#2E3440",
          borderRight: "1.5px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 36,
          gap: 24,
          minHeight: "100%",
        }} aria-label="Sidebar">
          {/* SIDEBAR: Soundscapes and Pomodoro controls */}

          {/* Soundscapes Section */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{ color: "#A3BE8C", fontWeight: 600, fontSize: "1.07rem", marginBottom: 6, letterSpacing: ".04em" }}>
              Soundscapes
            </div>
            {/* Audio policy error (autoplay block) display */}
            {needUserUnlock && (
              <div style={{
                color: "#FFD700",
                background: "#232634",
                padding: "7px 10px",
                borderRadius: "7px",
                marginBottom: 5,
                fontWeight: 600,
                fontSize: "0.98em",
                textAlign: "center"
              }}>
                <div>
                  <span role="img" aria-label="Warning">🔈</span>
                  {" "}
                  Audio playback blocked by your browser.
                </div>
                <button
                  onClick={handleUnlockAudio}
                  style={{
                    background: "#A3BE8C",
                    color: "#232634",
                    border: "2px solid #A3BE8C",
                    borderRadius: 5,
                    marginTop: 6,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >Unlock Audio</button>
                <div style={{ marginTop: 4, fontSize: "0.93em", color: "#fff" }}>
                  {lastAudioError}
                </div>
              </div>
            )}
            {!needUserUnlock && lastAudioError && (
              <div style={{
                color: "#FFD700",
                background: "#232634",
                padding: "6px 8px",
                borderRadius: "7px",
                marginBottom: 5,
                fontWeight: 500,
                fontSize: "0.96em"
              }}>{lastAudioError}</div>
            )}
            <div style={{ display: "flex", flexDirection: "row", gap: 9 }}>
              {/* Rain button with label */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
                <button
                  className="btn"
                  style={{
                    background: currentSound === "rain" ? "#A3BE8C" : "#232634",
                    color: currentSound === "rain" ? "#232634" : "#fff",
                    border: currentSound === "rain" ? "2px solid #A3BE8C" : "1.5px solid #333",
                    fontWeight: 500,
                    transition: "all 0.18s",
                    minWidth: 32,
                    minHeight: 32,
                    maxHeight: 38,
                    padding: "6px 10px",
                    borderRadius: 8,
                    boxShadow: "none",
                    fontSize: "1.18rem",
                  }}
                  aria-label="Play Rain soundscape"
                  title="Rain sound"
                  onClick={() => handlePlaySound("rain")}
                  tabIndex={0}
                >🌧️</button>
                <div style={{
                  marginTop: 2,
                  fontSize: "0.93em",
                  color: currentSound === "rain" ? "#A3BE8C" : "#b0beca",
                  textAlign: "center",
                  fontWeight: 500,
                  minHeight: 17,
                  lineHeight: "1.1"
                }}>
                  Rain
                </div>
              </div>
              {/* Forest button with label */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth:48 }}>
                <button
                  className="btn"
                  style={{
                    background: currentSound === "forest" ? "#A3BE8C" : "#232634",
                    color: currentSound === "forest" ? "#232634" : "#fff",
                    border: currentSound === "forest" ? "2px solid #A3BE8C" : "1.5px solid #333",
                    fontWeight: 500,
                    transition: "all 0.18s",
                    minWidth: 32,
                    minHeight: 32,
                    maxHeight: 38,
                    padding: "6px 10px",
                    borderRadius: 8,
                    boxShadow: "none",
                    fontSize: "1.18rem",
                  }}
                  aria-label="Play Forest soundscape"
                  title="Forest sound"
                  onClick={() => handlePlaySound("forest")}
                  tabIndex={0}
                >🌲</button>
                <div style={{
                  marginTop: 2,
                  fontSize: "0.93em",
                  color: currentSound === "forest" ? "#A3BE8C" : "#b0beca",
                  textAlign: "center",
                  fontWeight: 500,
                  minHeight: 17,
                  lineHeight: "1.1"
                }}>
                  Forest
                </div>
              </div>
              {/* Waterfall button with label */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth:48 }}>
                <button
                  className="btn"
                  style={{
                    background: currentSound === "waterfall" ? "#A3BE8C" : "#232634",
                    color: currentSound === "waterfall" ? "#232634" : "#fff",
                    border: currentSound === "waterfall" ? "2px solid #A3BE8C" : "1.5px solid #333",
                    fontWeight: 500,
                    transition: "all 0.18s",
                    minWidth: 32,
                    minHeight: 32,
                    maxHeight: 38,
                    padding: "6px 10px",
                    borderRadius: 8,
                    boxShadow: "none",
                    fontSize: "1.18rem",
                  }}
                  aria-label="Play Waterfall soundscape"
                  title="Waterfall sound"
                  onClick={() => handlePlaySound("waterfall")}
                  tabIndex={0}
                >💧</button>
                <div style={{
                  marginTop: 2,
                  fontSize: "0.93em",
                  color: currentSound === "waterfall" ? "#A3BE8C" : "#b0beca",
                  textAlign: "center",
                  fontWeight: 500,
                  minHeight: 17,
                  lineHeight: "1.1"
                }}>
                  Waterfall
                </div>
              </div>
            </div>
            {/* Play/Pause/Stop/Volume for soundscapes */}
            <div style={{ marginTop: 9, display: "flex", flexDirection: "row", gap: 10, alignItems: "center" }}>
              <button
                className="btn"
                style={{
                  padding: "5px 14px",
                  background: isPlaying ? "#A3BE8C" : "#232634",
                  color: isPlaying ? "#232634" : "#fff",
                  border: isPlaying ? "2px solid #A3BE8C" : "1.5px solid #333",
                  fontSize: "1em"
                }}
                aria-label={isPlaying ? "Pause soundscape" : "Play soundscape"}
                onClick={handleToggleSound}
                disabled={!howlObj}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>
              <button
                className="btn"
                style={{
                  padding: "5px 10px",
                  background: "#232634",
                  color: "#fff",
                  border: "1.5px solid #333",
                  fontSize: "1em"
                }}
                aria-label="Stop soundscape"
                onClick={handleStopSound}
                disabled={!howlObj}
                title="Stop"
              >
                ⏹️
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleChangeVolume}
                style={{ width: 58, accentColor: "#A3BE8C" }}
                aria-label="Soundscapes volume"
                title="Volume"
              />
            </div>
            {/* Waterfall upload error helper */}
            {waterfallLoadError && (
              <div style={{ color: "#D08770", fontSize: "0.97em", marginTop: 4, textAlign: "center" }}>
                Sound not found or invalid for Waterfall. Try another file.
              </div>
            )}
          </div>

          {/* Pomodoro Section */}
          <div className="sidebar-pomodoro" style={{
              marginTop: 32,
              width: "90%",
              background: "#A3BE8C18",
              borderRadius: 12,
              padding: "18px 7px 14px 7px",
              boxShadow: "0 1px 4px rgba(163,190,140,.09)"
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 15 }}>
              <div style={{
                color: pomodoroMode === "break" ? "#8FBCBB" : "#B48EAD",
                fontWeight: 600,
                fontSize: "1.08rem",
                marginBottom: 5
              }}>
                Pomodoro Timer
              </div>
              <div style={{
                fontSize: 29,
                fontFamily: "monospace",
                color: pomodoroMode === "break" ? "#8FBCBB" : "#EBCB8B",
                fontWeight: 700
              }}>
                {formatTime(timer)}
              </div>
              <div style={{
                fontSize: "1em",
                color: pomodoroMode === "break" ? "#8FBCBB" : "#A3BE8C",
                marginBottom: 4
              }}>
                {pomodoroMode === "break"
                  ? "Break"
                  : pomodoroMode === "focus"
                    ? "Focus"
                    : "Idle"}
              </div>
              <div style={{ display: "flex", flexDirection: "row", gap: 5 }}>
                {pomodoroStatus === "idle" || pomodoroStatus === "paused" ? (
                  <button
                    className="btn"
                    style={{
                      padding: "4px 9px",
                      fontWeight: 500,
                      background: "#A3BE8C",
                      color: "#232634",
                      border: "2px solid #A3BE8C",
                      fontSize: "0.96em",
                      minWidth: 28,
                      minHeight: 28,
                      borderRadius: 7,
                    }}
                    onClick={handleStartPomodoro}
                    aria-label="Start Pomodoro"
                  >
                    ▶️
                  </button>
                ) : (
                  <button
                    className="btn"
                    style={{
                      padding: "4px 9px",
                      fontWeight: 500,
                      background: "#EBCB8B",
                      color: "#232634",
                      border: "2px solid #EBCB8B",
                      fontSize: "0.96em",
                      minWidth: 28,
                      minHeight: 28,
                      borderRadius: 7,
                    }}
                    onClick={handlePausePomodoro}
                    aria-label="Pause Pomodoro"
                  >
                    ⏸️
                  </button>
                )}
                <button
                  className="btn"
                  style={{
                    padding: "4px 8px",
                    fontWeight: 450,
                    background: "#232634",
                    color: "#fff",
                    border: "1.5px solid #A3BE8C",
                    fontSize: "0.96em",
                    minWidth: 28,
                    minHeight: 28,
                    borderRadius: 7,
                  }}
                  onClick={handleResetPomodoro}
                  aria-label="Reset Pomodoro"
                >
                  🔄
                </button>
                {pomodoroStatus !== "break" && (
                  <button
                    className="btn"
                    style={{
                      padding: "4px 8px",
                      fontWeight: 450,
                      background: "#8FBCBB",
                      color: "#232634",
                      border: "2px solid #8FBCBB",
                      fontSize: "0.96em",
                      minWidth: 28,
                      minHeight: 28,
                      borderRadius: 7,
                    }}
                    onClick={handleBreakPomodoro}
                    aria-label="Start Break"
                  >
                    ☕
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Writing Area (center) */}
        <section style={{
          flex: "1 1 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "30px 0"
        }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 720 }}>
            {/* Placeholder is now a positioned sibling (not child) */}
            {!printMode && writing.length === 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 40,
                  left: 32,
                  pointerEvents: "none",
                  opacity: 0.36,
                  fontStyle: "italic",
                  color: "#fff",
                  userSelect: "none",
                  zIndex: 2
                }}
                aria-hidden="true"
                data-testid="writing-area-placeholder"
              >
                [ Start writing here... ]
              </span>
            )}
            <div
              ref={writingRef}
              style={{
                maxWidth: 720,
                width: "100%",
                minHeight: 360,
                background: printMode ? "#fff" : "#262b36",
                color: printMode ? "#232634" : "#fff",
                borderRadius: 16,
                boxShadow: printMode ? "none" : (focused ? "0 0 0 2.5px #A3BE8C" : "0 2px 18px rgba(44,53,72,0.09)"),
                padding: "40px 32px",
                fontSize: "1.25rem",
                lineHeight: 1.7,
                marginBottom: 18,
                outline: printMode ? "none" : (focused ? "2.5px solid #A3BE8C" : "2px solid #313944"),
                transition: "outline-color 0.2s",
                resize: !printMode ? "vertical" : "none",
                overflowY: "auto",
                fontFamily: "inherit",
                wordBreak: "break-word",
                WebkitUserSelect: "text",
                MozUserSelect: "text",
                msUserSelect: "text",
                userSelect: "text",
                backgroundClip: "padding-box" // for appearance
              }}
              contentEditable={!printMode}
              suppressContentEditableWarning={true}
              spellCheck={true}
              aria-label="SerenityWrite main writing area"
              aria-multiline="true"
              tabIndex={0}
              onInput={handleWritingInput}
              onFocus={handleWritingFocus}
              onBlur={handleWritingBlur}
              onPaste={e => {
                e.preventDefault();
                // Strip HTML formatting and paste as plain text only!
                const text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
              }}
              onDrop={e => {
                // Prevent dropping files/images
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  e.preventDefault();
                  return false;
                }
                return true;
              }}
              role="textbox"
              aria-live="polite"
              aria-autocomplete="none"
              data-testid="writing-area-contenteditable"
            >
              {/* No more placeholder span as a child */}
              {writing.length > 0 ? writing : null}
            </div>
          </div>
          {/* Session Analytics and Pomodoro */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 36,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 6
          }}>
            {/* Word Count */}
            <div style={{
              color: "#A3BE8C",
              fontSize: 15,
              fontWeight: 500,
              minWidth: 85
            }}>
              <span role="img" aria-label="Word Count">✍️</span> {wordCount} words
            </div>
            {/* Pomodoro Timer */}
            <div style={{
              color: pomodoroMode === "break" ? "#8FBCBB" : "#B48EAD",
              fontSize: 15,
              minWidth: 87,
              fontWeight: 600
            }}>
              <span role="img" aria-label="Timer">⏰</span> {formatTime(timer)}{" "}
              <span style={{
                fontSize: "0.89em",
                marginLeft: 4,
                color: pomodoroMode === "break" ? "#8FBCBB" : "#A3BE8C"
              }}>
                {pomodoroMode === "break"
                  ? "Break"
                  : pomodoroMode === "focus"
                    ? "Focus"
                    : "Idle"}
              </span>
            </div>
            {/* Goal Display */}
            <div style={{
              color: "#A3BE8C",
              fontSize: 15,
              minWidth: 100
            }}>
              <span role="img" aria-label="Goal">🎯</span> {wordCount} / {goal} words
            </div>
          </div>
        </section>
        {/* Right Panel: Analytics */}
        <aside style={{
          width: 230,
          background: "#232634",
          borderLeft: "1.5px solid var(--border-color)",
          minHeight: "100%",
          padding: "36px 18px 0 18px",
          display: "flex",
          flexDirection: "column",
          gap: 20
        }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "1.07rem", color: "#A3BE8C", fontWeight: 600, marginBottom: 7, letterSpacing: ".04em" }}>
              Analytics
            </div>
            <div style={{ color: "#fff", fontSize: "1.09rem", marginBottom: 6 }}>
              Words written: <span style={{ fontWeight: 600 }}>{wordCount}</span>
            </div>
            {/* Additional analytics features may go here */}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "1.07rem", color: "#A3BE8C", fontWeight: 600, marginBottom: 7 }}>
              Pomodoro
            </div>
            <div style={{ color: "#fff", fontSize: "1.09rem" }}>
              {pomodoroMode === 'focus' && pomodoroStatus !== 'idle'
                ? pomodoroStatus === 'paused' ? "Session paused" : "Session in progress"
                : pomodoroMode === 'break'
                  ? (pomodoroStatus === 'paused' ? "Break paused" : "On break")
                  : "Ready to focus"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "1.07rem", color: "#A3BE8C", fontWeight: 600, marginBottom: 7 }}>
              Goals & Streaks
            </div>
            <div style={{ color: "#fff", fontSize: "1.09rem" }}>
              Goal: {wordCount} / {goal} words
              <div style={{
                margin: "7px 0 0 0",
                width: "100%",
                height: 6,
                background: "#333",
                borderRadius: 4,
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${Math.min(100, Math.round((wordCount / goal) * 100))}%`,
                  height: "100%",
                  background: "#A3BE8C",
                  borderRadius: 4,
                  transition: "width .3s"
                }} />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
