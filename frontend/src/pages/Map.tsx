import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, FlipHorizontal, FlipVertical, RotateCw, Radio, History, Play, Pause, FastForward, Rewind, Activity, Download, FileJson, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PositionData {
    data: {
        mapId: number;
        pos: [number, number, number];
        posNoise: [number, number, number];
        time: number;
    };
    uid: string;
    deviceName: string;
    name: string;
}

interface HistoryLog {
    uid: string;
    deviceName: string;
    pos: [number, number, number];
    time: number;
}

interface Beacon {
    name: string;
    uid: string;
    type: number;
    coordinate: {
        coords: [number, number, number];
    };
}

interface StatsData {
    deviceName: string;
    totalDistance: number;
    movingTimeMinutes: number;
    interactions: number;
    interactionDetails?: Record<string, number>;
}

function calculateLocalStats(logs: HistoryLog[], proxDistance: number, minTime: number): Record<string, StatsData> {
    const stats: Record<string, StatsData> = {};

    // Group by UID
    const logsByUid: Record<string, HistoryLog[]> = {};
    for (const log of logs) {
        if (!logsByUid[log.uid]) {
            logsByUid[log.uid] = [];
        }
        logsByUid[log.uid].push(log);
    }

    for (const uid in logsByUid) {
        const userLogs = logsByUid[uid];
        // Sort chronologically just in case
        userLogs.sort((a, b) => a.time - b.time);

        let totalDist = 0;
        let movingTimeMs = 0;

        if (userLogs.length === 0) continue;

        const deviceName = userLogs[0].deviceName || uid;

        for (let i = 1; i < userLogs.length; i++) {
            const prev = userLogs[i - 1];
            const curr = userLogs[i];

            const dx = curr.pos[0] - prev.pos[0];
            const dy = curr.pos[1] - prev.pos[1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            const timeDiff = curr.time - prev.time;

            if (timeDiff > 5000) continue; // offline gap
            if (timeDiff <= 0) continue;

            const speed = dist / (timeDiff / 1000.0);

            if (speed > 0.05) { // 5 cm/s threshold
                totalDist += dist;
                movingTimeMs += timeDiff;
            }
        }

        stats[uid] = {
            deviceName,
            totalDistance: Number(totalDist.toFixed(2)),
            movingTimeMinutes: Number((movingTimeMs / 1000.0 / 60.0).toFixed(2)),
            interactions: 0,
            interactionDetails: {}
        };
    }

    // Interaction stats
    const timeline = [...logs].sort((a, b) => a.time - b.time);
    const currentPositions: Record<string, HistoryLog> = {};
    const pairProxStart: Record<string, number> = {}; 
    const pairInteracted: Record<string, boolean> = {}; 

    for (const event of timeline) {
        currentPositions[event.uid] = event;

        // Compare this UID with all other active UIDs
        const uids = Object.keys(currentPositions);
        for (const otherUid of uids) {
            if (otherUid === event.uid) continue;

            const otherLog = currentPositions[otherUid];
            
            if (event.time - otherLog.time > 5000) {
                const pairId = [event.uid, otherUid].sort().join('-');
                delete pairProxStart[pairId];
                delete pairInteracted[pairId];
                continue;
            }

            const dx = event.pos[0] - otherLog.pos[0];
            const dy = event.pos[1] - otherLog.pos[1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const pairId = [event.uid, otherUid].sort().join('-');

            if (dist <= proxDistance) {
                if (!pairProxStart[pairId]) {
                    pairProxStart[pairId] = event.time;
                } else {
                    const durationMs = event.time - pairProxStart[pairId];
                    if (durationMs >= minTime * 1000 && !pairInteracted[pairId]) {
                        if (stats[event.uid]) {
                            stats[event.uid].interactions++;
                            stats[event.uid].interactionDetails![otherUid] = (stats[event.uid].interactionDetails![otherUid] || 0) + 1;
                        }
                        if (stats[otherUid]) {
                            stats[otherUid].interactions++;
                            stats[otherUid].interactionDetails![event.uid] = (stats[otherUid].interactionDetails![event.uid] || 0) + 1;
                        }
                        pairInteracted[pairId] = true; 
                    }
                }
            } else {
                delete pairProxStart[pairId];
                delete pairInteracted[pairId];
            }
        }
    }

    return stats;
}

export default function MapPage() {
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // --- Settings & Beacons ---
    // Offset and Size
    // Offset and Size
    const [mapWidth, setMapWidth] = useState(() => {
        const saved = localStorage.getItem('mapWidth');
        return saved ? parseFloat(saved) : 10.0;
    });
    const [mapHeight, setMapHeight] = useState(() => {
        const saved = localStorage.getItem('mapHeight');
        return saved ? parseFloat(saved) : 10.0;
    });

    // Default offsets to 0, or read from storage
    const [offsetX, setOffsetX] = useState(() => {
        const saved = localStorage.getItem('offsetX');
        return saved ? parseFloat(saved) : -2.0;
    });
    const [offsetY, setOffsetY] = useState(() => {
        const saved = localStorage.getItem('offsetY');
        return saved ? parseFloat(saved) : -2.0;
    });

    // Background Image State
    const [bgWidth, setBgWidth] = useState(() => {
        const saved = localStorage.getItem('bgWidth');
        return saved ? parseFloat(saved) : 10.0;
    });
    const [bgHeight, setBgHeight] = useState(() => {
        const saved = localStorage.getItem('bgHeight');
        return saved ? parseFloat(saved) : 10.0;
    });
    const [bgOffsetX, setBgOffsetX] = useState(() => {
        const saved = localStorage.getItem('bgOffsetX');
        return saved ? parseFloat(saved) : 0;
    });
    const [bgOffsetY, setBgOffsetY] = useState(() => {
        const saved = localStorage.getItem('bgOffsetY');
        return saved ? parseFloat(saved) : 0;
    });
    const [bgOpacity, setBgOpacity] = useState(() => {
        const saved = localStorage.getItem('bgOpacity');
        return saved ? parseFloat(saved) : 1.0;
    });

    const [tagMappings, setTagMappings] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('tagMappings');
        return saved ? JSON.parse(saved) : {};
    });

    const [proxDistance, setProxDistance] = useState(() => {
        const saved = localStorage.getItem('proxDistance');
        return saved ? parseFloat(saved) : 1.5;
    });
    const [minTime, setMinTime] = useState(() => {
        const saved = localStorage.getItem('minTime');
        return saved ? parseInt(saved) : 5;
    });

    useEffect(() => {
        const handleStorage = () => {
            setMapWidth(parseFloat(localStorage.getItem('mapWidth') || "10"));
            setMapHeight(parseFloat(localStorage.getItem('mapHeight') || "10"));
            setOffsetX(parseFloat(localStorage.getItem('offsetX') || "-2"));
            setOffsetY(parseFloat(localStorage.getItem('offsetY') || "-2"));

            setBgWidth(parseFloat(localStorage.getItem('bgWidth') || "10"));
            setBgHeight(parseFloat(localStorage.getItem('bgHeight') || "10"));
            setBgOffsetX(parseFloat(localStorage.getItem('bgOffsetX') || "0"));
            setBgOffsetY(parseFloat(localStorage.getItem('bgOffsetY') || "0"));
            setBgOpacity(parseFloat(localStorage.getItem('bgOpacity') || "1.0"));

            setFlipX(localStorage.getItem('flipX') === 'true');
            setFlipY(localStorage.getItem('flipY') === 'true');
            setRotation(parseInt(localStorage.getItem('rotation') || '0'));

            const savedMappings = localStorage.getItem('tagMappings');
            if (savedMappings) setTagMappings(JSON.parse(savedMappings));
            
            setProxDistance(parseFloat(localStorage.getItem('proxDistance') || "1.5"));
            setMinTime(parseInt(localStorage.getItem('minTime') || "5"));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);



    const [flipX, setFlipX] = useState(() => localStorage.getItem('flipX') === 'true');
    const [flipY, setFlipY] = useState(() => localStorage.getItem('flipY') === 'true');
    const [rotation, setRotation] = useState(() => parseInt(localStorage.getItem('rotation') || '0'));
    const [beacons, setBeacons] = useState<Beacon[]>([]);

    const fetchBeacons = async () => {
        try {
            const response = await fetch(`${window.location.protocol}//${window.location.hostname}:8088/openapi/v1/devices?deviceType=2`);
            const result = await response.json();
            if (result.data && result.data.records) {
                const fetchedBeacons = result.data.records as Beacon[];
                setBeacons(fetchedBeacons);
                // No auto-resize anymore
            }
        } catch (error) {
            console.error('Error fetching beacons:', error);
        }
    };

    // Initial load
    useEffect(() => {
        fetchBeacons();
    }, []);

    // --- State: View Mode ---
    const [viewMode, setViewMode] = useState<'live' | 'history'>('live');

    // --- Live Mode Logic ---
    const [livePositions, setLivePositions] = useState<Record<string, PositionData>>({});
    const [lastUpdateTimes, setLastUpdateTimes] = useState<Record<string, number>>({});
    const [isConnected, setIsConnected] = useState(false);

    // Interaction trackers for visual representation
    const activeProximityRef = useRef<Record<string, number>>({}); 
    const interactionFlashedRef = useRef<Record<string, boolean>>({}); 
    const flashingUntilRef = useRef<Record<string, number>>({}); 

    useEffect(() => {
        if (viewMode !== 'live') {
            setIsConnected(false);
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);
        ws.onmessage = (event) => {
            try {
                const data: PositionData = JSON.parse(event.data);
                if (data.uid) {
                    setLivePositions(prev => ({ ...prev, [data.uid]: data }));
                    setLastUpdateTimes(prev => ({ ...prev, [data.uid]: Date.now() }));
                }
            } catch (e) { console.error(e); }
        };

        const interval = setInterval(() => {
            // Force re-render for offline status
            setLastUpdateTimes(prev => ({ ...prev }));
        }, 1000);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, [viewMode]);

    // --- History Mode Logic ---
    const [historyData, setHistoryData] = useState<HistoryLog[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [playbackTime, setPlaybackTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [historyPositions, setHistoryPositions] = useState<Record<string, HistoryLog>>({});
    const animationRef = useRef<number | null>(null);

    const fetchHistory = async () => {
        if (!startDate || !endDate) return alert('Seleccione rango de fechas');
        const startTs = new Date(startDate).getTime();
        const endTs = new Date(endDate).getTime();
        try {
            const res = await fetch(`/api/history?start=${startTs}&end=${endTs}`);
            const data = await res.json();
            setHistoryData(data);
            if (data.length > 0) {
                setPlaybackTime(startTs);
                alert(`Cargados ${data.length} puntos históricos.`);
            } else {
                alert('No hay datos en este rango.');
            }

            // Stats are now automatically calculated locally via useEffect depending on time window
        } catch (e) {
            console.error(e);
            alert('Error cargando historial');
        }
    };

    // Playback Loop
    useEffect(() => {
        if (!isPlaying || historyData.length === 0) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        let lastFrameTime = performance.now();

        const animate = (time: number) => {
            const delta = time - lastFrameTime;
            lastFrameTime = time;

            setPlaybackTime(prev => {
                const nextTime = prev + (delta * playbackSpeed);
                const endTs = new Date(endDate).getTime();
                if (nextTime >= endTs) {
                    setIsPlaying(false);
                    return endTs;
                }
                return nextTime;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, historyData, endDate, playbackSpeed]);

    // Update positions based on playbackTime
    useEffect(() => {
        if (viewMode === 'history' && historyData.length > 0) {
            const active: Record<string, HistoryLog> = {};
            for (const log of historyData) {
                if (log.time <= playbackTime) {
                    active[log.uid] = log;
                } else {
                    break;
                }
            }
            setHistoryPositions(active);
        }
    }, [playbackTime, historyData, viewMode]);


    // --- Stats Logic ---
    const [stats, setStats] = useState<Record<string, StatsData>>({});

    const fetchStats = async (start: number, end: number) => {
        try {
            const res = await fetch(`/api/stats?start=${start}&end=${end}`);
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error("Error fetching stats:", e);
        }
    };

    // Calculate local stats automatically for history view
    useEffect(() => {
        if (viewMode === 'history' && historyData.length > 0 && startDate && endDate) {
            const startTs = new Date(startDate).getTime();
            const endTs = new Date(endDate).getTime();
            const filteredData = historyData.filter(log => log.time >= startTs && log.time <= endTs);
            setStats(calculateLocalStats(filteredData, proxDistance, minTime));
        }
    }, [historyData, startDate, endDate, viewMode, proxDistance, minTime]);

    // Auto-fetch stats for live mode (last hour)
    useEffect(() => {
        let interval: any;
        if (viewMode === 'live') {
            const updateLiveStats = () => {
                const now = Date.now();
                const oneHourAgo = now - 3600000; // 1 hour
                fetchStats(oneHourAgo, now);
            };

            updateLiveStats(); // Initial call
            interval = setInterval(updateLiveStats, 10000); // Update every 10s
        }
        return () => clearInterval(interval);
    }, [viewMode]);

    // --- Render Helpers ---
    // NO PADDING anymore, precise manual control
    // User sees [offsetX, offsetX + mapSize]

    // Normalized Coordinate Calculation
    const getNormalized = (x: number, y: number) => {
        // Raw normalized 0..1 relative to view
        let nx = (x - offsetX) / mapWidth;
        let ny = (y - offsetY) / mapHeight;

        // Clamp only for drawing outside? Or just let it flow out? 
        // User wants fixed view.

        if (flipX) nx = 1 - nx;
        if (flipY) ny = 1 - ny;

        let finalX = nx;
        let finalY = ny;

        switch (rotation) {
            case 90: finalX = ny; finalY = 1 - nx; break;
            case 180: finalX = 1 - nx; finalY = 1 - ny; break;
            case 270: finalX = 1 - ny; finalY = nx; break;
        }
        return { x: finalX * 100, y: finalY * 100 };
    };

    const displayPositions = viewMode === 'live'
        ? Object.values(livePositions).map(p => ({
            uid: p.uid,
            deviceName: p.deviceName,
            x: p.data.pos[0],
            y: p.data.pos[1],
            isOffline: (Date.now() - (lastUpdateTimes[p.uid] || 0)) > 5000
        }))
        : Object.values(historyPositions).map(p => ({
            uid: p.uid,
            deviceName: p.deviceName,
            x: p.pos[0],
            y: p.pos[1],
            isOffline: (playbackTime - p.time) > 5000
        }));

    // Real-time or simulated continuous interaction tracker
    const currentTime = viewMode === 'live' ? Date.now() : playbackTime;
    
    for (let i = 0; i < displayPositions.length; i++) {
        for (let j = i + 1; j < displayPositions.length; j++) {
            const tagA = displayPositions[i];
            const tagB = displayPositions[j];
            const pairId = [tagA.uid, tagB.uid].sort().join('-');

            if (tagA.isOffline || tagB.isOffline) {
                delete activeProximityRef.current[pairId];
                delete interactionFlashedRef.current[pairId];
                continue;
            }

            const dx = tagA.x - tagB.x;
            const dy = tagA.y - tagB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= proxDistance) {
                if (!activeProximityRef.current[pairId]) {
                    activeProximityRef.current[pairId] = currentTime;
                } else {
                    const elapsed = currentTime - activeProximityRef.current[pairId];
                    if (elapsed >= minTime * 1000 && !interactionFlashedRef.current[pairId]) {
                        flashingUntilRef.current[tagA.uid] = currentTime + 1000;
                        flashingUntilRef.current[tagB.uid] = currentTime + 1000;
                        interactionFlashedRef.current[pairId] = true;
                    }
                }
            } else {
                delete activeProximityRef.current[pairId];
                delete interactionFlashedRef.current[pairId];
            }
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] flex gap-4 font-sans">
            {/* Main Column */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto pb-2 pr-2">
                {/* Header */}
                <header className="shrink-0 mb-4 flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {viewMode === 'live' ? <Wifi className="text-green-500" /> : <History className="text-blue-500" />}
                            {viewMode === 'live' ? 'Monitoreo en Vivo' : 'Reproducción Histórica'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                            <button
                                onClick={() => setViewMode('live')}
                                className={`px-4 py-2 rounded-md transition-all ${viewMode === 'live' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                En Vivo
                            </button>
                            <button
                                onClick={() => setViewMode('history')}
                                className={`px-4 py-2 rounded-md transition-all ${viewMode === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Historial
                            </button>
                        </div>
                        {viewMode === 'live' && (
                            <div className={`flex items-center px-3 py-1 rounded-full border text-sm ${isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {isConnected ? 'Conectado' : 'Desconectado'}
                            </div>
                        )}
                    </div>
                </header>

                {/* History Controls */}
                {viewMode === 'history' && (
                    <div className="shrink-0 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Inicio</label>
                            <input
                                type="datetime-local"
                                className="border rounded-md px-3 py-2 text-sm"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Fin</label>
                            <input
                                type="datetime-local"
                                className="border rounded-md px-3 py-2 text-sm"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchHistory}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition"
                        >
                            Cargar Datos
                        </button>

                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

                        <button
                            onClick={() => {
                                if (historyData.length === 0) return alert('No hay datos para descargar');
                                setShowDownloadModal(true);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700 transition flex items-center gap-2"
                        >
                            <span className="hidden sm:inline">Descargar</span>
                        </button>

                        <label className="bg-orange-500 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-orange-600 transition flex items-center gap-2 cursor-pointer">
                            <span className="hidden sm:inline">Cargar</span>
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        try {
                                            const json = JSON.parse(event.target?.result as string);
                                            if (Array.isArray(json)) {
                                                setHistoryData(json);
                                                if (json.length > 0) {
                                                    // Find range in data
                                                    const times = json.map((d: any) => d.time);
                                                    const minTime = Math.min(...times);
                                                    const maxTime = Math.max(...times);

                                                    // Update UI inputs (approximate, local string format is tricky but we try)
                                                    // A proper robust solution would handle timezone offset carefully:
                                                    const toLocalInput = (ts: number) => {
                                                        const d = new Date(ts);
                                                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                                        return d.toISOString().slice(0, 16);
                                                    }

                                                    setStartDate(toLocalInput(minTime));
                                                    setEndDate(toLocalInput(maxTime));
                                                    setPlaybackTime(minTime);

                                                    // Stats are calculated automatically via useEffect
                                                    
                                                    alert(`Cargados ${json.length} puntos desde archivo.`);
                                                }
                                            } else {
                                                alert('Formato de archivo inválido');
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert('Error al leer el archivo');
                                        }
                                    };
                                    reader.readAsText(file);
                                }}
                            />
                        </label>

                        {historyData.length > 0 && (
                            <div className="flex-1 flex items-center gap-4 ml-4">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                                </button>

                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min={new Date(startDate).getTime()}
                                        max={new Date(endDate).getTime()}
                                        value={playbackTime}
                                        onChange={e => {
                                            setPlaybackTime(Number(e.target.value));
                                            setIsPlaying(false);
                                        }}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                                        <span>{new Date(playbackTime).toLocaleTimeString()}</span>
                                        <span>{playbackSpeed}x</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border">
                                    <button
                                        onClick={() => setPlaybackSpeed(s => {
                                            const speeds = [1, 2, 4, 8, 16];
                                            const idx = speeds.indexOf(s);
                                            if (idx === -1) return 1;
                                            return idx > 0 ? speeds[idx - 1] : 1;
                                        })}
                                        className="flex flex-col items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition"
                                        disabled={playbackSpeed === 1}
                                        title="Reducir velocidad"
                                    >
                                        <Rewind className="w-4 h-4" />
                                    </button>

                                    <div className="text-xs font-bold text-blue-600 w-8 text-center select-none">
                                        {playbackSpeed}x
                                    </div>

                                    <button
                                        onClick={() => setPlaybackSpeed(s => {
                                            const speeds = [1, 2, 4, 8, 16];
                                            const idx = speeds.indexOf(s);
                                            if (idx === -1) return 2;
                                            return idx < speeds.length - 1 ? speeds[idx + 1] : 16;
                                        })}
                                        className="flex flex-col items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition"
                                        disabled={playbackSpeed === 16}
                                        title="Aumentar velocidad"
                                    >
                                        <FastForward className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Map Area */}
                <div className="shrink-0 flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden flex flex-col items-center justify-center p-8 min-h-[650px] lg:min-h-[750px]">


                    <div
                        className="relative bg-gray-50 border-2 border-gray-200 rounded-lg shadow-inner select-none transition-all duration-300 overflow-hidden shrink-0"
                        style={{ width: '100%', maxWidth: '80vh', aspectRatio: `${mapWidth}/${mapHeight * 0.9}` }}
                    >
                        {/* Background Image */}
                        <img
                            src="/Fondo.png?v=updated"
                            alt="Background"
                            className="absolute pointer-events-none transition-all duration-300"
                            style={{
                                width: `${(bgWidth / mapWidth) * 100}%`,
                                height: `${(bgHeight / mapHeight) * 100}%`,
                                left: `${((bgOffsetX - offsetX) / mapWidth) * 100}%`,
                                bottom: `${((bgOffsetY - offsetY) / mapHeight) * 100}%`,
                                opacity: bgOpacity,
                                maxWidth: 'none'
                            }}
                        />
                        {/* Grid */}
                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-10">
                            {Array.from({ length: 16 }).map((_, i) => <div key={i} className="border border-gray-400"></div>)}
                        </div>

                        {/* Beacons */}
                        {beacons.map((beacon) => {
                            const { x, y } = getNormalized(beacon.coordinate.coords[0], beacon.coordinate.coords[1]);
                            return (
                                <div key={beacon.uid || beacon.name} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 translate-y-1/2" style={{ left: `${x}%`, bottom: `${y}%` }}>
                                    <div className="p-1 bg-gray-700 rounded-sm shadow-md border border-white z-10"><Radio className="w-3 h-3 text-white" /></div>
                                    <div className="mt-1 px-1 py-0.5 bg-white/90 rounded text-[9px] font-bold text-gray-600 shadow-sm">{beacon.name}</div>
                                </div>
                            );
                        })}

                        {/* Tags */}
                        {displayPositions.map((tag) => {
                            const { x, y } = getNormalized(tag.x, tag.y);
                            const displayName = tagMappings[tag.deviceName] || tag.deviceName;
                            const isFlashing = (flashingUntilRef.current[tag.uid] || 0) > currentTime;

                            return (
                                <div
                                    key={tag.uid}
                                    className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 translate-y-1/2 transition-all duration-300 ease-linear ${tag.isOffline ? 'opacity-40 grayscale' : 'opacity-100'}`}
                                    style={{ left: `${x}%`, bottom: `${y}%` }}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 shadow-md relative z-10 ${isFlashing ? 'bg-green-500 border-green-200 animate-pulse ring-4 ring-green-500/50 scale-125' : tag.isOffline ? 'bg-gray-400 border-white' : 'bg-blue-600 border-white animate-pulse'}`}></div>
                                    <div className={`mt-1 px-2 py-0.5 bg-white/90 backdrop-blur border rounded text-[10px] font-bold shadow-sm whitespace-nowrap z-20 ${isFlashing ? 'border-green-500 text-green-700' : 'border-gray-200 text-gray-700'}`}>
                                        {displayName}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-mono bg-white/80 px-1 rounded mt-0.5">
                                        ({Number(tag.x).toFixed(2)}, {Number(tag.y).toFixed(2)})
                                    </div>
                                </div>
                            );
                        })}

                        {/* Origin Label */}
                        <div className="absolute bottom-2 left-2 text-xs font-mono text-gray-400 font-bold bg-white/50 px-1 rounded">
                            ({offsetX.toFixed(1)}, {offsetY.toFixed(1)})
                        </div>
                        {/* Top Right Label (Max) */}
                        <div className="absolute top-2 right-2 text-xs font-mono text-gray-400 font-bold bg-white/50 px-1 rounded">
                            ({(offsetX + mapWidth).toFixed(1)}, {(offsetY + mapHeight).toFixed(1)})
                        </div>
                    </div>

                    {/* Manual Correction Readout */}
                    <div className="mt-4 flex gap-6 text-xs font-mono text-gray-500 bg-gray-50 px-4 py-2 rounded-full border">
                        <div>
                            <span className="font-bold">SIZE:</span> {mapWidth.toFixed(2)}x{mapHeight.toFixed(2)}m
                        </div>
                        <div>
                            <span className="font-bold">OFFSET X:</span> {offsetX.toFixed(2)}m
                        </div>
                        <div>
                            <span className="font-bold">OFFSET Y:</span> {offsetY.toFixed(2)}m
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Sidebar */}
            <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 text-gray-800">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">Estadísticas</h3>
                </div>

                <div className="space-y-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {viewMode === 'live' ? 'Última Hora' : 'Rango Seleccionado'}
                    </div>

                    {Object.keys(stats).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No hay datos suficientes para generar estadísticas.</p>
                    ) : (
                        Object.entries(stats).map(([uid, stat]) => {
                            const displayName = tagMappings[stat.deviceName] || stat.deviceName;
                            return (
                                <div key={uid} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-bold text-gray-800">{displayName}</span>
                                        <span className="text-xs bg-white border px-1.5 py-0.5 rounded text-gray-500">ID: {uid}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-0.5">Tiempo en Movimiento</div>
                                            <div className="font-mono font-bold text-gray-900 text-lg">
                                                {stat.movingTimeMinutes} <span className="text-sm text-gray-500 font-normal">min</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-0.5">Distancia Recorrida</div>
                                            <div className="font-mono font-bold text-gray-900 text-lg">
                                                {stat.totalDistance} <span className="text-sm text-gray-500 font-normal">m</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-0.5">Interacciones</div>
                                            <div className="font-mono font-bold text-gray-900 text-lg flex items-baseline gap-1">
                                                {stat.interactions !== undefined ? stat.interactions : '-'} <span className="text-sm text-gray-500 font-normal">encuentros totales</span>
                                            </div>
                                            {stat.interactionDetails && Object.keys(stat.interactionDetails).length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {Object.entries(stat.interactionDetails).map(([otherUid, count]) => {
                                                        const resolvedName = stats[otherUid]?.deviceName || otherUid;
                                                        const otherDisplayName = tagMappings[resolvedName] || resolvedName;
                                                        return (
                                                            <div key={otherUid} className="flex justify-between items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">
                                                                <span>Con <span className="font-semibold">{otherDisplayName}</span></span>
                                                                <span className="font-bold bg-white px-1.5 py-0.5 rounded shadow-sm">{count}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Download Modal */}
            {showDownloadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Download className="w-5 h-5 text-blue-600" />
                                Opciones de Descarga
                            </h3>
                            <button
                                onClick={() => setShowDownloadModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Seleccione el formato en el que desea descargar los datos históricos:
                            </p>
                            
                            <button
                                onClick={() => {
                                    const startTs = startDate ? new Date(startDate).getTime() : 0;
                                    const endTs = endDate ? new Date(endDate).getTime() : Infinity;
                                    const filteredData = historyData.filter(log => log.time >= startTs && log.time <= endTs);

                                    const jsonString = JSON.stringify(filteredData, null, 2);
                                    const blob = new Blob([jsonString], { type: "application/json" });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `historial_${startDate.replace(/[:.]/g, '-')}_${endDate.replace(/[:.]/g, '-')}.json`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setShowDownloadModal(false);
                                }}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-left group"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition shrink-0">
                                    <FileJson className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">Formato JSON</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Ideal para <span className="font-semibold text-gray-700">volver a cargar los datos</span> en esta misma página en el futuro. Conserva toda la estructura interna.
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    const startTs = startDate ? new Date(startDate).getTime() : 0;
                                    const endTs = endDate ? new Date(endDate).getTime() : Infinity;
                                    const filteredData = historyData.filter(log => log.time >= startTs && log.time <= endTs);

                                    // Process filteredData to flattened structure for Excel
                                    const flattenedData = filteredData.map(log => ({
                                        Fecha: new Date(log.time).toLocaleDateString(),
                                        Hora: new Date(log.time).toLocaleTimeString(),
                                        Dispositivo: tagMappings[log.deviceName] || log.deviceName || log.uid,
                                        "ID Único": log.uid,
                                        "Posición X": Number(log.pos[0].toFixed(2)),
                                        "Posición Y": Number(log.pos[1].toFixed(2))
                                    }));

                                    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
                                    const workbook = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
                                    
                                    XLSX.writeFile(workbook, `historial_${startDate.replace(/[:.]/g, '-')}_${endDate.replace(/[:.]/g, '-')}.xlsx`);
                                    setShowDownloadModal(false);
                                }}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition text-left group"
                            >
                                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition shrink-0">
                                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">Formato Excel (.xlsx)</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Ideal para <span className="font-semibold text-gray-700">crear gráficos y analizar los datos</span> en Microsoft Excel, Google Sheets, etc.
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
