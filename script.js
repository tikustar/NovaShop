// ---- Global CART Logic ----
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Save cart locally for session (optional)
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Add item to cart
function addToCart(product) {
    cart.push(product);
    saveCart();
    alert(`${product.name} added to cart!`);
    loadCart();
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    loadCart();
}

// Load cart on cart.html
function loadCart() {
    const table = document.getElementById("cart-table");
    if (!table) return;

    table.innerHTML = `
        <tr><th>Product</th><th>Price</th><th>Action</th></tr>
    `;

    let total = 0;
    cart.forEach((item, index) => {
        total += Number(item.price);
        table.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>₦${item.price}</td>
                <td><button onclick="removeFromCart(${index})">Remove</button></td>
            </tr>
        `;
    });

    document.getElementById("cart-total").innerText = "₦" + total;
}

/* ---------------------------------------------
   DARK MODE
--------------------------------------------- */
function toggleDarkMode() {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
}

/* ---------------------------------------------
   PRODUCTS STORAGE (Admin + Store)
--------------------------------------------- */
function saveProduct(product) {
    let products = JSON.parse(localStorage.getItem("products") || "[]");
    products.push(product);
    localStorage.setItem("products", JSON.stringify(products));
}

function loadProducts() {
    let products = JSON.parse(localStorage.getItem("products") || "[]");
    let container = document.getElementById("product-list");
    if (!container) return;
    container.innerHTML = "";

    products.forEach((p, index) => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${p.image}">
                <h3>${p.name}</h3>
                <p>₦${p.price}</p>
                <p class="category">Category: ${p.category}</p>
                <button class="btn" onclick="addToCart({name:'${p.name}', price:${p.price}, image:'${p.image}'})">Add to Cart</button>
            </div>
        `;
    });
}

/* ---------------------------------------------
   ADMIN: LOAD PRODUCTS INTO TABLE
--------------------------------------------- */
function loadAdminProducts() {
    let products = JSON.parse(localStorage.getItem("products") || "[]");
    let table = document.getElementById("admin-product-table");
    if (!table) return;

    table.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Image</th>
            <th>Action</th>
        </tr>
    `;

    products.forEach((p, index) => {
        table.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>₦${p.price}</td>
                <td>${p.category}</td>
                <td><img src="${p.image}" width="50"></td>
                <td><button onclick="deleteProduct(${index})" class="btn delete">Delete</button></td>
            </tr>
        `;
    });
}

function deleteProduct(index) {
    let products = JSON.parse(localStorage.getItem("products") || "[]");
    products.splice(index, 1);
    localStorage.setItem("products", JSON.stringify(products));
    loadAdminProducts();
}

/* ---------------------------------------------
   PRODUCT FORM LISTENER
--------------------------------------------- */
if (document.getElementById("productForm")) {
    document.getElementById("productForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const newProduct = {
            name: document.getElementById("name").value,
            price: document.getElementById("price").value,
            category: document.getElementById("category").value,
            image: document.getElementById("image").value
        };
        saveProduct(newProduct);
        alert("Product Added!");
        loadAdminProducts();
        this.reset();
    });
}

/* ---------------------------------------------
   SEARCH + FILTERS
--------------------------------------------- */
function searchProducts() {
    let search = document.getElementById('search').value.toLowerCase();
    let products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        let name = product.querySelector('h3').innerText.toLowerCase();
        product.style.display = name.includes(search) ? "block" : "none";
    });
}

function filterCategory(cat) {
    let products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        let category = product.querySelector('.category').innerText.toLowerCase();
        product.style.display = category.includes(cat.toLowerCase()) ? "block" : "none";
    });
}

function loadStoreProducts() {
    let products = JSON.parse(localStorage.getItem("products") || "[]");
    let container = document.getElementById("storeProducts");
    if (!container) return;

    container.innerHTML = products.map(p => `
        <div class="product-card" data-category="${p.category}">
            <img src="${p.image}">
            <h3>${p.name}</h3>
            <p>₦${p.price}</p>
            <p class="category">${p.category}</p>
            <button class="btn" onclick="addToCart({name:'${p.name}', price:${p.price}, image:'${p.image}'})">Add to Cart</button>
        </div>
    `).join("");
}

/* ---------------------------------------------
   ADMIN LOGIN SYSTEM
--------------------------------------------- */
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "12345";

function adminLogin() {
    let user = document.getElementById("adminUser").value;
    let pass = document.getElementById("adminPass").value;

    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
        localStorage.setItem("adminLoggedIn", "true");
        window.location.href = "admin.html";
    } else {
        document.getElementById("errorMsg").innerText = "Incorrect username or password!";
    }
}

function checkAdmin() {
    if (localStorage.getItem("adminLoggedIn") !== "true") {
        window.location.href = "admin-login.html";
    }
}

function adminLogout() {
    localStorage.removeItem("adminLoggedIn");
    window.location.href = "admin-login.html";
}

/* ---------------------------------------------
   FIREBASE CHECKOUT
--------------------------------------------- */
import { placeOrder } from "./orders.js";
import { firebaseAuth } from "./firebase.js";

document.addEventListener("DOMContentLoaded", async () => {
    const placeOrderSection = document.getElementById("placeOrderSection");
    if (!placeOrderSection) return;

    placeOrderSection.style.display = "block";

    let total = cart.reduce((sum, p) => sum + Number(p.price), 0);
    document.getElementById("summaryTotal").innerText = "₦" + total;
    document.getElementById("grandTotal").innerText = "₦" + (total + 1500);

    let d = new Date();
    d.setDate(d.getDate() + 7);
    document.getElementById("deliveryDate").innerText =
        "Estimated Delivery Date: " + d.toDateString();

    const confirmBtn = document.getElementById("confirmOrderBtn");
    if (!confirmBtn) return;

    confirmBtn.addEventListener("click", async () => {
        let address = document.getElementById("addressInput").value.trim();
        if (!address) {
            alert("Enter your delivery address");
            return;
        }

        try {
            await placeOrder({
                items: cart,
                total: total + 1500,
                address
            });

            localStorage.removeItem("cart");
            alert("Order placed successfully!");
            window.location.href = "orders.html";
        } catch (err) {
            console.error(err);
            alert("Error placing order. Please try again.");
        }
    });
});
