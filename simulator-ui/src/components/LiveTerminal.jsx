import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Activity, Circle } from 'lucide-react';
import { io } from 'socket.io-client';
import './LiveTerminal.css';

const SOCKET_URL = "http://localhost:8080";

const LiveTerminal = () => {
    const [events, setEvents] = useState([]);
    const terminalRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('telemetry_stream', (data) => {
            setEvents(prev => {
                const newEvents = [...prev, data];
                if (newEvents.length > 50) return newEvents.slice(newEvents.length - 50);
                return newEvents;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [events]);

    const handleClear = () => setEvents([]);

    return (
        <div className="live-terminal glass-panel">
            <div className="terminal-header">
                <div className="terminal-title">
                    <Terminal size={18} className="terminal-icon" />
                    <span className="title-text">Live Telemetry Stream</span>
                    <span className="title-badge">AZURE_EH</span>
                </div>
                <div className="terminal-actions">
                    <div className="status-indicator">
                        <Circle size={8} className={`dot ${isConnected ? 'pulse-green' : 'red'}`} fill="currentColor" />
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <button className="clear-btn" onClick={handleClear} title="Clear Stream">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="terminal-body custom-scrollbar" ref={terminalRef}>
                {events.length === 0 ? (
                    <div className="terminal-empty">
                        <Activity size={40} className="empty-activity-icon" />
                        <span className="prompt">$</span> awaiting_telemetry_events..._
                        <br />
                        <span className="dimmed">System initialized. Listening on port 8080...</span>
                    </div>
                ) : (
                    events.map((eventJSON, index) => {
                        const isLatest = index === events.length - 1;
                        const opacity = isLatest ? 1 : Math.max(0.4, 1 - (events.length - index) * 0.05);

                        let formattedStr = eventJSON;
                        try {
                            const obj = JSON.parse(eventJSON);
                            const metadata = obj._metadata?.pipeline_route || "UNKNOWN";
                            const formattedStrJSON = JSON.stringify(obj, null, 2);

                            return (
                                <div
                                    key={`evt-${index}`}
                                    className={`terminal-line ${isLatest ? 'highlight-new' : ''}`}
                                    style={{ opacity }}
                                >
                                    <span className="prompt">[RCVD {'<-'} {metadata}]</span>
                                    <pre style={{ margin: '4px 0 12px 0', color: 'inherit', fontFamily: 'inherit' }}>
                                        {formattedStrJSON}
                                    </pre>
                                </div>
                            );
                        } catch (e) {
                            return (
                                <div key={`evt-${index}`} className="terminal-line" style={{ opacity }}>
                                    <span className="prompt">[RCVD]</span> {eventJSON}
                                </div>
                            );
                        }
                    })
                )}
            </div>
        </div>
    );
};

export default LiveTerminal;
