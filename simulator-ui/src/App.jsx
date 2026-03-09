import React, { useState } from 'react';
import CustomerApp from './components/CustomerApp';
import LogisticsPanel from './components/LogisticsPanel';
import LiveTerminal from './components/LiveTerminal';
import { Smartphone, PackageCheck, Zap } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { getRandomCustomer, getRandomRider } from './data/mockData';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('consumer');
  const [activeOrders, setActiveOrders] = useState({});
  const [customerId] = useState(getRandomCustomer());

  // We no longer manage event history in App.jsx.
  // The backend pushes directly to LiveTerminal.jsx via WebSockets.

  // E-Commerce Actions (Checkout)
  const handleCheckout = (cartValue) => {
    // Generate order matching what the backend sees
    // (In reality, backend should return this order ID, but for the simulator we generate it quickly)
    const orderId = `ORD${Math.floor(Math.random() * 90000) + 10000}`;
    const riderId = getRandomRider();

    // Add to local state so the dispatcher panel sees it immediately
    setActiveOrders(prev => ({
      ...prev,
      [orderId]: {
        status: "Placed",
        rider_id: riderId,
        customer_id: customerId,
        restaurant_id: "R001",
        placed_at: new Date().toISOString()
      }
    }));
  };

  // Dispatcher Sync Actions (Logistics Panel uses this to update local state after successfully pinging backend)
  const refreshOrders = (orderId, updates) => {
    if (!updates) {
      // Complete removal
      setActiveOrders(prev => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
      return;
    }

    setActiveOrders(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], ...updates }
    }));
  };

  return (
    <div className="layout-wrapper">
      {/* Background shapes for aesthetic */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="main-container">
        {/* Navigation Sidebar */}
        <nav className="side-nav glass-panel">
          <Tilt scale={1.05} transitionSpeed={2000}>
            <div className="brand">
              <div className="logo-circle"><Zap fill="white" size={20} /></div>
              <h1>Simulator</h1>
            </div>
          </Tilt>

          <div className="nav-menu">
            <button
              className={`nav-item ${activeTab === 'consumer' ? 'active' : ''}`}
              onClick={() => setActiveTab('consumer')}
            >
              <Smartphone size={20} />
              <span>Consumer App</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'logistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('logistics')}
            >
              <PackageCheck size={20} />
              <span>Dispatcher Center</span>
              {Object.keys(activeOrders).length > 0 && (
                <span className="order-count">{Object.keys(activeOrders).length}</span>
              )}
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <main className="content-area">
          <div className="app-layer">
            {activeTab === 'consumer' ? (
              <CustomerApp
                customerId={customerId}
                onCheckout={handleCheckout}
              />
            ) : (
              <LogisticsPanel
                activeOrders={activeOrders}
                refreshOrders={refreshOrders}
              />
            )}
          </div>

          {/* Terminal Layer */}
          <div className="terminal-layer">
            <LiveTerminal />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
