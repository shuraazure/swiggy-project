import React, { useState, useEffect } from 'react';
import { Package, MapPin, Truck, CheckCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { getRandomRider } from '../data/mockData';
import './LogisticsPanel.css';

const API_BASE = "http://localhost:8080/api/telemetry";

const LogisticsPanel = ({ activeOrders, refreshOrders }) => {
    const [gpsEnabled, setGpsEnabled] = useState(false);

    // Helper to send logistics telemetry
    const sendLogisticsEvent = (eventType, payload) => {
        fetch(`${API_BASE}/logistics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event_type: eventType,
                client_timestamp: new Date().toISOString(),
                ...payload
            })
        });
    };

    // Simulate GPS Pings
    useEffect(() => {
        let interval;
        if (gpsEnabled && Object.keys(activeOrders).length > 0) {
            interval = setInterval(() => {
                const orderIds = Object.keys(activeOrders);
                const randomOrderId = orderIds[Math.floor(Math.random() * orderIds.length)];
                const riderId = activeOrders[randomOrderId].rider_id;

                const lat = 12.9716 + (Math.random() * 0.02 - 0.01);
                const lon = 77.5946 + (Math.random() * 0.02 - 0.01);

                sendLogisticsEvent("rider_gps_ping", {
                    rider_id: riderId,
                    order_id: randomOrderId,
                    customer_id: activeOrders[randomOrderId].customer_id,
                    restaurant_id: activeOrders[randomOrderId].restaurant_id,
                    status: activeOrders[randomOrderId].status,
                    gps_lat: parseFloat(lat.toFixed(6)),
                    gps_lon: parseFloat(lon.toFixed(6))
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [gpsEnabled, activeOrders]);

    // Handle status progression
    const statuses = ["Placed", "Preparing", "Picked Up", "Delivered"];

    const handleStatusChange = (orderId, oldStatus, newStatus, riderId) => {
        // Send event to backend
        sendLogisticsEvent("order_status_update", {
            order_id: orderId,
            customer_id: activeOrders[orderId].customer_id,
            restaurant_id: activeOrders[orderId].restaurant_id,
            rider_id: riderId,
            status: newStatus
        });

        // Update local UI state
        refreshOrders(orderId, { status: newStatus });

        if (newStatus === "Delivered") {
            sendLogisticsEvent("order_delivered", {
                order_id: orderId,
                customer_id: activeOrders[orderId].customer_id,
                restaurant_id: activeOrders[orderId].restaurant_id,
                rider_id: riderId,
                status: "Delivered"
            });
            setTimeout(() => refreshOrders(orderId, null), 2000); // Remove after delay
        }
    };

    const handleReassign = (orderId, oldRiderId) => {
        const newRiderId = getRandomRider();

        sendLogisticsEvent("rider_reassigned", {
            order_id: orderId,
            customer_id: activeOrders[orderId].customer_id,
            restaurant_id: activeOrders[orderId].restaurant_id,
            rider_id: newRiderId,
            status: "Rider Reassigned"
        });

        refreshOrders(orderId, { rider_id: newRiderId });
    };

    const handleSlaBreach = (orderId, currentStatus) => {
        sendLogisticsEvent("sla_breach_flag", {
            order_id: orderId,
            current_status: currentStatus,
            delay_minutes: 45
        });
    };

    return (
        <div className="logistics-panel custom-scrollbar">
            <div className="panel-header">
                <div className="title-area">
                    <h3>Dispatcher Dashboard</h3>
                    <span className="subtitle">Real-time Operations & Logistics</span>
                </div>

                <div className={`gps-toggle ${gpsEnabled ? 'active' : ''}`} onClick={() => setGpsEnabled(!gpsEnabled)}>
                    <div className="toggle-icon">
                        {gpsEnabled ? <div className="pulse-dot"></div> : <MapPin size={16} />}
                    </div>
                    <span>{gpsEnabled ? 'GPS Broadcasting' : 'Hover GPS Disabled'}</span>
                </div>
            </div>

            <div className="orders-container">
                {Object.keys(activeOrders).length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} opacity={0.2} />
                        <p>No active orders.</p>
                        <span>Transactions in the Consumer App will appear here.</span>
                    </div>
                ) : (
                    Object.entries(activeOrders).map(([orderId, order]) => {
                        const currentIndex = statuses.indexOf(order.status);

                        return (
                            <Tilt key={orderId} tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={2000} className="tilt-element">
                                <div className="order-card animate-slide-up">
                                    <div className="order-header">
                                        <div className="order-id">
                                            <span className="hash">#</span>{orderId}
                                        </div>
                                        <div className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                                            {order.status}
                                        </div>
                                    </div>

                                    <div className="rider-info">
                                        <Truck size={14} /> Assigned to: <strong>{order.rider_id}</strong>
                                    </div>

                                    <div className="status-timeline">
                                        {statuses.map((status, index) => (
                                            <button
                                                key={status}
                                                className={`timeline-step ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}
                                                disabled={index <= currentIndex}
                                                onClick={() => handleStatusChange(orderId, order.status, status, order.rider_id)}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="edge-cases">
                                        <button className="btn-edge-case warn" onClick={() => handleReassign(orderId, order.rider_id)}>
                                            <RefreshCcw size={14} /> Reassign (SCD 2)
                                        </button>
                                        <button className="btn-edge-case danger" onClick={() => handleSlaBreach(orderId, order.status)}>
                                            <AlertTriangle size={14} /> Force SLA Breach
                                        </button>
                                    </div>
                                </div>
                            </Tilt>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LogisticsPanel;
