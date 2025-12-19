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
        currentShift = "A-Shift";
        shiftDate = now.toISOString().split("T")[0];
    } else {
        currentShift = "C-Shift";
        if (currentHour >= 19) {
            shiftDate = now.toISOString().split("T")[0];
        } else {
            const prevDate = new Date(now);
            prevDate.setDate(now.getDate() - 1);
            shiftDate = prevDate.toISOString().split("T")[0];
        }
    }

    // =========================
    // ADMIN CHECK
    // =========================
    const isAdmin = ["superadmin", "admin"].includes(emp_data?.emp_system_role);

    // =========================
    // FILTER STATES
    // =========================
    const [search, setSearch] = useState("");
    const [filterShift, setFilterShift] = useState(currentShift);
    const [filterDate, setFilterDate] = useState(shiftDate);
    const [filterResult, setFilterResult] = useState("");

    // =========================
    // MAP DATA (SHIFT + DATE)
    // =========================
    const mappedData = tableData.map(row => {
        const [datePart, timePart] = row.date_created.split(" ");
        const [hour] = timePart.split(":").map(Number);

        let rowShift, rowShiftDate;

        if (hour >= 7 && hour <= 18) {
            rowShift = "A-Shift";
            rowShiftDate = datePart;
        } else {
            rowShift = "C-Shift";
            rowShiftDate =
                hour < 7
                    ? new Date(
                          new Date(datePart).setDate(
                              new Date(datePart).getDate() - 1
                          )
                      )
                          .toISOString()
                          .split("T")[0]
                    : datePart;
        }

        return { ...row, shift: rowShift, shiftDate: rowShiftDate };
    });

    // =========================
    // BASE DATA (ROLE BASED)
    // =========================
    let baseData = mappedData;

    if (!isAdmin && emp_data?.emp_id) {
        baseData = mappedData.filter(
            row =>
                row.shift === currentShift &&
                row.shiftDate === shiftDate &&
                row.employee_id === emp_data.emp_id
        );
    }

    // =========================
    // FILTERED DATA (ADMIN)
    // =========================
const filteredData = useMemo(() => {
    return baseData.filter(row => {
        const matchSearch =
            row.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
            row.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
            row.stamp_no?.toLowerCase().includes(search.toLowerCase()) ||
            row.lot_id?.toLowerCase().includes(search.toLowerCase());

        const matchShift = isAdmin
            ? filterShift
                ? row.shift === filterShift
                : true
            : true;

        const matchDate = isAdmin
            ? filterDate
                ? row.shiftDate === filterDate
                : true
            : true;

        const matchResult = filterResult
            ? row.inspection_result === filterResult
            : true;

        return matchSearch && matchShift && matchDate && matchResult;
    });
}, [baseData, search, filterShift, filterDate, filterResult, isAdmin]);


    // =========================
    // SUMMARY
    // =========================
    const totalLogs = filteredData.length;
    const totalPassed = filteredData.filter(
        r => r.inspection_result === "PASSED"
    ).length;
    const totalFailed = filteredData.filter(
        r => r.inspection_result === "FAILED"
    ).length;
    const totalInspectors = new Set(
        filteredData.map(r => r.employee_id)
    ).size;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold">Dashboard Summary</h1>
                <p className="ml-6 text-gray-500 font-bold">
                    Shift: {currentShift} | Date: {shiftDate}
                </p>

                {/* ========================= */}
                {/* SUMMARY CARDS */}
                {/* ========================= */}
                <div
                    className={`grid grid-cols-1 ${
                        isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"
                    } gap-4`}
                >
                    <div className="bg-amber-200 rounded-xl shadow p-4">
                        <p className="text-sm font-bold text-gray-500">
                            Total Logs
                        </p>
                        <p className="text-3xl font-bold text-amber-600">
                            {totalLogs}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="bg-yellow-200 rounded-xl shadow p-4">
                            <p className="text-sm font-bold text-gray-500">
                                Active Inspectors
                            </p>
                            <p className="text-3xl font-bold text-yellow-600">
                                {totalInspectors}
                            </p>
                        </div>
                    )}

                    <div className="bg-green-200 rounded-xl shadow p-4">
                        <p className="text-sm font-bold text-gray-500">
                            Passed
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                            {totalPassed}
                        </p>
                    </div>

                    <div className="bg-red-200 rounded-xl shadow p-4">
                        <p className="text-sm font-bold text-gray-500">
                            Failed
                        </p>
                        <p className="text-3xl font-bold text-red-600">
                            {totalFailed}
                        </p>
                    </div>
                </div>

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
                            className="border rounded px-3 py-1 w-1/6 text-gray-500"
                        >
                            <option value="">All Shifts</option>
                            <option value="A-Shift">A-Shift</option>
                            <option value="C-Shift">C-Shift</option>
                        </select>

                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="border rounded px-3 py-1 text-gray-500 w-1/8"
                        />

                       <select
    value={filterResult}
    onChange={e => setFilterResult(e.target.value)}
    className={`border rounded px-3 py-1 w-1/6 font-semibold ${
        filterResult === "PASSED"
            ? "bg-green-100 text-green-800 border-green-400"
            : filterResult === "FAILED"
            ? "bg-red-100 text-red-800 border-red-400"
            : "bg-gray-100 text-gray-500"
    }`}
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
                <div className="bg-white rounded-xl shadow p-4 border-4 border-amber-200">
                    <table className="min-w-full text-sm border">
                        <thead className="bg-gray-200 text-gray-600">
                            <tr>
                                <th className="border px-3 py-2">Employee</th>
                                <th className="border px-3 py-2">Stamp No</th>
                                <th className="border px-3 py-2">Shift</th>
                                <th className="border px-3 py-2">
                                    Inspection Result
                                </th>
                                <th className="border px-3 py-2">Station</th>
                                <th className="border px-3 py-2">Lot ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 text-gray-600">
                                        <td className="border px-3 py-2">
                                            {row.employee_name}
                                        </td>
                                        <td className="border px-3 py-2">
                                            {row.stamp_no}
                                        </td>
                                        <td className="border px-3 py-2 text-center">
                                            <span
                                                className={`px-2 py-1 rounded-md font-semibold ${
                                                    row.shift === "A-Shift"
                                                        ? "bg-blue-300 text-blue-800"
                                                        : "bg-purple-300 text-purple-800"
                                                }`}
                                            >
                                                {row.shift}
                                            </span>
                                        </td>
                                        <td className="border px-3 py-2 text-center">
                                            <span
                                                className={`px-2 py-1 rounded-md font-semibold ${
                                                    row.inspection_result ===
                                                    "PASSED"
                                                        ? "bg-green-300 text-green-800"
                                                        : "bg-red-300 text-red-800"
                                                }`}
                                            >
                                                {row.inspection_result}
                                            </span>
                                        </td>
                                        <td className="border px-3 py-2">
                                            {row.station}
                                        </td>
                                        <td className="border px-3 py-2">
                                            {row.lot_id}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="border px-3 py-4 text-center text-gray-500"
                                    >
                                        No logs found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
