<?php

namespace App\Http\Controllers\Maintenance;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PackageTypeController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {

        $empData = session('emp_data');

        // Get distinct package types
        $packageTypes = DB::connection('server25')
            ->table('package_list')
            ->whereNotNull('package_type')
            ->where('package_type', '!=', '')
            ->select('package_type')
            ->distinct()
            ->orderBy('package_type', 'asc')
            ->pluck('package_type');

        // Get distinct lead counts
        $leadCounts = DB::connection('server25')
            ->table('package_list')
            ->whereNotNull('lead_count')
            ->where('lead_count', '!=', '')
            ->select('lead_count')
            ->distinct()
            ->orderBy('lead_count', 'asc')
            ->pluck('lead_count');

        $result = $this->datatable->handle(
            $request,
            'mysql',
            'package_type',
            [
                'conditions' => function ($query) {
                    return $query
                        ->whereNotNull('package_name')
                        ->where('package_name', '!=', '')
                        ->whereNotNull('package_type')
                        ->where('lead_count', '!=', '')
                        ->OrderBy('package_name', 'asc')
                        ->OrderBy('lead_count', 'asc');
                },

                'searchColumns' => ['package_name', 'package_type', 'created_by_emp_name'],
            ]
        );


        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Maintenance/PackageType', [
            'tableData' => $result['data'],
            'packageTypes' => $packageTypes,
            'leadCounts' => $leadCounts,
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
            ]),
        ]);
    }

    public function insertiningses(Request $request)
    {

        // dd($request->all());
        $checkIfExists = DB::connection('mysql')->table('package_type')
            ->where('package_name', $request->input('package_name'))
            ->where('lead_count', $request->input('lead_count'))
            ->exists();

        if (!$checkIfExists) {
            DB::connection('mysql')->table('package_type')
                ->insert([
                    'package_name' => $request->input('package_name'),
                    'lead_count' => $request->input('lead_count'),
                    'package_type' => $request->input('package_type'),
                    'created_by_emp_num' => session('emp_data')['emp_id'],
                    'created_by_emp_name' => session('emp_data')['emp_name'],
                ]);
        }

        return back()->with('success', 'New package added successfully.');
    }

    public function removeingses(Request $request, $id)
    {
        DB::connection('mysql')->table('package_type')
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'Package removed successfully.');
    }

    public function updatingses(Request $request, $id)
    {
        $request->validate([
            'package_name' => 'required|string|max:255',
            'lead_count'   => 'required|string|max:255',
            'package_type' => 'required|string|max:255',
        ]);

        $updated = DB::connection('mysql')
            ->table('package_type')
            ->where('id', $id)
            ->update([
                'package_name' => $request->package_name,
                'lead_count'   => $request->lead_count,
                'package_type' => $request->package_type,
            ]);

        if (!$updated) {
            return back()->withErrors(['message' => 'Package not found or not updated']);
        }

        // Redirect back to the index page with a flash message
        return redirect()->route('package-type.index')
            ->with('success', 'Package updated successfully');
    }
}
