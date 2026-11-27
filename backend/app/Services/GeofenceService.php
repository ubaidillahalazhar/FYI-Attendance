<?php

namespace App\Services;

class GeofenceService
{
    /**
     * Validate GPS coordinates against configured office geofence using Haversine formula.
     *
     * @return array{is_valid: bool, distance_meters: int, allowed_radius: int}
     */
    public function validateLocation(float $latitude, float $longitude): array
    {
        $officeLat = config('geofence.office_lat');
        $officeLng = config('geofence.office_lng');
        $allowedRadius = config('geofence.radius_meters');

        $distance = $this->calculateHaversineMeters($latitude, $longitude, $officeLat, $officeLng);

        return [
            'is_valid' => $distance <= $allowedRadius,
            'distance_meters' => $distance,
            'allowed_radius' => $allowedRadius,
        ];
    }

    private function calculateHaversineMeters(float $lat1, float $lon1, float $lat2, float $lon2): int
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return (int) round($earthRadius * $c);
    }
}
