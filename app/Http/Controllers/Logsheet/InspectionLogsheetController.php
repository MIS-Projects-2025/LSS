<?php

namespace App\Http\Controllers\Logsheet;

use App\Http\Controllers\Controller;
use App\Services\DataTableService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use function Pest\Laravel\get;

class InspectionLogsheetController extends Controller
{
    protected $datatable;
    protected $datatable1;

    public function __construct(DataTableService $datatable)
    {
        $this->datatable = $datatable;
    }


    public function index(Request $request)
    {

        $empId = DB::connection('masterlist')
            ->table('employee_masterlist')
            ->where('EMPLOYID', session('emp_data')['emp_id'])
            ->value('EMPLOYID');


        $stampNo = DB::connection('mysql')
            ->table('stamp_list')
            ->where('employee_id', $empId)
            ->get();




        $customerList = DB::connection('server25')->table('customer_list')
            ->where('customer_name', '!=', '')
            ->whereNotNull('customer_name')
            ->orderBy('customer_name', 'asc')
            ->get();

        $packageTypeList = DB::connection('mysql')->table('package_type')
            ->where('package_type', '!=', '')
            ->whereNotNull('package_type')
            ->orderBy('package_type', 'asc')
            ->get();

        $result = $this->datatable->handle(
            $request,
            'mysql',
            'inspect_monitoring_logsheet',
            [

                'conditions' => function ($query) {
                    return $query
                        ->where('employee_id', session('emp_data')['emp_id'])
                        ->where('lot_id', '!=', '')
                        ->whereNotNull('lot_id')
                        ->OrderBy('id', 'DESC');
                },

                'searchColumns' => ['lot_id', 'package_type', 'requirement', 'lot_quantity', 'sample_size', 'inspection_result', 'employee_name'],
            ]
        );

        // FOR CSV EXPORTING
        if ($result instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
            return $result;
        }

        return Inertia::render('Logsheet/InspectionLogsheet', [
            'tableData' => $result['data'],
            'stampNo' => $stampNo,
            'customerList' => $customerList,
            'packageTypeList' => $packageTypeList,
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
        $checkIfExists = DB::connection('mysql')->table('inspect_monitoring_logsheet')
            ->where('employee_id', $request->input('employee_id'))
            ->where('stamp_no', $request->input('stamp_no'))
            ->where('date_shift', $request->input('date_shift'))
            ->where('lot_id', $request->input('lot_id'))
            ->where('package_type', $request->input('package_type'))
            ->exists();

        if (!$checkIfExists) {
            DB::connection('mysql')->table('inspect_monitoring_logsheet')
                ->insert([
                    'employee_id' => session('emp_data')['emp_id'],
                    'stamp_no' => $request->input('stamp_no'),
                    'date_shift' => $request->input('date_shift'),
                    'customer' => $request->input('customer'),
                    'productline' => $request->input('productline'),
                    'package_type' => $request->input('package_type'),
                    'inspection_result' => $request->input('inspection_result'),
                    'station' => $request->input('station'),
                    'lot_id' => $request->input('lot_id'),
                    'requirement' => $request->input('requirement'),
                    'lot_quantity' => $request->input('lot_quantity'),
                    'sample_size' => $request->input('sample_size'),
                    'type_of_defect' => $request->input('type_of_defect'),
                    'no_of_defect' => $request->input('no_of_defect'),
                    'remarks' => $request->input('remarks'),
                    'employee_name' => session('emp_data')['emp_name'],
                    'employee_dept' => session('emp_data')['emp_dept'],
                ]);
        }

        return back()->with('success', 'New package added successfully.');
    }

    public function massInsert(Request $request)
    {
        $items = $request->input('items', []);
        $insertData = [];
        $duplicates = []; // Collect duplicates

        foreach ($items as $item) {
            $exists = DB::table('inspect_monitoring_logsheet')
                ->where('package_type', $item['package_type'])
                ->where('lot_id', $item['lot_id'])
                ->exists();

            if ($exists) {
                // Store the duplicate in "lot_id - package_type" format
                $duplicates[] = $item['lot_id'] . ' - ' . $item['package_type'];
                continue;
            }

            $insertData[] = [
                'employee_id' => session('emp_data')['emp_id'],
                'employee_name' => session('emp_data')['emp_name'],
                'employee_dept' => session('emp_data')['emp_dept'],
                'stamp_no' => $item['stamp_no'],
                'date_shift' => $item['date_shift'],
                'customer' => $item['customer'],
                'productline' => $item['productline'],
                'package_type' => $item['package_type'],
                'inspection_result' => $item['inspection_result'],
                'station' => $item['station'],
                'lot_id' => $item['lot_id'],
                'requirement' => $item['requirement'],
                'lot_quantity' => $item['lot_quantity'],
                'sample_size' => $item['sample_size'],
                'type_of_defect' => $item['type_of_defect'],
                'no_of_defect' => $item['no_of_defect'],
                'remarks' => $item['remarks'],
            ];
        }

        // Insert new items
        if (!empty($insertData)) {
            DB::table('inspect_monitoring_logsheet')->insert($insertData);
        }

        // Return message with info about duplicates
        if (!empty($duplicates)) {
            return back()->with(
                'warning',
                'The following items already exist and were skipped: ' . implode(', ', $duplicates)
            );
        }

        return back()->with('success', 'All items saved successfully.');
    }

    public function checkExists(Request $request)
    {
        $exists = DB::connection('mysql')->table('inspect_monitoring_logsheet')
            ->where('lot_id', $request->lot_id)
            ->where('package_type', $request->package_type)
            ->exists();

        return response()->json(['exists' => $exists]);
    }


    public function editseses(Request $request, $id)
    {
        $data = $request->validate([
            'employee_id' => 'required|string|max:255',
            'stamp_no' => 'required|string|max:255',
            'date_shift' => 'required|string|max:255',
            'customer' => 'required|string|max:255',
            'productline' => 'required|string|max:255',
            'package_type' => 'required|string|max:255',
            'inspection_result' => 'required|string|max:255',
            'station' => 'required|string|max:255',
            'lot_id' => 'required|string|max:255',
            'requirement' => 'required|string|max:255',
            'lot_quantity' => 'required|string|max:255',
            'sample_size' => 'required|string|max:255',
            'type_of_defect' => 'required|string|max:255',
            'no_of_defect' => 'required|string|max:255',
            'remarks' => 'required|string|max:255',
        ]);

        $logsheet = DB::connection('mysql')->table('inspect_monitoring_logsheet')->where('id', $id);

        if (!$logsheet->exists()) {
            return back()->withErrors(['message' => 'Logsheet item not found']);
        }

        $logsheet->update($data);

        return redirect()->route('inspection.logsheet.index')->with('success', 'Logsheet item updated successfully');
    }

    public function removingses(Request $request, $id)
    {
        DB::connection('mysql')->table('inspect_monitoring_logsheet')
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'Logsheet item removed successfully.');
    }
}
