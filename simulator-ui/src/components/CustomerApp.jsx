import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Star, Clock, Heart, Zap, ChevronRight, X, Sparkles, TrendingUp } from 'lucide-react';
import { useIdle } from 'react-use';
import Tilt from 'react-parallax-tilt';
import { FOOD_ITEMS } from '../data/mockData';
import './CustomerApp.css';

const API_BASE = "http://localhost:8080/api/telemetry";

const CustomerApp = ({ customerId, onCheckout }) => {
  const [adId, setAdId] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItems, setCartItems] = useState({});
  const [showFlashSale, setShowFlashSale] = useState(false);
  const [flashSaleUsed, setFlashSaleUsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const [likedItems, setLikedItems] = useState(new Set());

  const observerRef = useRef(null);
  const promoRef = useRef(null);

  const isIdle = useIdle(30000);

  useEffect(() => {
    if (isIdle && cartTotal > 0 && !showFlashSale && !flashSaleUsed) {
      triggerFlashSale();
    }
  }, [isIdle, cartTotal, showFlashSale, flashSaleUsed]);

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

  useEffect(() => {
    if (!promoRef.current) return;

    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !adId) {
        const newAdId = `AD-${Math.random().toString(36).substr(2, 9)}`;
        setAdId(newAdId);

        fetch(`${API_BASE}/ads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "impression",
            event_id: `EVT-${Math.random().toString(36).substr(2, 9)}`,
            ad_id: newAdId,
            restaurant_id: "R001",
            customer_id: customerId,
            client_timestamp: new Date().toISOString()
          })
        });

        observerRef.current.disconnect();
      }
    }, { threshold: 0.5 });

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
        ad_id: adId,
        restaurant_id: "R001",
        customer_id: customerId,
        client_timestamp: new Date().toISOString()
      })
    });
  };

  const handleAddToCart = (item) => {
    const currentEventId = eventId || `CART-${Math.random().toString(36).substr(2, 9)}`;
    if (!eventId) setEventId(currentEventId);

    const newTotal = parseFloat((cartTotal + item.price).toFixed(2));
    setCartTotal(newTotal);

    setCartItems(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));

    fetch(`${API_BASE}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "add_to_cart",
        customer_id: customerId,
        item_id: item.id,
        price: item.price,
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
    setCartItems({});
    setEventId(null);
  };

  const toggleLike = (itemId) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredItems = activeFilter === "All"
    ? FOOD_ITEMS
    : FOOD_ITEMS.filter(item => item.tags.includes(activeFilter));

  return (
    <div className="customer-app custom-scrollbar">
      <header className="app-header glass-panel">
        <div className="header-top">
          <div className="location">
            <span className="bold">Delivery Now</span>
            <span className="address">HSR Layout, Sector 2</span>
          </div>
          <div className="profile-icon">
            <ShoppingBag size={20} />
            {cartTotal > 0 && <div className="cart-badge pulse-animation"></div>}
          </div>
        </div>

        <Tilt glareEnable={true} glareMaxOpacity={0.3} glareColor="#ffffff" glarePosition="bottom" glareBorderRadius="20px">
          <div className="promo-banner" ref={promoRef} onClick={handleAdClick}>
            <div className="promo-glow"></div>
            <div className="promo-content">
              <span className="badge shimmer">
                <Sparkles size={10} /> Premium Offer
              </span>
              <h2>Bikanervala Special</h2>
              <p>Flat 20% OFF on all premium items!</p>
              <div className="btn-small">
                Order Now <ChevronRight size={14} />
              </div>
            </div>
            <div className="promo-image">
              <img src="https://images.unsplash.com/photo-1589302168068-964664d93cb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="Biryani" />
            </div>
          </div>
        </Tilt>
      </header>

      <div className="app-body">
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

        <div className="section-header">
          <h3 className="section-title">
            <TrendingUp size={20} className="section-icon" />
            Top Picks For You
          </h3>
          <span className="item-count">{filteredItems.length} items</span>
        </div>

        <div className="food-grid">
          {filteredItems.map((item, index) => (
            <Tilt
              key={item.id}
              tiltMaxAngleX={3}
              tiltMaxAngleY={3}
              scale={1.02}
              transitionSpeed={2000}
              className="tilt-wrapper"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="food-card fade-in-up">
                <div className="food-img-container">
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <button
                    className={`like-btn ${likedItems.has(item.id) ? 'liked' : ''}`}
                    onClick={() => toggleLike(item.id)}
                  >
                    <Heart size={16} fill={likedItems.has(item.id) ? 'currentColor' : 'none'} />
                  </button>
                  <div className="image-overlay"></div>
                </div>
                <div className="food-details">
                  <div className="food-header">
                    <h4>{item.name}</h4>
                    <div className="rating">
                      <Star size={12} className="star-icon" fill="currentColor" />
                      {item.rating}
                    </div>
                  </div>
                  <p className="food-description">{item.description}</p>
                  <p className="food-tags">{item.tags.slice(0, 2).join(' • ')}</p>
                  <div className="food-footer">
                    <span className="price">${item.price.toFixed(2)}</span>
                    {cartItems[item.id] ? (
                      <div className="quantity-control">
                        <button className="qty-btn" onClick={() => {
                          const newTotal = parseFloat((cartTotal - item.price).toFixed(2));
                          setCartTotal(Math.max(0, newTotal));
                          setCartItems(prev => {
                            const newItems = {...prev};
                            if (newItems[item.id] > 1) {
                              newItems[item.id]--;
                            } else {
                              delete newItems[item.id];
                            }
                            return newItems;
                          });
                        }}>−</button>
                        <span className="qty">{cartItems[item.id]}</span>
                        <button className="qty-btn" onClick={() => handleAddToCart(item)}>+</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => handleAddToCart(item)}>
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Tilt>
          ))}
        </div>

        {cartTotal > 0 && (
          <div className="floating-cart glass-panel slide-up-animation">
            <div className="cart-summary">
              <div className="cart-info">
                <div className="cart-details">
                  <span className="items-count">{Object.values(cartItems).reduce((a, b) => a + b, 0)} items</span>
                  <span className="cart-total">${cartTotal.toFixed(2)}</span>
                </div>
                {showFlashSale && (
                  <div className="discount-info pulse-animation">
                    <Zap size={14} fill="currentColor" />
                    <span className="discounted-total">
                      ${(cartTotal * 0.8).toFixed(2)} with 20% OFF
                    </span>
                  </div>
                )}
              </div>

              <div className="cart-actions">
                <div className="group-toggle" onClick={toggleGroupOrder}>
                  <div className={`switch ${isGroupOrder ? 'on' : 'off'}`}></div>
                  <span>Split Bill</span>
                </div>
              </div>
            </div>

            <div className="checkout-buttons">
              <button className="btn-apple-pay" onClick={handleCheckout}>
                Pay
              </button>
              <button className="btn-primary checkout-btn" onClick={handleCheckout}>
                Checkout <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showFlashSale && (
        <div className="modal-overlay fade-in-animation">
          <Tilt scale={1.05} transitionSpeed={1000}>
            <div className="flash-sale-modal pulse-scale-animation">
              <button className="close-btn" onClick={() => setShowFlashSale(false)}>
                <X size={20} />
              </button>
              <div className="modal-icon">
                <Zap size={40} className="zap-icon pulse-animation" />
              </div>
              <h3>Wait! Don't Miss Out!</h3>
              <p>Complete your order in the next <strong>15 minutes</strong> and get an automatic <strong className="highlight">20% OFF</strong> applied at checkout!</p>
              <button className="btn-primary full-width" onClick={handleCheckout}>
                Claim Discount & Checkout
              </button>
            </div>
          </Tilt>
        </div>
      )}
    </div>
  );
};

export default CustomerApp;
