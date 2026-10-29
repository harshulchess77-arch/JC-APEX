import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WeatherContext = createContext(null);

export function WeatherProvider({ children }) {
  const [weather, setWeather] = useState({
    ambientTemp: 25.0,
    trackTemp: 32.0,
    rainProbability: 15,
    rainfallIntensity: 0,
    windSpeed: 8.5,
    windDirection: 270,
    gripCoefficient: 1.0,
    humidity: 65,
    cloudCover: 30,
    lastUpdated: Date.now(),
  });

  const [forecast, setForecast] = useState([]);

  const updateWeather = useCallback((newWeather) => {
    setWeather(prev => ({
      ...prev,
      ...newWeather,
      lastUpdated: Date.now(),
    }));
  }, []);

  const calculateGripCoefficient = useCallback((trackTemp, rainProb, humidity) => {
    let grip = 1.0;

    if (rainProb > 60) {
      grip -= 0.35;
    } else if (rainProb > 30) {
      grip -= 0.15;
    }

    if (trackTemp < 20) {
      grip -= 0.1;
    } else if (trackTemp > 45) {
      grip -= 0.05;
    }

    if (humidity > 80) {
      grip -= 0.05;
    }

    return Math.max(0.4, Math.min(1.0, grip));
  }, []);

  const getWeatherRiskLevel = useCallback(() => {
    const { rainProbability, trackTemp, windSpeed } = weather;

    if (rainProbability > 70 || trackTemp > 50 || windSpeed > 25) {
      return 'CRITICAL';
    }
    if (rainProbability > 40 || trackTemp > 45 || windSpeed > 18) {
      return 'HIGH';
    }
    if (rainProbability > 20 || trackTemp > 40 || windSpeed > 12) {
      return 'MODERATE';
    }
    return 'OPTIMAL';
  }, [weather]);

  const getEnergyAdjustmentFactor = useCallback(() => {
    const { ambientTemp, trackTemp, gripCoefficient } = weather;

    let factor = 1.0;

    if (ambientTemp > 35) {
      factor += 0.15;
    } else if (ambientTemp < 15) {
      factor += 0.1;
    }

    if (trackTemp > 45) {
      factor += 0.1;
    }

    if (gripCoefficient < 0.7) {
      factor += 0.2;
    }

    return Math.min(1.5, Math.max(0.8, factor));
  }, [weather]);

  useEffect(() => {
    const interval = setInterval(() => {
      const ambientNoise = (Math.random() - 0.5) * 0.5;
      const trackNoise = (Math.random() - 0.5) * 0.8;
      const rainNoise = (Math.random() - 0.5) * 4;
      const windNoise = (Math.random() - 0.5) * 2;

      setWeather(prev => {
        const newAmbient = Math.max(10, Math.min(45, prev.ambientTemp + ambientNoise));
        const newTrack = Math.max(15, Math.min(55, prev.trackTemp + trackNoise));
        const newRain = Math.max(0, Math.min(100, prev.rainProbability + rainNoise));
        const newWind = Math.max(0, Math.min(30, prev.windSpeed + windNoise));

        const newGrip = calculateGripCoefficient(newTrack, newRain, prev.humidity);

        return {
          ...prev,
          ambientTemp: newAmbient,
          trackTemp: newTrack,
          rainProbability: newRain,
          windSpeed: newWind,
          gripCoefficient: newGrip,
          lastUpdated: Date.now(),
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [calculateGripCoefficient]);

  const value = {
    weather,
    forecast,
    updateWeather,
    calculateGripCoefficient,
    getWeatherRiskLevel,
    getEnergyAdjustmentFactor,
  };

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider');
  return ctx;
}
