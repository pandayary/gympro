// Function to handle contact form submission
function handleContactForm(event) {
    event.preventDefault();

    // Get form data
    const formData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        message: document.getElementById('contact-message').value,
        date: new Date().toISOString()
    };

    // Store in localStorage
    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    messages.push(formData);
    localStorage.setItem('contactMessages', JSON.stringify(messages));

    // Send email notification (in a real app, this would be handled by a backend)
    const emailBody = `
        Name: ${formData.name}
        Email: ${formData.email}
        Phone: ${formData.phone}
        Message: ${formData.message}
    `;

    // You can use a service like EmailJS or similar for actual email sending
    console.log('Email would be sent to: itsarkumar@gmail.com');
    console.log('Email content:', emailBody);

    // Show success message
    alert('Thank you for your message! We will get back to you soon.');
    event.target.reset();
}

// Function to handle membership form submission
function handleMembershipForm(event) {
    event.preventDefault();

    // Get form data
    const formData = {
        name: document.getElementById('member-name').value,
        contact: document.getElementById('member-contact').value,
        aadhaar: document.getElementById('member-aadhaar').value,
        address: document.getElementById('member-address').value,
        joinDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    };

    // Store in localStorage
    const members = JSON.parse(localStorage.getItem('members') || '[]');
    members.push(formData);
    localStorage.setItem('members', JSON.stringify(members));

    // Send confirmation email (in a real app, this would be handled by a backend)
    const emailBody = `
        Dear ${formData.name},

        Thank you for joining My Fitness Gym! Your membership has been activated.
        
        Membership Details:
        Start Date: ${new Date(formData.joinDate).toLocaleDateString()}
        Expiry Date: ${new Date(formData.expiryDate).toLocaleDateString()}
        
        We look forward to helping you achieve your fitness goals!
        
        Best regards,
        My Fitness Gym Team
    `;

    // You can use a service like EmailJS or similar for actual email sending
    console.log('Email would be sent to:', formData.contact);
    console.log('Email content:', emailBody);

    // Show success message
    alert('Thank you for joining My Fitness Gym! Your membership has been activated.');
    event.target.reset();
}

// Function to handle payment form submission
function handlePaymentForm(event) {
    event.preventDefault();

    const formData = {
        plan: selectedPlan,
        cardName: document.getElementById('card-name').value,
        cardNumber: document.getElementById('card-number').value,
        expiry: document.getElementById('expiry').value,
        email: document.getElementById('payment-email').value,
        date: new Date().toISOString()
    };

    // Store in localStorage
    const payments = JSON.parse(localStorage.getItem('payments') || '[]');
    payments.push(formData);
    localStorage.setItem('payments', JSON.stringify(payments));

    // Show success message
    alert('Payment successful! Thank you for your membership.');
    window.location.href = 'index.html';
}

// Variable to store selected plan
let selectedPlan = '';

// Function to handle plan selection
function handlePlanSelection(event) {
    const plan = event.target.dataset.plan;
    selectedPlan = plan;

    // Show payment form
    document.getElementById('payment-form').style.display = 'block';

    // Scroll to payment form
    document.getElementById('payment-form').scrollIntoView({ behavior: 'smooth' });
}

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    alert('Product added to cart!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const cartItems = document.querySelector('.cart-items');
    if (!cartItems) return;

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>₹${item.price}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
            <button class="btn" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 49 : 0;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `₹${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function showPaymentDetails(method) {
    document.querySelectorAll('.payment-details').forEach(el => el.style.display = 'none');
    document.getElementById(`${method}-details`).style.display = 'block';
}

// API URL
const API_URL = 'http://localhost:5000/api';

// Payment functionality
async function processPayment() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    let paymentDetails = {};
    let isValid = true;

    switch (paymentMethod) {
        case 'card':
            isValid = validateCardDetails();
            if (isValid) {
                paymentDetails = {
                    cardName: document.getElementById('card-name').value,
                    cardNumber: document.getElementById('card-number').value,
                    expiry: document.getElementById('expiry').value,
                    cvv: document.getElementById('cvv').value
                };
            }
            break;
        case 'upi':
            isValid = validateUPIDetails();
            if (isValid) {
                paymentDetails = {
                    upiId: document.getElementById('upi-id').value
                };
            }
            break;
        case 'netbanking':
            isValid = validateNetBankingDetails();
            if (isValid) {
                paymentDetails = {
                    bank: document.getElementById('bank').value
                };
            }
            break;
    }

    if (isValid) {
        try {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shipping = subtotal > 0 ? 49 : 0;
            const total = subtotal + shipping;

            // Show loading state
            const payButton = document.querySelector('.modal-buttons .payment-btn');
            const originalText = payButton.textContent;
            payButton.textContent = 'Processing...';
            payButton.disabled = true;

            const response = await fetch(`${API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'user123', // This should be set based on logged-in user
                    paymentMethod,
                    paymentDetails,
                    items: cart,
                    amount: total
                })
            });

            if (!response.ok) {
                throw new Error('Payment failed');
            }

            const payment = await response.json();

            if (payment.status === 'completed') {
                alert('Payment successful! Thank you for your purchase.');
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                closeModal();
                window.location.href = 'index.html';
            } else {
                throw new Error('Payment not completed');
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Failed to process payment. Please try again.');
        } finally {
            // Reset button state
            const payButton = document.querySelector('.modal-buttons .payment-btn');
            payButton.textContent = 'Pay Now';
            payButton.disabled = false;
        }
    }
}

function validateCardDetails() {
    const cardName = document.getElementById('card-name').value;
    const cardNumber = document.getElementById('card-number').value;
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;

    if (!cardName || !cardNumber || !expiry || !cvv) {
        alert('Please fill in all card details');
        return false;
    }

    // Basic card number validation (16 digits)
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
        alert('Please enter a valid 16-digit card number');
        return false;
    }

    // Basic expiry validation (MM/YY format)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        alert('Please enter a valid expiry date (MM/YY)');
        return false;
    }

    // Basic CVV validation (3 or 4 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
        alert('Please enter a valid CVV (3 or 4 digits)');
        return false;
    }

    return true;
}

function validateUPIDetails() {
    const upiId = document.getElementById('upi-id').value;
    if (!upiId) {
        alert('Please enter your UPI ID');
        return false;
    }

    // Basic UPI ID validation
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upiId)) {
        alert('Please enter a valid UPI ID');
        return false;
    }

    return true;
}

function validateNetBankingDetails() {
    const bank = document.getElementById('bank').value;
    if (!bank) {
        alert('Please select a bank');
        return false;
    }
    return true;
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Membership form
    const membershipForm = document.getElementById('membership-form');
    if (membershipForm) {
        membershipForm.addEventListener('submit', handleMembershipForm);
    }

    // Payment form
    const paymentForm = document.getElementById('payment-details-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentForm);
    }

    // Plan selection buttons
    const planButtons = document.querySelectorAll('.payment-select');
    planButtons.forEach(button => {
        button.addEventListener('click', handlePlanSelection);
    });

    // Payment method selection
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            showPaymentDetails(e.target.value);
        });
    });

    // Update cart display
    updateCartDisplay();
});