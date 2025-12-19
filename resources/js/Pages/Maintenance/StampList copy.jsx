import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";
import { useState } from "react";

export default function StampList({ tableData, tableFilters, emp_data }) {

    return (
        <AuthenticatedLayout>
            <Head title="Manage Package" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-yellow-500 animate-pulse"><i className="fa-solid fa-stamp"></i> QA Stamp List</h1>
                    <button
                        className="text-green-600 border-green-600 btn hover:bg-green-600 hover:text-white"
                    >
                        <i className="fa-solid fa-user-plus"></i>
                        New QA Stamp
                    </button>
            </div>

            <DataTable
                columns={[
                    { key: "stamp_no", label: "Stamp No" },
                    { key: "employee_id", label: "Employee ID" },
                    { key: "employee_name", label: "Employee Name" },
                ]}
                data={tableData.data}
                meta={{
                    from: tableData.from,
                    to: tableData.to,
                    total: tableData.total,
                    links: tableData.links,
                    currentPage: tableData.current_page,
                    lastPage: tableData.last_page,
                }}
                routeName={route("stamp.index")}
                filters={tableFilters}
                rowKey="employee_id"
                showExport={false}
            />
        </AuthenticatedLayout>
    );
}
