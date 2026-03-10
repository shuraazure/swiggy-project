export const CUSTOMERS = [
    "C001", "C002", "C003", "C004", "C005", "C006", "C007", "C008", "C009", "C010",
    "C011", "C012", "C013", "C014", "C015", "C016", "C017", "C018", "C019", "C020"
];

export const RESTAURANTS = [
    "R001", "R002", "R003", "R004", "R005", "R006", "R007", "R008", "R009", "R010"
];

export const RIDERS = [
    "RIDER001", "RIDER002", "RIDER003", "RIDER004", "RIDER005", "RIDER006", "RIDER007", "RIDER008", "RIDER009", "RIDER010",
    "RIDER011", "RIDER012", "RIDER013", "RIDER014", "RIDER015", "RIDER016", "RIDER017", "RIDER018", "RIDER019", "RIDER020"
];

export const FOOD_ITEMS = [
    {
        id: "I001",
        name: "Truffle Mushroom Burger",
        description: "Premium wagyu patty with wild mushrooms",
        price: 18.99,
        category: "Burgers",
        tags: ["American", "Premium", "High Protein"],
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop"
    },
    {
        id: "I002",
        name: "Margherita Napoletana",
        description: "Wood-fired with San Marzano tomatoes",
        price: 16.50,
        category: "Pizza",
        tags: ["Italian", "Vegetarian"],
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop"
    },
    {
        id: "I003",
        name: "Spicy Tuna Poke Bowl",
        description: "Sushi-grade tuna with avocado & sesame",
        price: 22.00,
        category: "Healthy",
        tags: ["Japanese", "Healthy", "High Protein", "Gluten-Free"],
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop"
    },
    {
        id: "I004",
        name: "Chicken Tikka Masala",
        description: "Tender chicken in creamy tomato curry",
        price: 19.99,
        category: "Indian",
        tags: ["Indian", "Spicy", "High Protein"],
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop"
    },
    {
        id: "I005",
        name: "Korean BBQ Tacos",
        description: "Bulgogi beef with kimchi slaw",
        price: 15.99,
        category: "Fusion",
        tags: ["Korean", "Mexican", "High Protein"],
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop"
    },
    {
        id: "I006",
        name: "Vegan Buddha Bowl",
        description: "Quinoa, roasted vegetables & tahini",
        price: 14.50,
        category: "Healthy",
        tags: ["Vegan", "Healthy", "Gluten-Free"],
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop"
    },
    {
        id: "I007",
        name: "Chocolate Lava Cake",
        description: "Warm molten center with vanilla gelato",
        price: 9.99,
        category: "Desserts",
        tags: ["Dessert", "Sweet"],
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=400&fit=crop"
    },
    {
        id: "I008",
        name: "Salmon Avocado Roll",
        description: "Fresh salmon with creamy avocado",
        price: 17.99,
        category: "Sushi",
        tags: ["Japanese", "Healthy", "Gluten-Free"],
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=400&fit=crop"
    },
    {
        id: "I009",
        name: "Keto Cauliflower Pizza",
        description: "Low-carb cauliflower crust with premium toppings",
        price: 18.50,
        category: "Healthy",
        tags: ["Keto", "Low Carb", "Gluten-Free"],
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop"
    },
    {
        id: "I010",
        name: "Lobster Mac & Cheese",
        description: "Fresh lobster in truffle cream sauce",
        price: 28.99,
        category: "Comfort Food",
        tags: ["Seafood", "Premium", "Comfort"],
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1476124369491-f4ca65f64a96?w=600&h=400&fit=crop"
    }
];

export const getRandomCustomer = () => CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
export const getRandomRider = () => RIDERS[Math.floor(Math.random() * RIDERS.length)];
export const getRandomRestaurant = () => RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
