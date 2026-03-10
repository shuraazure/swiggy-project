import React, { useState, useEffect } from 'react';
import { Package, MapPin, Truck, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, RefreshCcw, Radio, Navigation } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { getRandomRider } from '../data/mockData';
import './LogisticsPanel.css';

const API_BASE = "http://localhost:8080/api/telemetry";

const LogisticsPanel = ({ activeOrders, refreshOrders }) => {
    const [gpsEnabled, setGpsEnabled] = useState(false);

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

    const statuses = ["Placed", "Preparing", "Picked Up", "Delivered"];

    const handleStatusChange = (orderId, oldStatus, newStatus, riderId) => {
        sendLogisticsEvent("order_status_update", {
            order_id: orderId,
            customer_id: activeOrders[orderId].customer_id,
            restaurant_id: activeOrders[orderId].restaurant_id,
            rider_id: riderId,
            status: newStatus
        });

        refreshOrders(orderId, { status: newStatus });

        if (newStatus === "Delivered") {
            sendLogisticsEvent("order_delivered", {
                order_id: orderId,
                customer_id: activeOrders[orderId].customer_id,
                restaurant_id: activeOrders[orderId].restaurant_id,
                rider_id: riderId,
                status: "Delivered"
            });
            setTimeout(() => refreshOrders(orderId, null), 2000);
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
            <div className="panel-header glass-panel">
                <div className="title-area">
                    <h3>Dispatcher Dashboard</h3>
                    <span className="subtitle">Real-time Fleet Operations</span>
                </div>

                <div className={`gps-toggle ${gpsEnabled ? 'active' : ''}`} onClick={() => setGpsEnabled(!gpsEnabled)}>
                    <div className="toggle-icon">
                        {gpsEnabled ? (
                            <Radio size={16} className="pulse-icon" />
                        ) : (
                            <Navigation size={16} />
                        )}
                    </div>
                    <span>{gpsEnabled ? 'GPS Live' : 'GPS Off'}</span>
                </div>
            </div>

            <div className="orders-container">
                {Object.keys(activeOrders).length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <Package size={56} className="empty-icon" />
                            <div className="empty-pulse"></div>
                        </div>
                        <p>No Active Orders</p>
                        <span>Orders from the consumer app will appear here.</span>
                    </div>
                ) : (
                    Object.entries(activeOrders).map(([orderId, order], index) => {
                        const currentIndex = statuses.indexOf(order.status);

                        return (
                            <Tilt
                                key={orderId}
                                tiltMaxAngleX={2}
                                tiltMaxAngleY={2}
                                scale={1.01}
                                transitionSpeed={2000}
                                className="tilt-element"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="order-card fade-in-card">
                                    <div className="card-glow"></div>

                                    <div className="order-header">
                                        <div className="order-id-wrapper">
                                            <Package size={18} className="order-icon" />
                                            <div className="order-id">
                                                <span className="hash">#</span>{orderId}
                                            </div>
                                        </div>
                                        <div className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                                            {order.status === "Placed" && <Package size={12} />}
                                            {order.status === "Preparing" && <Truck size={12} />}
                                            {order.status === "Picked Up" && <Navigation size={12} />}
                                            {order.status === "Delivered" && <CheckCircle size={12} />}
                                            <span>{order.status}</span>
                                        </div>
                                    </div>

                                    <div className="rider-info">
                                        <Truck size={14} className="rider-icon" />
                                        <span>Assigned to:</span>
                                        <strong>{order.rider_id}</strong>
                                    </div>

                                    <div className="status-timeline">
                                        {statuses.map((status, index) => (
                                            <button
                                                key={status}
                                                className={`timeline-step ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}
                                                disabled={index <= currentIndex}
                                                onClick={() => handleStatusChange(orderId, order.status, status, order.rider_id)}
                                            >
                                                {index === 0 && <Package size={14} />}
                                                {index === 1 && <Truck size={14} />}
                                                {index === 2 && <Navigation size={14} />}
                                                {index === 3 && <CheckCircle size={14} />}
                                                <span>{status}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="edge-cases">
                                        <button className="btn-edge-case warn" onClick={() => handleReassign(orderId, order.rider_id)}>
                                            <RefreshCcw size={14} />
                                            <span>Reassign</span>
                                        </button>
                                        <button className="btn-edge-case danger" onClick={() => handleSlaBreach(orderId, order.status)}>
                                            <AlertTriangle size={14} />
                                            <span>SLA Breach</span>
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
