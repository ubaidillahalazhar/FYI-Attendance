<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EmployeeResource::collection(Employee::with('shift')->orderBy('employee_no')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge(['email' => strtolower((string) $request->input('email'))]);
        $data = $request->validate($this->rules() + ['password' => ['required', 'string', 'min:8']]);

        $employee = DB::transaction(function () use ($data) {
            $employee = Employee::create(collect($data)->except('password')->all() + [
                'avatar_initials' => $this->initials($data['name']),
                'is_active' => true,
            ]);
            User::create([
                'name' => $data['name'], 'email' => $data['email'], 'password' => $data['password'],
                'role' => 'peserta', 'employee_id' => $employee->id,
            ]);

            return $employee;
        });

        return (new EmployeeResource($employee->load('shift')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Employee $employee): EmployeeResource
    {
        $request->merge(['email' => strtolower((string) $request->input('email'))]);
        $data = $request->validate($this->rules($employee));

        DB::transaction(function () use ($employee, $data) {
            $employee->update($data + ['avatar_initials' => $this->initials($data['name'])]);
            $employee->user?->update(['name' => $data['name'], 'email' => $data['email']]);
        });

        return new EmployeeResource($employee->load('shift'));
    }

    public function updateStatus(Request $request, Employee $employee): EmployeeResource
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $employee->update(['is_active' => $data['is_active']]);
        if (! $employee->is_active) {
            $employee->user?->tokens()->delete();
        }

        return new EmployeeResource($employee->load('shift'));
    }

    public function updatePassword(Request $request, Employee $employee)
    {
        $data = $request->validate(['password' => ['required', 'string', 'min:8']]);
        $employee->user?->update(['password' => $data['password']]);
        $employee->user?->tokens()->delete();

        return response()->noContent();
    }

    private function rules(?Employee $employee = null): array
    {
        return [
            'employee_no' => ['required', 'string', 'max:30', Rule::unique('employees', 'employee_no')->ignore($employee)],
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150',
                Rule::unique('employees', 'email')->ignore($employee),
                Rule::unique('users', 'email')->ignore($employee?->user?->id)],
            'jenis' => ['required', Rule::in(['pkl', 'outsourcing'])],
            'asal' => ['required', 'string', 'max:150'],
            'position' => ['required', 'string', 'max:120'],
            'department' => ['required', 'string', 'max:120'],
            'shift_id' => ['required', 'exists:shifts,id'],
        ];
    }

    private function initials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name));
        $s = count($words) > 1 ? Str::substr($words[0], 0, 1).Str::substr($words[1], 0, 1) : Str::substr($words[0], 0, 2);

        return Str::upper($s);
    }
}
