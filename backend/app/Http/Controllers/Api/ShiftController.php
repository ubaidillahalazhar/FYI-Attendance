<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;

class ShiftController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Shift::orderBy('shift_in')->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'shiftIn' => substr($s->shift_in, 0, 5),
            'shiftOut' => substr($s->shift_out, 0, 5),
        ])]);
    }
}
