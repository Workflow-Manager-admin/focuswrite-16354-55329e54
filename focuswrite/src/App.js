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

  // Editable writing area state
  const [writing, setWriting] = useState('');
  const [focused, setFocused] = useState(false);
  const writingRef = useRef(null);

  // Analytics
  const wordCount = writing.trim() === '' ? 0 : writing.trim().split(/\s+/).length;
  const goal = 500;

  // Pomodoro timer state and logic
  // 'focus': focus session; 'break': break session; 'paused': paused timer; 'idle': not started
  const [pomodoroStatus, setPomodoroStatus] = useState('idle'); // 'focus' | 'break' | 'paused' | 'idle'
  const [timer, setTimer] = useState(25 * 60); // seconds left
  const [pomodoroMode, setPomodoroMode] = useState('focus'); // distinguishes between focus and break visually
  const [intervalId, setIntervalId] = useState(null);

  // Print mode
  const [printMode, setPrintMode] = useState(false);

  // Example static sound URLs
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

  // Soundscape handlers
  const handlePlaySound = (soundKey) => {
    // If a sound is already playing, stop it
    if (howlObj) howlObj.stop();
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
  const handleStopSound = () => {
    if (howlObj) {
      howlObj.stop();
      setHowlObj(null);
      setCurrentSound(null);
      setIsPlaying(false);
    }
  };
  const handleChangeVolume = e => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (howlObj) {
      howlObj.volume(v);
    }
  };

  // Writing area contentEditable handlers
  // Handle input for live word count
  const handleWritingInput = (e) => {
    setWriting(e.target.innerText);
  };
  // Handle focus for subtle highlight
  const handleWritingFocus = () => setFocused(true);
  const handleWritingBlur = () => setFocused(false);

  // Print mode toggle
  const togglePrintMode = () => setPrintMode(v => !v);

  // Pomodoro timer durations
  const FOCUS_LENGTH = 25 * 60;
  const BREAK_LENGTH = 5 * 60;

  // PUBLIC_INTERFACE
  // Start or resume pomodoro timer
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
  // Pause the timer
  const handlePausePomodoro = () => {
    setPomodoroStatus('paused');
  };

  // PUBLIC_INTERFACE
  // Reset the timer to initial state
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
  // Switch to break mode manually
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
      // Only create interval if timer > 0
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
    // Cleanup interval when component unmounts
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
            <button className={printMode ? "btn btn-active" : "btn"} onClick={togglePrintMode}>
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
          minHeight: "100%",
        }}>
          {/* Pomodoro Timer Shell */}
          <div
            className="sidebar-pomodoro"
            style={{
              width: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 12
            }}
          >
            <span style={{
              fontSize: 17,
              color: pomodoroStatus === "break" ? "#8FBCBB" : "#A3BE8C",
              marginBottom: 4
            }}>
              <span role="img" aria-label="Pomodoro">⏲️</span>
            </span>
            <div style={{
              fontSize: 13,
              color: "#fff",
            }}>{pomodoroStatus === "break" ? "Break" : pomodoroStatus === "running" ? "Focus" : "Idle"}</div>
            <div style={{
              fontSize: 15,
              marginTop: 2,
              color: "#A3BE8C",
              fontWeight: 600,
            }}>{formatTime(timer)}</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
              {pomodoroStatus !== 'running' && (
                <button className="btn" title="Start Pomodoro" style={{ padding: 3, fontSize: 15, width: 28, height: 28, borderRadius: 6 }} onClick={handleStartPomodoro}>
                  ▶️
                </button>
              )}
              {pomodoroStatus === 'running' && (
                <button className="btn" title="Stop" style={{ padding: 3, fontSize: 14, width: 28, height: 28, borderRadius: 6, background: "#CE5454" }} onClick={handleStopPomodoro}>
                  ⏹
                </button>
              )}
              <button className="btn" title="Break" style={{ padding: 3, fontSize: 14, width: 28, height: 28, borderRadius: 6, background: "#8FBCBB" }} onClick={handleBreakPomodoro}>
                ☕
              </button>
            </div>
          </div>
          {/* Soundscape Section */}
          <div style={{ width: "44px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 21, color: "#A3BE8C", marginBottom: 10 }}>
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
                aria-label={sounds[skey].label}
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
                borderRadius: 14,
                fontSize: 17,
                marginTop: 5,
                color: "#A3BE8C",
                width: 32,
                height: 32,
                padding: 3
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
                borderRadius: 14,
                fontSize: 13,
                marginTop: 2,
                color: "#A3BE8C",
                width: 32,
                height: 32,
                padding: 3
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
              aria-label="Soundscape Volume"
            />
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
              transition: "outline-color 0.2s"
            }}
            contentEditable={!printMode}
            suppressContentEditableWarning={true}
            spellCheck={true}
            aria-label="SerenityWrite main writing area"
            tabIndex={0}
            onInput={handleWritingInput}
            onFocus={handleWritingFocus}
            onBlur={handleWritingBlur}
            role="textbox"
          >
            {writing.length === 0 && !printMode && (
              <span style={{ opacity: 0.36, fontStyle: "italic", userSelect: "none" }}>[ Start writing here... ]</span>
            )}
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
              color: pomodoroStatus === "break" ? "#8FBCBB" : "#B48EAD",
              fontSize: 15,
              minWidth: 87
            }}>
              <span role="img" aria-label="Timer">⏰</span> {formatTime(timer)}
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
              {pomodoroStatus === 'idle'
                ? "Ready to focus"
                : pomodoroStatus === 'running'
                  ? "Session in progress"
                  : "On break"}
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
