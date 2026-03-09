import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Star, Clock, Heart, Zap, ChevronRight, X } from 'lucide-react';
import { useIdle } from 'react-use';
import Tilt from 'react-parallax-tilt';
import './CustomerApp.css';

const API_BASE = "http://localhost:8080/api/telemetry";

const CustomerApp = ({ customerId, onCheckout }) => {
  const [adId, setAdId] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [showFlashSale, setShowFlashSale] = useState(false);
  const [flashSaleUsed, setFlashSaleUsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isGroupOrder, setIsGroupOrder] = useState(false);

  const observerRef = useRef(null);
  const promoRef = useRef(null);

  // Inactivity / Exit Intent Detection (30s for demo purposes)
  const isIdle = useIdle(30000);

  useEffect(() => {
    // If user is idle and they have items in cart, but haven't checked out...
    if (isIdle && cartTotal > 0 && !showFlashSale && !flashSaleUsed) {
      triggerFlashSale();
    }
  }, [isIdle, cartTotal, showFlashSale, flashSaleUsed]);

  // Handle Mouse Exit Intent for Desktop
  const handleMouseLeave = (e) => {
    if (e.clientY <= 0 && cartTotal > 0 && !showFlashSale && !flashSaleUsed) {
      triggerFlashSale();
    }
  };

  useEffect(() => {
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  });

  const triggerFlashSale = () => {
    setShowFlashSale(true);
    setFlashSaleUsed(true);

    fetch(`${API_BASE}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "flash_sale_triggered",
        customer_id: customerId,
        event_id: eventId,
        restaurant_id: "R001",
        cart_value: cartTotal,
        discount_offered: "20%",
        client_timestamp: new Date().toISOString()
      })
    });
  };

  const handleFilterClick = (filterName) => {
    setActiveFilter(filterName);

    // Simulate UI loading state & exact telemetry capture
    fetch(`${API_BASE}/user_behavior`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "search_filter_applied",
        customer_id: customerId,
        filter_value: filterName,
        restaurant_id: null,
        cart_value: null,
        client_timestamp: new Date().toISOString()
      })
    });
  };

  const toggleGroupOrder = () => {
    const newState = !isGroupOrder;
    setIsGroupOrder(newState);

    if (newState) {
      fetch(`${API_BASE}/user_behavior`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "group_order_started",
          customer_id: customerId,
          event_id: eventId || "CART-PENDING",
          restaurant_id: "R001",
          cart_value: cartTotal,
          client_timestamp: new Date().toISOString()
        })
      });
    }
  };

  // Phase A, Part 2: Impression Tracking via Intersection Observer
  useEffect(() => {
    if (!promoRef.current) return;

    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !adId) {
        // Generate UUID for this specific ad viewing session
        const newAdId = `AD-${Math.random().toString(36).substr(2, 9)}`;
        setAdId(newAdId);

        fetch(`${API_BASE}/ads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "impression",
            event_id: `EVT-${Math.random().toString(36).substr(2, 9)}`,
            ad_id: newAdId,
            restaurant_id: "R001", // Hardcoded to match the Bikanervala static ADLS entry
            customer_id: customerId,
            client_timestamp: new Date().toISOString()
          })
        });

        // Disconnect after firing once
        observerRef.current.disconnect();
      }
    }, { threshold: 0.5 }); // Ensure 50% is visible

    observerRef.current.observe(promoRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [adId, customerId]);

  const handleAdClick = () => {
    fetch(`${API_BASE}/ads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "click",
        event_id: `EVT-${Math.random().toString(36).substr(2, 9)}`,
        ad_id: adId, // Ties back exactly to the impression
        restaurant_id: "R001",
        customer_id: customerId,
        client_timestamp: new Date().toISOString()
      })
    });
  };

  const handleAddToCart = (itemId, price) => {
    // Generate Cart Session if it doesn't exist
    const currentEventId = eventId || `CART-${Math.random().toString(36).substr(2, 9)}`;
    if (!eventId) setEventId(currentEventId);

    const newTotal = parseFloat((cartTotal + price).toFixed(2));
    setCartTotal(newTotal);

    fetch(`${API_BASE}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "add_to_cart",
        customer_id: customerId,
        item_id: itemId,
        price: price,
        event_id: currentEventId,
        restaurant_id: "R001",
        cart_value: newTotal,
        client_timestamp: new Date().toISOString()
      })
    });
  };

  const handleCheckout = () => {
    if (cartTotal === 0) return;

    const finalTotal = showFlashSale ? parseFloat((cartTotal * 0.8).toFixed(2)) : cartTotal;
    setShowFlashSale(false);

    fetch(`${API_BASE}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "checkout_completed",
        customer_id: customerId,
        event_id: eventId,
        restaurant_id: "R001",
        order_id: `ORD${Math.floor(Math.random() * 90000) + 10000}`,
        cart_value: finalTotal,
        discount_applied: showFlashSale ? "20%" : "0%",
        client_timestamp: new Date().toISOString()
      })
    });

    onCheckout(finalTotal);
    setCartTotal(0);
    setEventId(null);
  };

  return (
    <div className="customer-app custom-scrollbar">
      {/* Header */}
      <header className="app-header glass-panel">
        <div className="header-top">
          <div className="location">
            <span className="bold">Home</span>
            <span className="address">HSR Layout, Sector 2...</span>
          </div>
          <div className="profile-icon">
            <ShoppingBag size={20} />
            {cartTotal > 0 && <div className="cart-badge"></div>}
          </div>
        </div>

        {/* Ad Banner Hero with 3D Tilt */}
        <Tilt glareEnable={true} glareMaxOpacity={0.4} glareColor="#ffffff" glarePosition="bottom" glareBorderRadius="16px">
          <div className="promo-banner" ref={promoRef} onClick={handleAdClick}>
            <div className="promo-content">
              <span className="badge">Promoted</span>
              <h2>Bikanervala</h2>
              <p>Flat 20% OFF on all items!</p>
              <div className="btn-small">Order Now <ChevronRight size={14} /></div>
            </div>
            <div className="promo-image">
              <img src="https://images.unsplash.com/photo-1589302168068-964664d93cb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="Biryani" />
            </div>
          </div>
        </Tilt>
      </header>

      {/* Main Content */}
      <div className="app-body">

        {/* Advanced Feature: Dietary Filters */}
        <div className="dietary-filters">
          {["All", "Vegan", "Keto", "High Protein", "Gluten-Free"].map(filter => (
            <button
              key={filter}
              className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => handleFilterClick(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <h3 className="section-title">Top Picks For You</h3>

        <div className="food-grid">
          {/* Item 1 */}
          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} style={{ transformStyle: "preserve-3d" }}>
            <div className="food-card">
              <div className="food-img-container">
                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="Burger" />
                <button className="like-btn"><Heart size={16} /></button>
              </div>
              <div className="food-details">
                <div className="food-header">
                  <h4>Truffle Burger</h4>
                  <div className="rating"><Star size={12} className="star-icon" fill="currentColor" /> 4.8</div>
                </div>
                <p className="food-tags">American • Fast Food</p>
                <div className="food-footer">
                  <span className="price">$12.50</span>
                  <button className="add-btn" onClick={() => handleAddToCart("I88", 12.50)}>ADD</button>
                </div>
              </div>
            </div>
          </Tilt>

          {/* Item 2 */}
          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000}>
            <div className="food-card">
              <div className="food-img-container">
                <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="Pizza" />
                <button className="like-btn"><Heart size={16} /></button>
              </div>
              <div className="food-details">
                <div className="food-header">
                  <h4>Pepperoni Pizza</h4>
                  <div className="rating"><Star size={12} className="star-icon" fill="currentColor" /> 4.5</div>
                </div>
                <p className="food-tags">Italian • Wood-fired</p>
                <div className="food-footer">
                  <span className="price">$18.00</span>
                  <button className="add-btn" onClick={() => handleAddToCart("I92", 18.00)}>ADD</button>
                </div>
              </div>
            </div>
          </Tilt>
        </div>

        {/* Floating Cart Indicator */}
        {cartTotal > 0 && (
          <div className="floating-cart animate-slide-up">
            <div className="cart-controls">
              <div className="cart-info">
                <span className="cart-total">${cartTotal.toFixed(2)}</span>
                {showFlashSale && <span className="discounted-total">${(cartTotal * 0.8).toFixed(2)} (20% OFF)</span>}
              </div>

              <div className="group-toggle" onClick={toggleGroupOrder}>
                <div className={`switch ${isGroupOrder ? 'on' : 'off'}`}></div>
                <span>Split Bill</span>
              </div>
            </div>

            <div className="checkout-actions">
              <button className="btn-apple-pay" onClick={handleCheckout}>Pay</button>
              <button className="btn-primary" onClick={handleCheckout}>Checkout <ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Flash Sale Modal Overlay */}
      {showFlashSale && (
        <div className="modal-overlay">
          <Tilt scale={1.05}>
            <div className="flash-sale-modal">
              <button className="close-btn" onClick={() => setShowFlashSale(false)}><X size={20} /></button>
              <div className="modal-icon"><Zap size={40} color="#fc8019" /></div>
              <h3>Wait! You forgot something delicious.</h3>
              <p>Complete your order in the next 15 minutes and get an automatic <strong>20% OFF</strong> applied at checkout!</p>
              <button className="btn-primary" onClick={handleCheckout}>Claim Discount & Checkout</button>
            </div>
          </Tilt>
        </div>
      )}
    </div>
  );
};

export default CustomerApp;
