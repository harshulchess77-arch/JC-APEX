#!/usr/bin/env python3
"""
================================================================================
JC-APEX AI ORACLE INTELLIGENCE ENGINE v1.0
================================================================================
Advanced race strategy AI operating in the Python gateway bridge for low-latency
processing of 5 Hz telemetry frames. Provides:

- Real-Time Energy Pacing: Forecasts battery depletion curves over race duration
- Weather-Adaptive Strategy: Calculates optimal throttle profiles based on weather
- Oval Track Sector Analysis: Predicts lap-time degradation and pit windows

All processing runs in a background thread to ensure non-blocking serial I/O.
================================================================================
"""

import os
import sys
import time
import json
import queue
import threading
import math
from datetime import datetime, timezone
from typing import Dict, Optional, List
from dataclasses import dataclass, asdict

import requests
from dotenv import load_dotenv

load_dotenv()


@dataclass
class TelemetryFrame:
    """Normalized telemetry frame with null-safety"""
    timestamp: float
    packet_id: int
    volts: float
    amps: float
    watts: float
    wh: float
    speed_h: float
    speed_g: float
    lat: float
    lng: float
    sats: int
    rssi: int
    snr: float

    @classmethod
    def from_dict(cls, data: Dict) -> 'TelemetryFrame':
        """Safe constructor with null-checks and defaults"""
        return cls(
            timestamp=data.get('timestamp', time.time()),
            packet_id=int(data.get('packet_id', 0)),
            volts=float(data.get('volts', 0.0)),
            amps=float(data.get('amps', 0.0)),
            watts=float(data.get('watts', 0.0)),
            wh=float(data.get('wh', 0.0)),
            speed_h=float(data.get('speed_h', 0.0)),
            speed_g=float(data.get('speed_g', 0.0)),
            lat=float(data.get('lat', 0.0)),
            lng=float(data.get('lng', 0.0)),
            sats=int(data.get('sats', 0)),
            rssi=int(data.get('rssi', 0)),
            snr=float(data.get('snr', 0.0)),
        )


@dataclass
class WeatherState:
    """Live weather parameters with null-safety"""
    ambient_temp: float = 25.0
    track_temp: float = 32.0
    rain_probability: float = 15.0
    wind_speed: float = 8.5
    wind_direction: float = 270.0
    grip_coefficient: float = 1.0
    humidity: float = 65.0
    last_updated: float = 0.0

    @classmethod
    def from_dict(cls, data: Dict) -> 'WeatherState':
        """Safe constructor with null-checks"""
        return cls(
            ambient_temp=float(data.get('ambient_temp', 25.0)),
            track_temp=float(data.get('track_temp', 32.0)),
            rain_probability=float(data.get('rain_probability', 15.0)),
            wind_speed=float(data.get('wind_speed', 8.5)),
            wind_direction=float(data.get('wind_direction', 270.0)),
            grip_coefficient=float(data.get('grip_coefficient', 1.0)),
            humidity=float(data.get('humidity', 65.0)),
            last_updated=float(data.get('last_updated', time.time())),
        )


@dataclass
class AIRecommendation:
    """AI-generated tactical recommendation"""
    id: str
    timestamp: float
    category: str  # 'ENERGY', 'STRATEGY', 'SAFETY', 'WEATHER'
    priority: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    message: str
    actionable: bool
    target_value: Optional[float] = None
    confidence: float = 0.0
    context: Dict = None

    def __post_init__(self):
        if self.context is None:
            self.context = {}


class EnergyForecaster:
    """Real-time energy depletion forecasting engine"""

    def __init__(self, race_duration_hours: float = 1.0):
        self.race_duration = race_duration_hours
        self.energy_history: List[Dict] = []
        self.max_history = 720  # 5 Hz * 144 seconds (2.4 minutes of history)

    def add_frame(self, frame: TelemetryFrame) -> None:
        """Add telemetry frame to energy history"""
        self.energy_history.append({
            'timestamp': frame.timestamp,
            'wh': frame.wh,
            'watts': frame.watts,
            'volts': frame.volts,
            'speed': frame.speed_h,
        })
        if len(self.energy_history) > self.max_history:
            self.energy_history.pop(0)

    def calculate_burn_rate(self) -> float:
        """Calculate current Wh burn rate (Wh/hour) based on recent history"""
        if len(self.energy_history) < 10:
            return 0.0

        recent = self.energy_history[-60:]  # Last 12 seconds at 5 Hz
        if len(recent) < 2:
            return 0.0

        first = recent[0]
        last = recent[-1]
        time_delta = last['timestamp'] - first['timestamp']

        if time_delta <= 0:
            return 0.0

        wh_delta = last['wh'] - first['wh']
        return (wh_delta / time_delta) * 3600.0  # Convert to Wh/hour

    def forecast_depletion(self, current_wh: float, battery_capacity_wh: float = 1200.0) -> Dict:
        """Forecast battery depletion over race duration"""
        burn_rate = self.calculate_burn_rate()
        remaining_wh = battery_capacity_wh - current_wh

        if burn_rate <= 0.01:
            # No significant burn rate - return safe defaults
            return {
                'burn_rate': 0.0,
                'projected_usage': 0.0,
                'remaining_capacity': remaining_wh,
                'hours_remaining': float('inf'),
                'laps_remaining': float('inf'),
                'risk_level': 'LOW',
            }

        hours_remaining = remaining_wh / burn_rate if burn_rate > 0 else float('inf')
        projected_usage = burn_rate * self.race_duration

        # Estimate laps remaining (assuming ~2.5 Wh per lap baseline)
        avg_wh_per_lap = burn_rate / (3600.0 / 63.0) if burn_rate > 0 else 2.5  # 63s per lap
        laps_remaining = remaining_wh / avg_wh_per_lap if avg_wh_per_lap > 0 else float('inf')

        # Risk assessment
        risk_level = 'LOW'
        if projected_usage > battery_capacity_wh * 0.95:
            risk_level = 'CRITICAL'
        elif projected_usage > battery_capacity_wh * 0.85:
            risk_level = 'HIGH'
        elif projected_usage > battery_capacity_wh * 0.70:
            risk_level = 'MEDIUM'

        return {
            'burn_rate': round(burn_rate, 2),
            'projected_usage': round(projected_usage, 2),
            'remaining_capacity': round(remaining_wh, 2),
            'hours_remaining': round(hours_remaining, 2) if hours_remaining != float('inf') else 999.9,
            'laps_remaining': round(laps_remaining, 1) if laps_remaining != float('inf') else 999.9,
            'risk_level': risk_level,
        }

    def detect_voltage_sag(self, frame: TelemetryFrame) -> Optional[AIRecommendation]:
        """Detect voltage sag under load"""
        if len(self.energy_history) < 30:
            return None

        recent = self.energy_history[-30:]
        avg_voltage = sum(f['volts'] for f in recent) / len(recent)

        # Detect sag if current voltage is 5% below average under load
        if frame.amps > 30.0 and frame.volts < avg_voltage * 0.95:
            return AIRecommendation(
                id=f"voltage_sag_{int(time.time())}",
                timestamp=time.time(),
                category='ENERGY',
                priority='HIGH',
                message=f"VOLTAGE SAG DETECTED: {frame.volts:.1f}V under {frame.amps:.1f}A load",
                actionable=True,
                target_value=avg_voltage,
                confidence=0.85,
                context={'current_volts': frame.volts, 'avg_volts': avg_voltage, 'load_amps': frame.amps},
            )

        return None


class WeatherStrategyEngine:
    """Weather-adaptive strategy calculations"""

    def __init__(self):
        self.weather_history: List[WeatherState] = []
        self.max_history = 120  # 24 seconds at 5 Hz

    def update_weather(self, weather: WeatherState) -> None:
        """Update weather state"""
        self.weather_history.append(weather)
        if len(self.weather_history) > self.max_history:
            self.weather_history.pop(0)

    def calculate_optimal_throttle(self, weather: WeatherState, current_speed: float) -> float:
        """Calculate optimal throttle percentage based on weather"""
        base_throttle = 1.0

        # Rain penalty
        if weather.rain_probability > 60:
            base_throttle *= 0.75
        elif weather.rain_probability > 30:
            base_throttle *= 0.85

        # Grip penalty
        base_throttle *= weather.grip_coefficient

        # Temperature penalty (too hot or too cold)
        if weather.track_temp > 45:
            base_throttle *= 0.90
        elif weather.track_temp < 20:
            base_throttle *= 0.92

        # Wind penalty (headwind assumed if direction within 45 degrees of movement)
        # Simplified: high wind always adds resistance
        if weather.wind_speed > 20:
            base_throttle *= 0.95

        return max(0.5, min(1.0, base_throttle))

    def generate_weather_recommendation(self, weather: WeatherState) -> Optional[AIRecommendation]:
        """Generate weather-based tactical recommendation"""
        priority = 'LOW'
        message = None

        if weather.rain_probability > 70:
            priority = 'CRITICAL'
            message = f"HEAVY RAIN IMMINENT ({weather.rain_probability:.0f}%). REDUCE SPEED, INCREASE SEPARATION."
        elif weather.rain_probability > 40:
            priority = 'HIGH'
            message = f"RAIN LIKELY ({weather.rain_probability:.0f}%). CONSERVE ENERGY FOR WET CONDITIONS."
        elif weather.grip_coefficient < 0.6:
            priority = 'HIGH'
            message = f"LOW GRIP DETECTED ({weather.grip_coefficient*100:.0f}%). AVOID AGGRESSIVE BRAKING."
        elif weather.grip_coefficient < 0.8:
            priority = 'MEDIUM'
            message = f"REDUCED GRIP ({weather.grip_coefficient*100:.0f}%). MODULATE THROTTLE SMOOTHLY."
        elif weather.track_temp > 50:
            priority = 'HIGH'
            message = f"EXTREME TRACK TEMP ({weather.track_temp:.1f}°C). TIRE DEGRADATION WARNING."
        elif weather.wind_speed > 25:
            priority = 'MEDIUM'
            message = f"STRONG WIND ({weather.wind_speed:.1f} km/h). ADJUST CORNERING LINES."

        if message:
            return AIRecommendation(
                id=f"weather_{int(time.time())}",
                timestamp=time.time(),
                category='WEATHER',
                priority=priority,
                message=message,
                actionable=True,
                confidence=0.75,
                context={'weather': asdict(weather)},
            )

        return None


class OvalTrackSectorAnalyzer:
    """Oval track sector analysis using mathematical model"""

    def __init__(self):
        self.sector_history: List[Dict] = []
        self.max_history = 500  # 100 seconds at 5 Hz

    def add_frame(self, frame: TelemetryFrame, sector: int = 1) -> None:
        """Add frame with sector information"""
        self.sector_history.append({
            'timestamp': frame.timestamp,
            'sector': sector,
            'speed': frame.speed_h,
            'watts': frame.watts,
            'amps': frame.amps,
        })
        if len(self.sector_history) > self.max_history:
            self.sector_history.pop(0)

    def analyze_sector_performance(self, sector: int) -> Dict:
        """Analyze performance in specific sector"""
        sector_frames = [f for f in self.sector_history if f['sector'] == sector]

        if len(sector_frames) < 10:
            return {
                'avg_speed': 0.0,
                'avg_watts': 0.0,
                'degradation_rate': 0.0,
                'confidence': 0.0,
            }

        recent = sector_frames[-50:] if len(sector_frames) >= 50 else sector_frames
        older = sector_frames[:-50] if len(sector_frames) >= 100 else []

        avg_speed = sum(f['speed'] for f in recent) / len(recent)
        avg_watts = sum(f['watts'] for f in recent) / len(recent)

        degradation_rate = 0.0
        if older:
            older_avg_speed = sum(f['speed'] for f in older) / len(older)
            if older_avg_speed > 0:
                degradation_rate = (older_avg_speed - avg_speed) / older_avg_speed

        return {
            'avg_speed': round(avg_speed, 2),
            'avg_watts': round(avg_watts, 1),
            'degradation_rate': round(degradation_rate * 100, 2),  # Percentage
            'confidence': min(1.0, len(recent) / 50.0),
        }

    def predict_lap_time_degradation(self) -> Optional[AIRecommendation]:
        """Predict lap-time degradation and generate recommendation"""
        if len(self.sector_history) < 200:
            return None

        # Analyze all sectors
        sector1 = self.analyze_sector_performance(1)
        sector2 = self.analyze_sector_performance(2)
        sector3 = self.analyze_sector_performance(3)

        # Check for significant degradation
        max_degradation = max(
            sector1['degradation_rate'],
            sector2['degradation_rate'],
            sector3['degradation_rate']
        )

        if max_degradation > 5.0:  # 5% degradation
            worst_sector = 1 if sector1['degradation_rate'] == max_degradation else (
                2 if sector2['degradation_rate'] == max_degradation else 3
            )
            return AIRecommendation(
                id=f"lap_degradation_{int(time.time())}",
                timestamp=time.time(),
                category='STRATEGY',
                priority='HIGH',
                message=f"LAP TIME DEGRADATION DETECTED IN SECTOR {worst_sector} ({max_degradation:.1f}%). CONSIDER PIT STOP.",
                actionable=True,
                target_value=max_degradation,
                confidence=0.70,
                context={'sector_analysis': {1: sector1, 2: sector2, 3: sector3}},
            )

        return None

    def recommend_pit_window(self, current_lap: int, total_laps: int) -> Optional[AIRecommendation]:
        """Recommend optimal pit stop window"""
        if total_laps < 10:
            return None

        # Ideal pit window: 60-70% of race distance
        ideal_lap = int(total_laps * 0.65)
        window_start = ideal_lap - 2
        window_end = ideal_lap + 2

        if window_start <= current_lap <= window_end:
            return AIRecommendation(
                id=f"pit_window_{int(time.time())}",
                timestamp=time.time(),
                category='STRATEGY',
                priority='MEDIUM',
                message=f"OPTIMAL PIT WINDOW: LAP {window_start}-{window_end}. CURRENT: LAP {current_lap}.",
                actionable=True,
                target_value=ideal_lap,
                confidence=0.80,
                context={'current_lap': current_lap, 'total_laps': total_laps, 'ideal_lap': ideal_lap},
            )

        return None


class AIOracle:
    """Main AI ORACLE intelligence engine"""

    def __init__(self, race_duration_hours: float = 1.0):
        self.energy_forecaster = EnergyForecaster(race_duration_hours)
        self.weather_engine = WeatherStrategyEngine()
        self.sector_analyzer = OvalTrackSectorAnalyzer()

        self.recommendation_queue = queue.Queue(maxsize=100)
        self.running = True
        self.last_recommendation_time = 0
        self.recommendation_cooldown = 5.0  # Minimum 5 seconds between recommendations

        # Supabase configuration
        self.supabase_url = (os.getenv("SUPABASE_URL") or "").rstrip("/")
        self.supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
            or os.getenv("VITE_SUPABASE_ANON_KEY")
            or ""
        )
        self.table_name = "ai_recommendations"

    def process_telemetry(self, frame: TelemetryFrame, weather: Optional[WeatherState] = None, sector: int = 1, current_lap: int = 0, total_laps: int = 20) -> List[AIRecommendation]:
        """Process telemetry frame and generate recommendations"""
        recommendations = []

        # Update forecaster
        self.energy_forecaster.add_frame(frame)

        # Update weather if provided
        if weather:
            self.weather_engine.update_weather(weather)

        # Update sector analyzer
        self.sector_analyzer.add_frame(frame, sector)

        # Generate recommendations with cooldown
        now = time.time()
        if now - self.last_recommendation_time >= self.recommendation_cooldown:
            # Energy recommendations
            voltage_sag = self.energy_forecaster.detect_voltage_sag(frame)
            if voltage_sag:
                recommendations.append(voltage_sag)

            # Weather recommendations
            if weather:
                weather_rec = self.weather_engine.generate_weather_recommendation(weather)
                if weather_rec:
                    recommendations.append(weather_rec)

            # Sector analysis recommendations
            lap_degradation = self.sector_analyzer.predict_lap_time_degradation()
            if lap_degradation:
                recommendations.append(lap_degradation)

            # Pit window recommendation
            pit_window = self.sector_analyzer.recommend_pit_window(current_lap, total_laps)
            if pit_window:
                recommendations.append(pit_window)

            if recommendations:
                self.last_recommendation_time = now

        return recommendations

    def log_recommendation_to_supabase(self, recommendation: AIRecommendation) -> bool:
        """Log recommendation to Supabase"""
        if not self.supabase_url or not self.supabase_key:
            return False

        try:
            endpoint = f"{self.supabase_url}/rest/v1/{self.table_name}"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            }

            payload = {
                "id": recommendation.id,
                "category": recommendation.category,
                "priority": recommendation.priority,
                "message": recommendation.message,
                "actionable": recommendation.actionable,
                "target_value": recommendation.target_value,
                "confidence": recommendation.confidence,
                "context": json.dumps(recommendation.context),
                "created_at": datetime.fromtimestamp(recommendation.timestamp, tz=timezone.utc).isoformat(),
            }

            response = requests.post(endpoint, headers=headers, json=payload, timeout=1.0)
            return response.status_code in [200, 201]
        except Exception as e:
            print(f"[AI ORACLE] Failed to log recommendation to Supabase: {e}")
            return False

    def broadcast_recommendation(self, recommendation: AIRecommendation) -> bool:
        """Broadcast recommendation via Supabase Realtime"""
        if not self.supabase_url or not self.supabase_key:
            return False

        try:
            endpoint = f"{self.supabase_url}/rest/v1/{self.table_name}"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            }

            payload = {
                "id": recommendation.id,
                "category": recommendation.category,
                "priority": recommendation.priority,
                "message": recommendation.message,
                "actionable": recommendation.actionable,
                "target_value": recommendation.target_value,
                "confidence": recommendation.confidence,
                "context": json.dumps(recommendation.context),
                "created_at": datetime.fromtimestamp(recommendation.timestamp, tz=timezone.utc).isoformat(),
            }

            response = requests.post(endpoint, headers=headers, json=payload, timeout=1.0)
            return response.status_code in [200, 201]
        except Exception as e:
            print(f"[AI ORACLE] Failed to broadcast recommendation: {e}")
            return False

    def stop(self):
        """Stop AI ORACLE processing"""
        self.running = False


# Standalone test mode
if __name__ == "__main__":
    print("=" * 70)
    print("JC-APEX AI ORACLE INTELLIGENCE ENGINE v1.0")
    print("=" * 70)

    oracle = AIOracle(race_duration_hours=1.0)

    # Simulate telemetry frames
    for i in range(100):
        frame = TelemetryFrame(
            timestamp=time.time(),
            packet_id=i,
            volts=48.0 - (i * 0.01),
            amps=30.0 + (i * 0.1),
            watts=1440.0 + (i * 5),
            wh=i * 2.5,
            speed_h=45.0 + (i * 0.1),
            speed_g=44.0 + (i * 0.1),
            lat=0.0,
            lng=0.0,
            sats=8,
            rssi=-60,
            snr=10.0,
        )

        weather = WeatherState(
            ambient_temp=25.0 + (i * 0.05),
            track_temp=32.0 + (i * 0.08),
            rain_probability=15.0 + (i * 0.2),
            wind_speed=8.5,
            wind_direction=270.0,
            grip_coefficient=1.0 - (i * 0.001),
            humidity=65.0,
            last_updated=time.time(),
        )

        recommendations = oracle.process_telemetry(frame, weather, sector=1, current_lap=5, total_laps=20)

        for rec in recommendations:
            print(f"[{rec.category}][{rec.priority}] {rec.message}")

        time.sleep(0.2)

    print("\nAI ORACLE test complete.")
