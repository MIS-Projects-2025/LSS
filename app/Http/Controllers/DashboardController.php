<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::connection('mysql')->table('inspect_monitoring_logsheet');

        // =========================
        // FILTERS
        // =========================
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('station')) {
            $query->where('station', $request->station);
        }

        if ($request->filled('inspection_result')) {
            $query->where('inspection_result', $request->inspection_result);
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('date_shift', [
                $request->date_from,
                $request->date_to
            ]);
        }

        $tableData = $query
            ->select(
                'employee_id',
                'employee_name',
                'stamp_no',
                'date_shift',
                'customer',
                'productline',
                'package_type',
                'inspection_result',
                'station',
                'lot_id',
                'requirement',
                'lot_quantity',
                'sample_size',
                'type_of_defect',
                'no_of_defect',
                'remarks',
                'date_created'
            )
            ->orderBy('date_shift', 'desc')
            ->get();

        return Inertia::render('Dashboard', [
            'tableData' => $tableData,
            'filters' => $request->only([
                'employee_id',
                'station',
                'inspection_result',
                'date_from',
                'date_to'
            ])
        ]);
    }
}
