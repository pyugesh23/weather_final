// Weather App JavaScript
// Real-time weather data with OpenWeatherMap API

// API Configuration - Updated with provided API key
const API_KEY = '8986f694f1673ed78010728dc1242889';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_API_URL = 'http://api.openweathermap.org/geo/1.0';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const weatherIcon = document.getElementById('weatherIcon');
const currentDate = document.getElementById('currentDate');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');

// Weather Details Elements
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const uvIndex = document.getElementById('uvIndex');
const cloudiness = document.getElementById('cloudiness');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');

// Global Variables
let currentCity = 'London';
let currentWeatherData = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setCurrentDate();
    loadWeatherData(currentCity);
    loadForecast(currentCity);
    setupEventListeners();
    checkGeolocation();
}

// Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    retryBtn.addEventListener('click', () => {
        loadWeatherData(currentCity);
    });
}

// Utility Functions
function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    hideLoading();
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// Search Functionality
async function handleSearch() {
    const city = searchInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    currentCity = city;
    await loadWeatherData(city);
    searchInput.value = '';
}

// Geolocation
function checkGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await loadWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.log('Geolocation error:', error);
                loadWeatherData(currentCity);
            }
        );
    }
}

// API Functions
async function loadWeatherData(city) {
    showLoading();
    hideError();
    
    try {
        const weatherData = await fetchWeatherData(city);
        const uvData = await fetchUVIndex(weatherData.coord.lat, weatherData.coord.lon);
        
        displayWeatherData(weatherData, uvData);
        updateBackground(weatherData.weather[0].main, weatherData.main.temp);
        loadForecast(city);
        
    } catch (error) {
        console.error('Error loading weather data:', error);
        showError(getErrorMessage(error));
    } finally {
        hideLoading();
    }
}

async function loadWeatherByCoords(lat, lon) {
    showLoading();
    
    try {
        const weatherData = await fetchWeatherByCoords(lat, lon);
        const uvData = await fetchUVIndex(lat, lon);
        
        currentCity = weatherData.name;
        displayWeatherData(weatherData, uvData);
        updateBackground(weatherData.weather[0].main, weatherData.main.temp);
        
    } catch (error) {
        console.error('Error loading weather by coordinates:', error);
        loadWeatherData(currentCity);
    } finally {
        hideLoading();
    }
}

async function fetchWeatherData(city) {
    const response = await fetch(
        `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    
    if (!response.ok) {
        throw new Error(response.status === 404 ? 'City not found' : 'Failed to fetch weather data');
    }
    
    return await response.json();
}

async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(
        `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }
    
    return await response.json();
}

async function fetchUVIndex(lat, lon) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('UV index not available');
    }
    
    return { value: null };
}

// Display Functions
function displayWeatherData(weatherData, uvData) {
    currentWeatherData = weatherData;
    
    // Update main weather info
    cityName.textContent = weatherData.name;
    temperature.textContent = `${Math.round(weatherData.main.temp)}°`;
    description.textContent = weatherData.weather[0].description;
    
    // Update weather icon
    const iconCode = weatherData.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    weatherIcon.alt = weatherData.weather[0].description;
    
    // Update weather details
    feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°`;
    humidity.textContent = `${weatherData.main.humidity}%`;
    windSpeed.textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
    visibility.textContent = `${(weatherData.visibility / 1000).toFixed(1)} km`;
    pressure.textContent = `${weatherData.main.pressure} hPa`;
    cloudiness.textContent = `${weatherData.clouds.all}%`;
    
    // Update UV index if available
    if (uvData && uvData.value !== null) {
        uvIndex.textContent = Math.round(uvData.value);
    } else {
        uvIndex.textContent = 'N/A';
    }
    
    // Update sunrise/sunset
    const sunriseTime = new Date(weatherData.sys.sunrise * 1000);
    const sunsetTime = new Date(weatherData.sys.sunset * 1000);
    
    sunrise.textContent = sunriseTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    sunset.textContent = sunsetTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    // Add animation
    animateWeatherCard();
}

// New function to load 5-day forecast
async function loadForecast(city) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';
    try {
        const response = await fetch(`${API_BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        const data = await response.json();
        // Process forecast data to get daily forecasts (one per day)
        const dailyData = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyData[date]) {
                dailyData[date] = [];
            }
            dailyData[date].push(item);
        });
        // Get next 5 days excluding today
        const dates = Object.keys(dailyData).slice(1, 6);
        dates.forEach(date => {
            const dayData = dailyData[date];
            // Calculate average temp and pick icon from midday or closest
            let tempSum = 0;
            let count = 0;
            let icon = '';
            let description = '';
            dayData.forEach(d => {
                tempSum += d.main.temp;
                count++;
            });
            const avgTemp = (tempSum / count).toFixed(1);
            // Find icon and description closest to midday (12:00)
            let middayData = dayData.reduce((prev, curr) => {
                return Math.abs(new Date(curr.dt_txt).getHours() - 12) < Math.abs(new Date(prev.dt_txt).getHours() - 12) ? curr : prev;
            });
            icon = middayData.weather[0].icon;
            description = middayData.weather[0].description;
            // Create forecast card
            const card = document.createElement('div');
            card.className = 'forecast-card';
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateObj = new Date(date);
            card.innerHTML = `
                <h4 class="forecast-date">${dateObj.toLocaleDateString('en-US', options)}</h4>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="forecast-icon" />
                <p class="forecast-temp">${avgTemp}°C</p>
                <p class="forecast-desc">${description}</p>
            `;
            forecastContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading forecast:', error);
        forecastContainer.innerHTML = '<p class="error-text">Unable to load forecast data</p>';
    }
}

function animateWeatherCard() {
    const cards = document.querySelectorAll('.detail-card, .info-item');
    cards.forEach((card, index) => {
        card.style.animation = `slideUp 0.5s ease-out ${index * 0.1}s both`;
    });
}

// Background Updates - Updated to include temperature-based changes
function updateBackground(weatherCondition, temperature) {
    const body = document.body;
    
    // Remove all temperature and weather classes
    body.className = '';
    
    // Add temperature-based background
    if (temperature <= 0) {
        body.classList.add('temp-cold');
    } else if (temperature > 0 && temperature <= 10) {
        body.classList.add('temp-cool');
    } else if (temperature > 10 && temperature <= 20) {
        body.classList.add('temp-moderate');
    } else if (temperature > 20 && temperature <= 30) {
        body.classList.add('temp-warm');
    } else if (temperature > 30 && temperature <= 35) {
        body.classList.add('temp-hot');
    } else if (temperature > 35) {
        body.classList.add('temp-extreme');
    }
    
    // Add weather condition class as fallback
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            if (!body.classList.contains('temp-warm') && !body.classList.contains('temp-hot') && !body.classList.contains('temp-extreme')) {
                body.classList.add('weather-bg-sunny');
            }
            break;
        case 'clouds':
            if (!body.classList.contains('temp-cold') && !body.classList.contains('temp-cool')) {
                body.classList.add('weather-bg-cloudy');
            }
            break;
        case 'rain':
        case 'drizzle':
            body.classList.add('weather-bg-rainy');
            break;
        case 'snow':
            body.classList.add('weather-bg-snowy');
            break;
        case 'thunderstorm':
            body.classList.add('weather-bg-rainy');
            break;
        default:
            if (body.className === '') {
                body.classList.add('weather-bg-cloudy');
            }
    }
    
    // Add time-based background
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) {
        body.classList.add('weather-bg-night');
    }
}

// Error Handling
function getErrorMessage(error) {
    if (error.message.includes('404')) {
        return 'City not found. Please check the spelling and try again.';
    } else if (error.message.includes('401')) {
        return 'Invalid API key. Please check your configuration.';
    } else if (error.message.includes('network')) {
        return 'Network error. Please check your internet connection.';
    } else {
        return 'Unable to fetch weather data. Please try again later.';
    }
}

// Local Storage Functions
function saveToLocalStorage(data) {
    localStorage.setItem('weatherData', JSON.stringify(data));
    localStorage.setItem('lastCity', currentCity);
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('weatherData');
    const savedCity = localStorage.getItem('lastCity');
    
    if (savedData && savedCity) {
        const data = JSON.parse(savedData);
        displayWeatherData(data, { value: null });
        currentCity = savedCity;
        return true;
    }
    return false;
}

// Auto-refresh every 10 minutes
setInterval(() => {
    if (currentCity) {
        loadWeatherData(currentCity);
    }
}, 600000);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered'))
            .catch(registrationError => console.log('SW registration failed'));
    });
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadWeatherData,
        displayWeatherData,
        updateBackground,
        getErrorMessage
    };
}
