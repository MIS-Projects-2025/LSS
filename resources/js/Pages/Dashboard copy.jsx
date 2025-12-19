import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useState, useMemo } from "react";

export default function Dashboard({ tableData = [], emp_data = {} }) {
   const now = new Date();

    // =========================
    // DETERMINE CURRENT SHIFT
    // =========================
    const currentHour = now.getHours();
    let currentShift, shiftDate;

    if (currentHour >= 7 && currentHour <= 18) {
        currentShift = 'A-Shift';
        shiftDate = now.toISOString().split('T')[0];
    } else {
        currentShift = 'C-Shift';
        if (currentHour >= 19) {
            shiftDate = now.toISOString().split('T')[0];
        } else {
            const prevDate = new Date(now);
            prevDate.setDate(now.getDate() - 1);
            shiftDate = prevDate.toISOString().split('T')[0];
        }
    }

    // =========================
    // ADMIN CHECK
    // =========================
    const isAdmin = ["superadmin", "admin"].includes(emp_data?.emp_system_role);

    // =========================
    // Filter States
    // =========================
    const [search, setSearch] = useState("");
    const [filterShift, setFilterShift] = useState(""); // e.g., A-Shift / C-Shift
    const [filterDate, setFilterDate] = useState(""); // YYYY-MM-DD
    const [filterResult, setFilterResult] = useState(""); // PASSED / FAILED

    // =========================
    // MAP CURRENT SHIFT DATA
    // =========================
    let currentShiftData = tableData
        .map(row => {
            const [datePart, timePart] = row.date_created.split(' ');
            const [hour] = timePart.split(':').map(Number);

            let rowShift, rowShiftDate;
            if (hour >= 7 && hour <= 18) {
                rowShift = 'A-Shift';
                rowShiftDate = datePart;
            } else {
                rowShift = 'C-Shift';
                rowShiftDate = hour < 7 
                    ? new Date(new Date(datePart).setDate(new Date(datePart).getDate() - 1))
                          .toISOString().split('T')[0]
                    : datePart;
            }

            return { ...row, shift: rowShift, shiftDate: rowShiftDate };
        })
        .filter(row => row.shift === currentShift && row.shiftDate === shiftDate);

    // =========================
    // RESTRICT NON-ADMIN USERS
    // =========================
    if (!isAdmin && emp_data?.emp_id) {
        currentShiftData = currentShiftData.filter(row =>
            row.employee_id === emp_data.emp_id
        );
    }

    // =========================
    // ADMIN FILTERS + SEARCH
    // =========================
    const filteredData = useMemo(() => {
        if (!isAdmin) return currentShiftData;

        return currentShiftData.filter(row => {
            const matchSearch =
                row.employee_id.toLowerCase().includes(search.toLowerCase()) ||
                row.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                row.stamp_no.toLowerCase().includes(search.toLowerCase()) ||
                row.lot_id.toLowerCase().includes(search.toLowerCase());

            const matchShift = filterShift ? row.shift === filterShift : true;
            const matchDate = filterDate ? row.shiftDate === filterDate : true;
            const matchResult = filterResult ? row.inspection_result === filterResult : true;

            return matchSearch && matchShift && matchDate && matchResult;
        });
    }, [currentShiftData, search, filterShift, filterDate, filterResult, isAdmin]);


    // =========================
    // SUMMARY CARDS
    // =========================
    const totalLogs = filteredData.length;
    const totalPassed = filteredData.filter(r => r.inspection_result === 'PASSED').length;
    const totalFailed = filteredData.filter(r => r.inspection_result === 'FAILED').length;
    const totalInspectors = new Set(filteredData.map(r => r.employee_id)).size;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold">Dashboard Summary</h1>
                <p className="ml-6 text-1xl text-gray-500 font-bold">
                    Shift: {currentShift} | Date: {shiftDate}
                </p>

                {/* ========================= */}
                {/* SUMMARY CARDS */}
                {/* ========================= */}
                {isAdmin ? (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-amber-200 rounded-xl shadow p-4">
            <p className="text-sm text-gray-500 font-bold">Total Logs</p>
            <p className="text-3xl font-bold text-amber-600">{totalLogs}</p>
        </div>

        <div className="bg-yellow-200 rounded-xl shadow p-4">
            <p className="text-sm text-gray-500 font-bold">Active Inspectors</p>
            <p className="text-3xl font-bold text-yellow-600">{totalInspectors}</p>
        </div>

        <div className="bg-green-200 rounded-xl shadow p-4">
            <p className="text-sm text-gray-500 font-bold">Passed</p>
            <p className="text-3xl font-bold text-green-600">{totalPassed}</p>
        </div>

        <div className="bg-red-200 rounded-xl shadow p-4">
            <p className="text-sm text-gray-500 font-bold">Failed</p>
            <p className="text-3xl font-bold text-red-600">{totalFailed}</p>
        </div>
    </div>
) : (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-amber-200 rounded-xl shadow p-4">
            <p className="text-sm text-gray-500 font-bold">Total Logs</p>
            <p className="text-3xl font-bold text-amber-600">{totalLogs}</p>
        </div>

        <div className="bg-green-200 rounded-xl shadow p-4">
            <p className="text-sm text-gray-500 font-bold">Passed</p>
            <p className="text-3xl font-bold text-green-600">{totalPassed}</p>
        </div>

        <div className="bg-red-200 rounded-xl shadow p-4">
            <p className="text-sm text-gray-500 font-bold">Failed</p>
            <p className="text-3xl font-bold text-red-600">{totalFailed}</p>
        </div>
    </div>
)}

                {/* ========================= */}
                {/* ADMIN FILTERS */}
                {/* ========================= */}
                {isAdmin && (
                    <div className="flex flex-wrap gap-4 mt-4">
                        <input
                            type="text"
                            placeholder="Search employee, stamp, lot..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="border rounded px-3 py-1 w-1/4"
                        />
                        <select
                            value={filterShift}
                            onChange={e => setFilterShift(e.target.value)}
                            className="border rounded px-3 py-1 w-1/6"
                        >
                            <option value="">All Shifts</option>
                            <option value="A-Shift">A-Shift</option>
                            <option value="C-Shift">C-Shift</option>
                        </select>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="border rounded px-3 py-1"
                        />
                        <select
                            value={filterResult}
                            onChange={e => setFilterResult(e.target.value)}
                            className="border rounded px-3 py-1 w-1/6"
                        >
                            <option value="">All Results</option>
                            <option value="PASSED">PASSED</option>
                            <option value="FAILED">FAILED</option>
                        </select>
                    </div>
                )}

                {/* ========================= */}
                {/* LOGS TABLE */}
                {/* ========================= */}
                <div className="bg-white rounded-xl shadow p-4 mt-6 border-4 border-amber-200">
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 animate-pulse">
                        <i className="fa-solid fa-table"></i> Logs for Current Shift
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border">
                            <thead className="bg-gray-200 font-semibold text-gray-500">
                                <tr>
                                    <th className="border px-3 py-2">Employee</th>
                                    <th className="border px-3 py-2">Stamp No</th>
                                    <th className="border px-3 py-2">Shift</th>
                                    <th className="border px-3 py-2">Inspection Result</th>
                                    <th className="border px-3 py-2">Station</th>
                                    <th className="border px-3 py-2">Lot ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 text-gray-600">
                                            <td className="border px-3 py-2">{row.employee_name}</td>
                                            <td className="border px-3 py-2">{row.stamp_no}</td>
                                            <td className="border px-3 py-2 text-center">
                                                <span
                                                    className={`px-2 py-1 text-sm font-semibold rounded-md ${
                                                        row.shift === 'A-Shift'
                                                            ? 'bg-blue-300 text-blue-800'
                                                            : 'bg-purple-300 text-purple-800'
                                                    }`}
                                                >
                                                    {row.shift}
                                                </span>
                                            </td>
                                            <td className="border px-3 py-2 text-center">
                                                <span
                                                    className={`px-2 py-1 text-sm font-semibold rounded-md ${
                                                        row.inspection_result === 'PASSED'
                                                            ? 'bg-green-300 text-green-800'
                                                            : 'bg-red-300 text-red-800'
                                                    }`}
                                                >
                                                    {row.inspection_result}
                                                </span>
                                            </td>
                                            <td className="border px-3 py-2">{row.station}</td>
                                            <td className="border px-3 py-2">{row.lot_id}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="border px-3 py-4 text-center text-gray-500">
                                            No logs for current shift
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
