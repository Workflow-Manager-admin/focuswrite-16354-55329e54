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

  // Soundscape handlers (Rain, Forest, and Waterfall)
  // PUBLIC_INTERFACE
  const handlePlaySound = (soundKey) => {
    // If the same soundscape is "active", just resume if paused; otherwise switch
    if (currentSound === soundKey && howlObj && !isPlaying) {
      howlObj.play();
      setIsPlaying(true);
      return;
    }
    // Stop any currently playing soundscape
    if (howlObj) {
      howlObj.stop();
      setHowlObj(null);
    }

    let srcUrl = sounds[soundKey].url;
    // For Waterfall, prefer uploaded, then local; no more remote fallback
    let useUploaded = false;
    if (soundKey === "waterfall") {
      if (uploadedWaterfall) {
        srcUrl = uploadedWaterfall;
        useUploaded = true;
      }
    }

    const playSound = (url) => {
      const h = new Howl({
        src: [url],
        volume,
        loop: true,
        html5: true,
        onend: () => setIsPlaying(false),
        onloaderror: (id, err) => {
          if (soundKey === "waterfall") {
            // File missing or invalid: show a clear message
            setWaterfallLoadError(true);
          }
        },
        onplay: () => {
          setIsPlaying(true);
          setCurrentSound(soundKey);
        },
        onstop: () => {
          setIsPlaying(false);
          setCurrentSound(null);
        },
        onpause: () => setIsPlaying(false),
        onplayerror: function () {
          h.once('unlock', function () {
            h.play();
          });
        }
      });
      setHowlObj(h);
      setCurrentSound(soundKey);
      setIsPlaying(true);
      setWaterfallLoadError(false);
      h.play();
    };

    playSound(srcUrl);
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
  const togglePrintMode = () => setPrintMode(v => !v);

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
              >
                <span role="img" aria-label="Print">🖨️</span> {printMode ? "Exit Print" : "Print Layout"}
              </button>
            </div>
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
          {/* Pomodoro Timer Shell */}
          <div
            className="sidebar-pomodoro"
            style={{
              width: 56,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 12,
              background: pomodoroMode === "break" ? "#8FBCBB24" : "#A3BE8C18",
              border: (pomodoroStatus === "focus" || pomodoroStatus === "break") ? '2px solid #A3BE8C' : undefined
            }}
            aria-label={`Pomodoro status: ${pomodoroMode === 'break' ? 'Break' : pomodoroMode}`}
          >
            <span style={{
              fontSize: 18,
              color: pomodoroMode === "break" ? "#8FBCBB" : "#A3BE8C",
              marginBottom: 4
            }}>
              <span role="img" aria-label="Pomodoro">⏲️</span>
            </span>
            <div style={{
              fontSize: 13,
              color: pomodoroMode === "break" ? "#8FBCBB" : "#A3BE8C",
              fontWeight: 600,
              marginBottom: 1
            }}>
              {pomodoroMode === "break" ? "Break" : pomodoroMode === "focus" ? "Focus" : "Idle"}
            </div>
            <div style={{
              fontSize: 19,
              marginTop: 0,
              color: pomodoroMode === "break" ? "#8FBCBB" : "#A3BE8C",
              fontWeight: 700,
              letterSpacing: "0.03em"
            }}>{formatTime(timer)}</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
              {(pomodoroStatus === "idle" || pomodoroStatus === "paused") && (
                <button className="btn" title="Start" style={{ padding: 3, fontSize: 15, width: 28, height: 28, borderRadius: 6 }} onClick={handleStartPomodoro}>
                  ▶️
                </button>
              )}
              {(pomodoroStatus === "focus" || pomodoroStatus === "break") && (
                <button className="btn" title="Pause" style={{ padding: 3, fontSize: 14, width: 28, height: 28, borderRadius: 6, background: "#B48EAD", color: "#fff" }} onClick={handlePausePomodoro}>
                  ⏸
                </button>
              )}
              <button className="btn" title="Reset" style={{ padding: 3, fontSize: 13, width: 28, height: 28, borderRadius: 6, background: "#CE5454", color: "#fff" }} onClick={handleResetPomodoro}>
                ⏹
              </button>
              <button className="btn" title="Break" style={{ padding: 3, fontSize: 13, width: 28, height: 28, borderRadius: 6, background: "#8FBCBB", color: "#232634" }} onClick={handleBreakPomodoro}>
                ☕
              </button>
            </div>
          </div>
          {/* Soundscape Section */}
          <div
            style={{
              width: "100%",
              minWidth: 170,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              margin: "0 0 8px 0"
            }}
            aria-label="Ambient soundscape controls"
          >
            <span style={{ fontSize: 25, color: "#A3BE8C", marginBottom: 8 }}>
              <span role="img" aria-label="Soundscape">🎵</span>
            </span>
            {/* Visually polished, accessible large soundscape buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                width: "100%"
              }}
              role="group"
              aria-label="Soundscape choices"
            >
              {Object.keys(sounds).map(skey => {
                const isActive = (currentSound === skey && isPlaying);
                return (
                  <React.Fragment key={skey}>
                    <button
                      className={`btn btn-large${isActive ? " btn-active" : ""}`}
                      title={sounds[skey].label}
                      aria-pressed={isActive}
                      aria-label={sounds[skey].label + (isActive ? " (active)" : "")}
                      style={{
                        backgroundColor: isActive ? "#A3BE8C" : "#29313f",
                        color: isActive ? "#232634" : "#fff",
                        width: 174,
                        height: 54,
                        fontSize: "1.212rem",
                        borderRadius: 12,
                        border: isActive ? "2.5px solid #A3BE8C" : "1.2px solid #394154",
                        fontWeight: 700,
                        letterSpacing: 0.22,
                        boxShadow: isActive ? "0 2.5px 12px #A3BE8C26" : "0 1px 5px #13182433",
                        margin: "0 auto",
                        outline: isActive ? "3px solid #B7E9C4" : undefined,
                        outlineOffset: isActive ? "2px" : undefined,
                        transition: "background 0.18s, box-shadow 0.21s"
                      }}
                      onClick={() => handlePlaySound(skey)}
                      tabIndex={0}
                    >
                      {skey === "rain" && <span role="img" aria-label="Rain" style={{ marginRight: 8, fontSize: 23 }}>🌧️</span>}
                      {skey === "forest" && <span role="img" aria-label="Forest" style={{ marginRight: 8, fontSize: 23 }}>🌲</span>}
                      {skey === "waterfall" && <span role="img" aria-label="Waterfall" style={{ marginRight: 8, fontSize: 23 }}>💧</span>}
                      {sounds[skey].label}
                      {isActive && (
                        <span style={{ marginLeft: 10, fontSize: 21, verticalAlign: "middle" }} role="img" aria-label="playing">🔊</span>
                      )}
                    </button>
                    {/* If Waterfall errored, provide upload prompt below button */}
                    {skey === "waterfall" && waterfallLoadError && (
                      <section
                        style={{
                          margin: "7px 0 9px 0",
                          color: "#FFD69B",
                          fontSize: 15.2,
                          lineHeight: 1.25,
                          textAlign: "center",
                          background: "#19202C",
                          borderRadius: 8,
                          padding: "10px 6px"
                        }}
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        Could not play Waterfall sound: <strong>Local /soundscapes/waterfall.mp3 file not found or inaccessible.</strong><br />
                        <label
                          htmlFor="waterfall-upload"
                          style={{
                            display: "block",
                            fontWeight: 600,
                            cursor: "pointer",
                            margin: "7px 0"
                          }}
                        >
                          Upload your own waterfall sound (MP3):
                          <input
                            ref={waterfallInputRef}
                            id="waterfall-upload"
                            type="file"
                            accept="audio/mp3,audio/mpeg"
                            style={{ display: "block", margin: "4px auto" }}
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const url = URL.createObjectURL(file);
                                setUploadedWaterfall(url);
                                setWaterfallLoadError(false);
                                // Auto-play after upload
                                setTimeout(() => handlePlaySound("waterfall"), 250);
                              }
                            }}
                          />
                        </label>
                        <span style={{ fontSize: 13.3, color: "#E8B88B" }}>
                          The default waterfall sound is unavailable. Please upload a local MP3 of your choice.
                        </span>
                      </section>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Playback controls: Pause/Resume/Stop with ARIA */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 14,
                flexDirection: "row",
                alignItems: "center"
              }}
              aria-label="Soundscape playback controls"
            >
              <button
                className="btn"
                aria-label={isPlaying ? "Pause soundscape" : "Play soundscape"}
                aria-disabled={!currentSound}
                style={{
                  background: "#232634",
                  borderRadius: 17,
                  fontSize: 21,
                  color: "#A3BE8C",
                  width: 39,
                  height: 39,
                  padding: 6,
                  border: "1.7px solid #314050"
                }}
                onClick={handleToggleSound}
                disabled={!currentSound}
                tabIndex={0}
              >
                {isPlaying ? "⏸" : "▶️"}
              </button>
              <button
                className="btn"
                aria-label="Stop soundscape"
                aria-disabled={!currentSound}
                style={{
                  background: "#232634",
                  borderRadius: 17,
                  fontSize: 17,
                  color: "#A3BE8C",
                  width: 39,
                  height: 39,
                  padding: 6,
                  border: "1.7px solid #314050"
                }}
                onClick={handleStopSound}
                disabled={!currentSound}
                tabIndex={0}
              >
                ⏹
              </button>
            </div>
            {/* Shared volume slider, with ARIA */}
            <div
              style={{
                width: 130,
                marginTop: 11,
                alignSelf: "center",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10
              }}
            >
              <span role="img" aria-label="Volume down" style={{ fontSize: 19, color: "#A3BE8C" }}>🔈</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                style={{
                  accentColor: "#A3BE8C",
                  width: 85,
                  verticalAlign: "middle",
                  background: "#222",
                  borderRadius: 2
                }}
                onChange={handleChangeVolume}
                aria-label={`Soundscape volume (${Math.round(volume * 100)}%)`}
                tabIndex={0}
              />
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
          >
            {writing.length === 0 && !printMode && (
              <span style={{ opacity: 0.36, fontStyle: "italic", userSelect: "none", pointerEvents: "none" }}>
                [ Start writing here... ]
              </span>
            )}
            {/* Only display the value as plain text nodes */}
            {writing.length > 0 && writing}
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
