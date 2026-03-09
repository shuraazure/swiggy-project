const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// ============================================================
// LOCAL MOCK: "Fake Event Hub" — writes payloads to a local
// JSONL file. When you're ready for Azure, swap this function
// with the Azure Event Hubs SDK client.send() call.
// ============================================================
const LOG_FILE = path.join(__dirname, 'local_event_hub_log.jsonl');

const pushToEventHub = (hubName, enrichedPayload) => {
    // Tag which hub this goes to
    const record = { ...enrichedPayload, _eh_target: hubName };

    // 1) Write to local JSONL file (swap this line for Azure SDK later)
    fs.appendFileSync(LOG_FILE, JSON.stringify(record) + '\n');

    // 2) Broadcast to Live Terminal via WebSocket (always active for demo)
    io.emit('telemetry_stream', JSON.stringify(enrichedPayload, null, 2));

    console.log(`[Local Mock → ${hubName}] ${enrichedPayload.event_type || enrichedPayload.status}`);
};

// ============================================================
// ROUTE 1: Ads & Marketing → eh-user-behavior
// Schema: event_id | event_type | customer_id | ad_id |
//         restaurant_id | cart_value | timestamp
// ============================================================
app.post('/api/telemetry/ads', (req, res) => {
    const payload = req.body;

    if (!['impression', 'click'].includes(payload.event_type)) {
        return res.status(400).json({ error: "Invalid ad event_type" });
    }

    const enriched = {
        event_id: payload.event_id || `EVT-${Math.random().toString(36).substr(2, 9)}`,
        event_type: payload.event_type,
        customer_id: payload.customer_id,
        ad_id: payload.ad_id || null,
        restaurant_id: payload.restaurant_id || null,
        cart_value: null,
        timestamp: new Date().toISOString(),
        _metadata: { pipeline_route: "eh-user-behavior" }
    };

    pushToEventHub("eh-user-behavior", enriched);
    res.status(202).json({ status: "accepted" });
});

// ============================================================
// ROUTE 2: Cart & E-Commerce → eh-user-behavior
// Schema: event_id | event_type | customer_id | ad_id |
//         restaurant_id | cart_value | timestamp
// ============================================================
app.post('/api/telemetry/cart', (req, res) => {
    const payload = req.body;

    if (!['add_to_cart', 'flash_sale_triggered', 'checkout_completed'].includes(payload.event_type)) {
        return res.status(400).json({ error: "Invalid cart event_type" });
    }

    const enriched = {
        event_id: payload.event_id || `EVT-${Math.random().toString(36).substr(2, 9)}`,
        event_type: payload.event_type,
        customer_id: payload.customer_id,
        ad_id: null,
        restaurant_id: payload.restaurant_id || null,
        cart_value: payload.cart_value || null,
        timestamp: new Date().toISOString(),
        _metadata: { pipeline_route: "eh-user-behavior" }
    };

    pushToEventHub("eh-user-behavior", enriched);

    // Dual-dispatch: checkout also triggers an order_placed in Logistics
    if (payload.event_type === 'checkout_completed') {
        const orderPlaced = {
            order_id: payload.order_id || `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            customer_id: payload.customer_id,
            restaurant_id: payload.restaurant_id || null,
            rider_id: null,
            status: "Placed",
            gps_lat: null,
            gps_lon: null,
            timestamp: new Date().toISOString(),
            _metadata: { pipeline_route: "eh-logistics" }
        };
        pushToEventHub("eh-logistics", orderPlaced);
    }

    res.status(202).json({ status: "accepted" });
});

// ============================================================
// ROUTE 2.5: Advanced User Behavior → eh-user-behavior
// (search_filter_applied, group_order_started)
// ============================================================
app.post('/api/telemetry/user_behavior', (req, res) => {
    const payload = req.body;

    if (!['search_filter_applied', 'group_order_started'].includes(payload.event_type)) {
        return res.status(400).json({ error: "Invalid event_type for /user_behavior" });
    }

    const enriched = {
        event_id: payload.event_id || `EVT-${Math.random().toString(36).substr(2, 9)}`,
        event_type: payload.event_type,
        customer_id: payload.customer_id,
        ad_id: null,
        restaurant_id: payload.restaurant_id || null,
        cart_value: payload.cart_value || null,
        timestamp: new Date().toISOString(),
        _metadata: { pipeline_route: "eh-user-behavior" }
    };

    pushToEventHub("eh-user-behavior", enriched);
    res.status(202).json({ status: "accepted" });
});

// ============================================================
// ROUTE 3: Logistics → eh-logistics
// Schema: order_id | customer_id | restaurant_id | rider_id |
//         status | gps_lat | gps_lon | timestamp
// ============================================================
app.post('/api/telemetry/logistics', (req, res) => {
    const payload = req.body;

    const validStatuses = ['rider_gps_ping', 'order_status_update', 'rider_reassigned', 'order_delivered'];
    if (!validStatuses.includes(payload.event_type)) {
        return res.status(400).json({ error: "Invalid logistics event_type" });
    }

    const enriched = {
        order_id: payload.order_id,
        customer_id: payload.customer_id || null,
        restaurant_id: payload.restaurant_id || null,
        rider_id: payload.rider_id || null,
        status: payload.status,
        gps_lat: payload.gps_lat || null,
        gps_lon: payload.gps_lon || null,
        timestamp: new Date().toISOString(),
        _metadata: { pipeline_route: "eh-logistics" }
    };

    pushToEventHub("eh-logistics", enriched);
    res.status(202).json({ status: "accepted" });
});

// ============================================================
// UTILITY: View how many lines are in the local log
// ============================================================
app.get('/api/local-log/count', (req, res) => {
    if (!fs.existsSync(LOG_FILE)) return res.json({ count: 0 });
    const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
    res.json({ count: lines.length, log_file: LOG_FILE });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`\n✅ Backend Traffic Controller running on port ${PORT}`);
    console.log(`📁 Local Event Hub log: ${LOG_FILE}`);
    console.log(`   Swap pushToEventHub() with Azure SDK when ready for cloud!\n`);
});
