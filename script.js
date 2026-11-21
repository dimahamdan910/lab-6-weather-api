
// LAB 6: WORKING WITH API
// Project: SkyCast - Live Weather Dashboard
// API: Open-Meteo (https://open-meteo.com/)

// 1. Cities and their coordinates

const cities = {
  mississauga: {
    name: "Mississauga",
    latitude: 43.5890,
    longitude: -79.6441
  },
  toronto: {
    name: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832
  },
  vancouver: {
    name: "Vancouver",
    latitude: 49.2827,
    longitude: -123.1207
  },
  newyork: {
    name: "New York",
    latitude: 40.7128,
    longitude: -74.0060
  },
  london: {
    name: "London",
    latitude: 51.5074,
    longitude: -0.1278
  }
};

// 2. Connect HTML elements to JavaScript

const citySelect = document.getElementById("citySelect");
const refreshBtn = document.getElementById("refreshBtn");
const statusText = document.getElementById("status");
const forecastContainer = document.getElementById("forecast");

// 3. Convert API weather codes into descriptions and icons

function getWeatherInfo(code, isDay = true) {

  if (code === 0) {
    return {
      description: isDay ? "Clear Sky" : "Clear Night",
      icon: isDay ? "☀️" : "🌙",
      theme: isDay ? "clear" : "night"
    };
  }

  if (code === 1 || code === 2) {
    return {
      description: "Partly Cloudy",
      icon: isDay ? "🌤️" : "☁️",
      theme: "cloudy"
    };
  }

  if (code === 3 || code === 45 || code === 48) {
    return {
      description: code === 3 ? "Cloudy" : "Foggy",
      icon: "☁️",
      theme: "cloudy"
    };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      description: "Rainy",
      icon: "🌧️",
      theme: "rain"
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      description: "Snowy",
      icon: "❄️",
      theme: "snow"
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      description: "Thunderstorm",
      icon: "⛈️",
      theme: "storm"
    };
  }

  return {
    description: "Weather Unavailable",
    icon: "🌡️",
    theme: "cloudy"
  };
}

// 4. Create personalized weather suggestions

function getWeatherTip(temperature, code, wind) {

  if ([95, 96, 99].includes(code)) {
    return "Thunderstorms are expected. Stay indoors when possible and avoid outdoor activities during lightning.";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "Snowy weather ahead! Wear a warm coat, boots, and gloves. Be careful on slippery sidewalks.";
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Don't forget your umbrella! A waterproof jacket and comfortable shoes are a good idea today.";
  }

  if (temperature <= 0) {
    return "It's freezing outside! Bundle up with a winter coat, scarf, and gloves before heading out.";
  }

  if (temperature <= 10) {
    return "It's a chilly day! Wear a jacket or sweater to stay comfortable outside.";
  }

  if (temperature >= 30) {
    return "It's very hot today! Drink plenty of water, wear light clothing, and take breaks in the shade.";
  }

  if (wind >= 35) {
    return "It's pretty windy today! Bring a windproof jacket and secure any loose belongings.";
  }

  if (temperature >= 20) {
    return "Beautiful weather to enjoy the outdoors! Wear something comfortable and remember your sunscreen.";
  }

  return "The weather looks comfortable! A light layer might be helpful if you're spending time outside.";
}

// 5. Format the current date for the selected city

function formatDate(dateString, timezone) {
  // The API returns a local timestamp for the selected city.
  // Use its date portion so the browser's timezone cannot shift it.
  const [year, month, day] = dateString.slice(0, 10)
    .split("-")
    .map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}

// 6. Display the three-day forecast

function displayForecast(daily) {

  forecastContainer.innerHTML = "";

  for (let i = 0; i < 3; i++) {

    const dateString = daily.time[i];
    const weatherCode = daily.weather_code[i];
    const high = Math.round(daily.temperature_2m_max[i]);
    const low = Math.round(daily.temperature_2m_min[i]);

    const weather = getWeatherInfo(weatherCode);

    const dayName = i === 0
      ? "Today"
      : formatDate(dateString).split(",")[0];

    const card = document.createElement("div");
    card.className = "forecast-card";

    card.innerHTML = `
      <p class="forecast-day">${dayName}</p>
      <div class="forecast-icon">${weather.icon}</div>
      <p class="forecast-condition">${weather.description}</p>
      <p class="forecast-temp">
        ${high}° <span>/ ${low}°</span>
      </p>
    `;

    forecastContainer.appendChild(card);
  }
}

// 7. Fetch live weather from the public API

async function fetchWeather() {

  const selectedCity = cities[citySelect.value];

  refreshBtn.disabled = true;
  statusText.textContent = "Loading live weather data...";

  // API address with requested data fields
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${selectedCity.latitude}` +
    `&longitude=${selectedCity.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto` +
    `&forecast_days=3`;

  try {

    // FETCH: Request data from the API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Could not retrieve weather data.");
    }

    // JSON: Convert API response into JavaScript data
    const data = await response.json();

    const current = data.current;
    const daily = data.daily;

    if (!current || !daily || daily.time.length < 3) {
      throw new Error("Incomplete weather data received.");
    }

    const temperature = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = Math.round(current.relative_humidity_2m);
    const wind = Math.round(current.wind_speed_10m);

    const weather = getWeatherInfo(
      current.weather_code,
      current.is_day === 1
    );

    // DOM UPDATES: Change webpage content

    document.getElementById("cityName").textContent =
      selectedCity.name;

    document.getElementById("date").textContent =
      formatDate(current.time, data.timezone);

    document.getElementById("temperature").textContent =
      temperature;

    document.getElementById("condition").textContent =
      weather.description;

    document.getElementById("weatherIcon").textContent =
      weather.icon;

    document.getElementById("feelsLike").textContent =
      `Feels like ${feelsLike}°C`;

    document.getElementById("humidity").textContent =
      `${humidity}%`;

    document.getElementById("windSpeed").textContent =
      `${wind} km/h`;

    document.getElementById("feelsDetail").textContent =
      `${feelsLike}°C`;

    // Change the page background based on the weather
    document.body.className = `weather-${weather.theme}`;

    // Generate advice using the actual weather data
    document.getElementById("weatherTip").textContent =
      getWeatherTip(temperature, current.weather_code, wind);

    // Generate forecast cards with data from the API
    displayForecast(daily);

    statusText.textContent =
      `✓ Weather updated for ${selectedCity.name}`;

  } catch (error) {

    console.error("Weather API Error:", error);

    statusText.textContent =
      "Unable to load weather. Please check your internet connection and try again.";

  } finally {

    refreshBtn.disabled = false;

  }
}

// 8. Data-driven interaction

// Load new weather whenever the user selects a city
citySelect.addEventListener("change", fetchWeather);

// Request updated data when the refresh button is clicked
refreshBtn.addEventListener("click", fetchWeather);

// Automatically load Mississauga weather when the page opens
fetchWeather();
