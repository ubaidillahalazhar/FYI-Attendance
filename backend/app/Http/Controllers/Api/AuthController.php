<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|string', 'password' => 'required|string']);

        $user = User::with('employee.shift')->where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Email atau password salah.']);
        }

        if ($user->role === 'peserta' && ! $user->employee?->is_active) {
            throw ValidationException::withMessages(['email' => 'Akun peserta tidak aktif.']);
        }

        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user()->load('employee.shift'))]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'employee' => $user->employee ? new EmployeeResource($user->employee) : null,
            'office' => [
                'name' => config('geofence.office_name'),
                'lat' => config('geofence.office_lat'),
                'lng' => config('geofence.office_lng'),
                'radius_meters' => config('geofence.radius_meters'),
                'max_accuracy_meters' => config('geofence.max_accuracy_meters'),
            ],
        ];
    }
}
