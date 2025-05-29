// API URL
const API_URL = 'http://localhost:5000/api';

// Current selected season
let selectedSeason = null;

// Load seasons when page loads
document.addEventListener('DOMContentLoaded', loadSeasons);

// Function to load all seasons
async function loadSeasons() {
    try {
        const response = await fetch(`${API_URL}/seasons`);
        const seasons = await response.json();
        displaySeasons(seasons);
    } catch (error) {
        console.error('Error loading seasons:', error);
        alert('Failed to load seasons. Please try again later.');
    }
}

// Function to display seasons in the UI
function displaySeasons(seasons) {
    const seasonsList = document.getElementById('seasonsList');
    seasonsList.innerHTML = seasons.map(season => `
        <div class="season-card">
            <h3>${season.name}</h3>
            <div class="season-info">
                <p><strong>Trainer:</strong> ${season.trainer}</p>
                <p><strong>Start Date:</strong> ${new Date(season.startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> ${new Date(season.endDate).toLocaleDateString()}</p>
                <p><strong>Price:</strong> ₹${season.price}</p>
                <p><strong>Available Slots:</strong> ${season.availableSlots}/${season.capacity}</p>
                <p><strong>Description:</strong> ${season.description}</p>
            </div>
            <button 
                class="book-btn" 
                onclick="openBookingModal('${season._id}')"
                ${season.availableSlots <= 0 ? 'disabled' : ''}
            >
                ${season.availableSlots <= 0 ? 'No Slots Available' : 'Book Now'}
            </button>
        </div>
    `).join('');
}

// Function to open booking modal
function openBookingModal(seasonId) {
    selectedSeason = seasonId;
    const modal = document.getElementById('bookingModal');
    const bookingDetails = document.getElementById('bookingDetails');

    // Get season details
    fetch(`${API_URL}/seasons/${seasonId}`)
        .then(response => response.json())
        .then(season => {
            bookingDetails.innerHTML = `
                <div class="season-info">
                    <p><strong>Season:</strong> ${season.name}</p>
                    <p><strong>Price:</strong> ₹${season.price}</p>
                    <p><strong>Trainer:</strong> ${season.trainer}</p>
                </div>
            `;
            modal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error loading season details:', error);
            alert('Failed to load season details. Please try again.');
        });
}

// Function to close booking modal
function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('userId').value = '';
    selectedSeason = null;
}

// Function to confirm booking
async function confirmBooking() {
    const userId = document.getElementById('userId').value;

    if (!userId) {
        alert('Please enter your User ID');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                seasonId: selectedSeason
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Booking successful! Please proceed to payment.');
            closeBookingModal();
            loadSeasons(); // Refresh the seasons list
        } else {
            alert(data.message || 'Failed to book season. Please try again.');
        }
    } catch (error) {
        console.error('Error booking season:', error);
        alert('Failed to book season. Please try again later.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) {
        closeBookingModal();
    }
}