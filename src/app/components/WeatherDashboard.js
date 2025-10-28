'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');
  const fetchWeatherData = useCallback(async (latitude, longitude) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
      setWeatherData(response.data);
    } catch (err) {
      setError('Failed to fetch weather data.');
      console.error('Error fetching weather data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          setError('Geolocation denied. Showing weather for default location.');
          console.error('Error getting geolocation:', err);
          fetchWeatherData(52.52, 13.41); // Default to Berlin
        }
      );
    } else {
      setError('Geolocation not supported. Showing weather for default location.');
      fetchWeatherData(52.52, 13.41); // Default to Berlin
    }
  }, [fetchWeatherData]);

  const handleCitySubmit = async (e) => {
    e.preventDefault();
    if (!city) return;

    setLoading(true);
    setError(null);

    try {
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
      const location = geoResponse.data.results[0];

      if (location) {
        await fetchWeatherData(location.latitude, location.longitude);
      } else {
        setError('City not found. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch city data.');
      console.error('Error fetching city data:', err);
      setLoading(false);
    }
  };

  const getWeatherIcon = (code) => {
    if (code >= 0 && code <= 1) return '☀️'; // Sunny
    if (code >= 2 && code <= 3) return '☁️'; // Cloudy
    if (code >= 51 && code <= 67) return '🌧️'; // Rainy
    if (code >= 71 && code <= 77) return '❄️'; // Snowy
    return '❓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!weatherData) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-2xl">No weather data available.</div>;
  }

  const { current_weather, daily } = weatherData;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-md rounded-xl shadow-2xl p-4 sm:p-6 md:p-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 sm:mb-8 text-center">Weather Dashboard</h1>
        <form onSubmit={handleCitySubmit} className="flex justify-center mb-6">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
            className="px-4 py-2 w-full max-w-xs text-lg text-gray-800 bg-white/70 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white font-bold rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Get Weather
          </button>
        </form>
        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
        
        <div className="bg-gray-700/50 p-4 sm:p-6 rounded-xl shadow-lg mb-6 sm:mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-300">Current Weather</h2>
          <p className="text-5xl sm:text-6xl font-bold text-white">{current_weather.temperature}°C</p>
          <p className="text-lg sm:text-xl text-gray-300 mt-2">Wind Speed: {current_weather.windspeed} km/h</p>
        </div>

        <div className="bg-gray-700/50 p-4 sm:p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-300 text-center">5-Day Forecast</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {daily.time.slice(0, 5).map((time, index) => (
              <div key={index} className="bg-gray-800/70 p-4 rounded-xl shadow-md text-center transform hover:scale-105 transition-transform duration-300">
                <p className="font-bold text-lg text-blue-300">{new Date(time).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className="text-4xl my-2">{getWeatherIcon(daily.weathercode[index])}</p>
                <p className="text-gray-300">H: {daily.temperature_2m_max[index]}°C</p>
                <p className="text-gray-400">L: {daily.temperature_2m_min[index]}°C</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
