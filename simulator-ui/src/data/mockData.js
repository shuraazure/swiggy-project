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

export const getRandomCustomer = () => CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
export const getRandomRider = () => RIDERS[Math.floor(Math.random() * RIDERS.length)];
export const getRandomRestaurant = () => RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
