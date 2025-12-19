<?php

namespace App\Http\Controllers\Maintenance;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StampController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }



    public function index(Request $request)
    {

        $empChecked = DB::connection('mysql')->table('stamp_list')->pluck('employee_id')->toArray();

        $EmpMasterlist = DB::connection('masterlist')->table('employee_masterlist')
            ->select('EMPLOYID', 'EMPNAME')
            ->where('ACCSTATUS', 1)
            ->where('DEPARTMENT', 'Quality Assurance')
            ->whereNotIn('EMPLOYID', $empChecked)
            ->get();

        $result = $this->datatable->handle(
            $request,
            'mysql',
            'stamp_list',
            [
                'conditions' => function ($query) {
                    return $query
                        ->whereNotNull('stamp_no')
                        ->OrderBy('stamp_no', 'asc');
                },

                'searchColumns' => ['employee_id', 'employee_name', 'stamp_no'],
            ]
        );


        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Maintenance/StampList', [
            'tableData' => $result['data'],
            'EmpMasterlist' => $EmpMasterlist,
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

    public function addingses(Request $request)
    {

        // dd($request->all());
        $checkIfExists = DB::connection('mysql')->table('stamp_list')
            ->where('employee_id', $request->input('employee_id'))
            ->where('employee_name', $request->input('employee_name'))
            ->where('stamp_no', $request->input('stamp_no'))
            ->exists();

        if (!$checkIfExists) {
            DB::connection('mysql')->table('stamp_list')
                ->insert([
                    'employee_id' => $request->input('employee_id'),
                    'employee_name' => $request->input('employee_name'),
                    'stamp_no' => $request->input('stamp_no'),
                    'created_by' => session('emp_data')['emp_name'],
                ]);
        }

        return back()->with('success', 'New package added successfully.');
    }

    public function updatingses(Request $request, $id)
    {
        $request->validate([
            'employee_id' => 'required|string|max:255',
            'employee_name'   => 'required|string|max:255',
            'stamp_no' => 'required|string|max:255',
        ]);

        $updated = DB::connection('mysql')
            ->table('stamp_list')
            ->where('id', $id)
            ->update([
                'employee_id' => $request->employee_id,
                'employee_name'   => $request->employee_name,
                'stamp_no' => $request->stamp_no,
            ]);

        if (!$updated) {
            return back()->withErrors(['message' => 'QA Stamp not found or not updated']);
        }

        // Redirect back to the index page with a flash message
        return redirect()->route('stamp.index')
            ->with('success', 'QA Stamp updated successfully');
    }

    public function deletingses(Request $request, $id)
    {
        DB::connection('mysql')->table('stamp_list')
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'QA Stamp removed successfully.');
    }
}
