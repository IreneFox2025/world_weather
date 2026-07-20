const API = "https://api.openweathermap.org/data/2.5/weather?q=";
const apiKey = "&appid=1cff0a0f05663d9b9d414c042e2593a2";

const spinner = document.querySelector("#spinner");
spinner.classList.add("hidden");
const error = document.querySelector("#error");

const form = document.querySelector(".search");
const input = document.querySelector(".inp");
const history = document.querySelector("#history");

const search_wrapper = document.querySelector(".search_wrapper");
const output = document.querySelector(".output");
const outputWrap = document.querySelector("#output_wrap");

let map;
let marker;

// search memory
let cities = [];
const max_limit = 5;

function addToCities(newSearch) {
  newSearch = newSearch.toLowerCase();
  const index = cities.indexOf(newSearch);

  cities.push(newSearch);

  if (index === -1) {
    if (cities.length > max_limit) {
      cities.splice(0, cities.length - max_limit);
    }
  } else {
    cities.splice(index, 1);
  }
}

const getWeatherData = async (city_name) => {
  let city = city_name || input.value.trim();
  
  if (city === "") {
  error.classList.remove("hidden");
  error.textContent = "Please enter a city name";
  return;
}

  const url = API + city + apiKey;
  spinner.classList.remove("hidden");

  const req = await fetch(url);
  const res = await req.json();

  spinner.classList.add("hidden");

  if (+res.cod === 200) {
    localStorage.setItem("weatherResults", JSON.stringify(res));

    addToCities(city);

    localStorage.setItem("citiesHistory", JSON.stringify(cities));
  }

  renderData(res);
  renderMap(res);
  input.value = "";
};

// start search
form.addEventListener("submit", (e) => {
  e.preventDefault();
  getWeatherData();
});

// search history list
input.addEventListener("focus", (e) => {
  history.classList.remove("hidden");
  history.innerHTML = "";

  cities.forEach((el) => {
    const saved_city = document.createElement("li");
    saved_city.classList.add("saved_city");
    saved_city.innerHTML = `${el}`;

    // search from the list
    saved_city.addEventListener("click", (e) => {
      getWeatherData(e.target.innerHTML);
      history.classList.add("hidden");
    });

    history.append(saved_city);
  });
});

document.addEventListener("click", (e) => {
  if (!search_wrapper.contains(e.target)) {
    history.classList.add("hidden");
  }
});

input.addEventListener("keydown", (e) => {
  history.classList.add("hidden");
});

//
const renderData = (data) => {
  output.innerHTML = "";
  outputWrap.classList.add("hidden");
  error.classList.add("hidden");

  if (+data.cod == 200) {
    outputWrap.classList.remove("hidden");
    error.classList.add("hidden");

    const icon = document.createElement("img");
    icon.src = `https://openweathermap.org/payload/api/media/file/${data.weather[0].icon}.png`;
    icon.style.width = "60px";
    icon.classList.add("animate__animated");
    icon.classList.add("animate__bounce");

    const cityName = document.createElement("h1");
    cityName.textContent = data.name;
    const country = document.createElement("h2");
    country.textContent = data.sys.country;

    let lon = data.coord.lon;
    let lat = data.coord.lat;

    if (lon >= 0) {
      lon = "E";
    } else {
      lon = "W";
    }

    if (lat >= 0) {
      lat = "N";
    } else {
      lat = "S";
    }

    const longitude = document.createElement("h5");
    longitude.textContent = `${data.coord.lon}°${lon}`;
    const latitude = document.createElement("h5");
    latitude.textContent = `${data.coord.lat}°${lat}`;

    const tempC = document.createElement("h3");
    tempC.textContent = `Temp C: ${Math.floor(data.main.temp - 273.15)} °`;
    const tempFel = document.createElement("h3");
    tempFel.textContent = `Feels like: ${Math.floor(data.main.feels_like - 273.15)} °`;
    const tempF = document.createElement("h3");
    tempF.textContent = `Temp F: ${Math.floor((data.main.temp - 273.15) * 1.8 + 32)} °`;

    const skyStatus = document.createElement("h3");
    skyStatus.textContent = `Sky: ${data.weather[0].main}`;
    const pressure = document.createElement("h3");
    pressure.textContent = `Air pressure: ${data.main.pressure} hPa`;

    const humidity = document.createElement("h3");
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    const wind = document.createElement("h3");
    wind.textContent = `Wind speed: ${data.wind.speed} m/s`;

    const sunrise = new Date(data.sys.sunrise * 1000);
    const hoursRise = sunrise.getHours().toString().padStart(2, "0");
    const minutesRise = sunrise.getMinutes().toString().padStart(2, "0");
    const sunriseTime = `${hoursRise}:${minutesRise}`;
    const sunriseElem = document.createElement("h4");
    sunriseElem.textContent = `Sunrise time: ${sunriseTime}`;

    const sunset = new Date(data.sys.sunset * 1000);
    const hoursSet = sunset.getHours().toString().padStart(2, "0");
    const minutesSet = sunset.getMinutes().toString().padStart(2, "0");
    const sunsetTime = `${hoursSet}:${minutesSet}`;
    const sunsetElem = document.createElement("h4");
    sunsetElem.textContent = `Sunset time: ${sunsetTime}`;

    output.append(
      icon,
      cityName,
      country,
      longitude,
      latitude,
      tempC,
      tempFel,
      tempF,
      skyStatus,
      pressure,
      humidity,
      wind,
      sunriseElem,
      sunsetElem,
    );

    const children = Array.from(output.children);

    children.forEach((item, index) => {
      // Skip the weather icon, it has its own animation
      if (index !== 0) {
        item.classList.add("animate__animated");
        item.classList.add("animate__fadeInDown");
        item.style.animationDelay = `${index * 0.08}s`;
      }
    });
  } else {
    outputWrap.classList.add("hidden");
    error.classList.remove("hidden");
   if (+data.cod == 404) {
      error.textContent = "City not found";
    } else if (+data.cod == 400) {
      error.textContent = "Please enter a city name";
    } else if (+data.cod == 401) {
      error.textContent = "API key error";
    } else {
      error.textContent = "Something went wrong";
    }
    input.value = "";
    return;
  }
};

const renderMap = (data) => {
  if (!map) {
    map = L.map("map").setView([data.coord.lat, data.coord.lon], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    marker = L.marker([data.coord.lat, data.coord.lon]).addTo(map);
  } else {
    map.flyTo([data.coord.lat, data.coord.lon], 13);
    marker.setLatLng([data.coord.lat, data.coord.lon]);
  }
};

const savedWeather = localStorage.getItem("weatherResults");
if (savedWeather) {
  const parsedResults = JSON.parse(savedWeather);

  renderData(parsedResults);
  renderMap(parsedResults);

  setTimeout(() => {
    map.invalidateSize();
  }, 500);
}

const citiesHistory = localStorage.getItem("citiesHistory");
if (citiesHistory) {
  cities = JSON.parse(citiesHistory);
}
