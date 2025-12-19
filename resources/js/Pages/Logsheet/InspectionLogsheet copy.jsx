import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import { Input, Select, InputNumber, Drawer, Button, Form, message } from "antd";

export default function InspectionLogsheet({ tableData, tableFilters, emp_data, stampNo, customerList, packageTypeList }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [cart, setCart] = useState([]);

    const { TextArea } = Input;

    const getDateShift = () => {
        const now = new Date();
        const date = now.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const shift = (hour > 6 && (hour < 19 || (hour === 18 && minutes <= 59))) ? "A" : "C";
        return `${date} - ${shift}`;
    };

    const [dateShift, setDateShift] = useState(getDateShift());

    const [form, setForm] = useState({
        customer: "",
        station: "",
        productline: "",
        lot_id: "",
        package_type: "",
        requirement: "",
        lot_quantity: "",
        sample_size: "",
        type_of_defect: "",
        no_of_defect: "",
        inspection_result: "",
        remarks: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const stationOptions = [
        { value: "IQA", label: "IQA" },
        { value: "OQA", label: "OQA" },
        { value: "Batching", label: "Batching" },
        { value: "Buy-off", label: "Buy-off" },
    ];

    // Auto-calculate sample_size
    useEffect(() => {
        const qty = Number(form.lot_quantity);
        let sample = "";

        if (form.station === "IQA") {
            if (qty >= 1 && qty <= 280) sample = 20;
            else if (qty <= 1200) sample = 80;
            else if (qty <= 3200) sample = 125;
            else if (qty <= 10000) sample = 200;
            else if (qty <= 35000) sample = 315;
            else if (qty <= 150000) sample = 500;
            else if (qty <= 500000) sample = 800;
            else if (qty > 500000) sample = 1250;
        } else if (form.station === "OQA") {
            if (qty >= 1 && qty <= 3200) sample = 125;
            else if (qty <= 150000) sample = 500;
            else if (qty <= 500000) sample = 800;
            else if (qty > 500000) sample = 1250;
        }

        setForm((prev) => ({ ...prev, sample_size: sample }));
    }, [form.lot_quantity, form.station]);

    const submit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            employee_id: emp_data?.emp_id,
            employee_name: emp_data?.emp_name,
            employee_dept: emp_data?.emp_dept,
            date_shift: dateShift,
            stamp_no: stampNo?.[0]?.stamp_no || "",
        };

        router.post(route("inspection-logsheet.add"), payload, {
            onSuccess: () => {
                message.success("New monitoring item added successfully!");
                setIsDrawerOpen(false);
                window.location.reload();
                setForm({
                    employee_id: emp_data?.emp_id,
                    stamp_no: stampNo?.[0]?.stamp_no || "",
                    date_shift: dateShift,
                    customer: "",
                    productline: "",
                    package_type: "",
                    station: "",
                    inspection_result: "",
                    lot_id: "",
                    requirement: "",
                    lot_quantity: "",
                    sample_size: "",
                    type_of_defect: "",
                    no_of_defect: "",
                    remarks: "",
                });
                setDateShift(getDateShift());
            },
        });
    };

    const tableDataRows = (tableData?.data || []).map((row, index) => ({
        ...row,
        i: index + 1,
        actions: (
            <div className="flex gap-2">
                <button className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    <i className="fa-regular fa-eye mr-1"></i>view
                </button>
                {["superadmin", "admin"].includes(emp_data?.emp_system_role) && (
                    <button
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to remove this Lot ID: ${row.lot_id}?`)) {
                                router.delete(route("logsheet.delete", row.id));
                            }
                        }}
                    >
                        <i className="fa-solid fa-trash-can mr-1"></i>trash
                    </button>
                )}
            </div>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Manage Logsheet" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-yellow-500">
                    <i className="fa-solid fa-users-gear mr-2"></i> Logsheet List
                </h1>
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-green-600 border border-green-600 px-4 py-2 rounded hover:bg-green-600 hover:text-white"
                >
                    <i className="fa-solid fa-list-check mr-1"></i> New Logsheet
                </button>
            </div>

            <DataTable
                columns={[
                    { key: "lot_id", label: "Lot ID" },
                    { key: "package_type", label: "Package Type" },
                    { key: "requirement", label: "Requirement" },
                    { key: "lot_quantity", label: "Lot Quantity" },
                    { key: "sample_size", label: "Sample Size" },
                    { key: "inspection_result", label: "Inspection Result" },
                    { key: "employee_id", label: "Inspected By" },
                    { key: "actions", label: "Actions" },
                ]}
                data={tableDataRows}
                meta={{
                    from: tableData.from,
                    to: tableData.to,
                    total: tableData.total,
                    links: tableData.links,
                    currentPage: tableData.current_page,
                    lastPage: tableData.last_page,
                }}
                routeName={route("inspection.logsheet.index")}
                filters={tableFilters}
                rowKey="id"
            />

            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)}></div>

                    {/* WIDER DRAWER */}
                    <div className="relative ml-auto w-full max-w-4xl h-full bg-white shadow-xl overflow-y-auto">
                        <div className="p-5 flex justify-between items-center bg-yellow-400">
                            <h2 className="text-lg font-semibold text-gray-800">
                                <i className="fa-solid fa-list-check mr-1"></i> New Inspection Logsheet
                            </h2>
                            <button onClick={() => setIsDrawerOpen(false)}>
                                <i className="fa-solid fa-xmark text-red-600 hover:text-red-800"></i>
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 grid grid-cols-2 gap-4 text-sm">

    {/* Auto-filled / ReadOnly */}
    <div>
        <label className="block mb-1 font-medium text-gray-600">Inspected By</label>
        <Input className="rounded-md" name="employee_id" value={emp_data?.emp_id || ""} readOnly />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Stamp No</label>
        <Input className="rounded-md" name="stamp_no" value={stampNo?.[0]?.stamp_no || "Unregistered badge number"} readOnly />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Date / Shift</label>
        <Input className="rounded-md" name="date_shift" value={dateShift} readOnly />
    </div>

    {/* Dropdowns */}
    <div>
        <label className="block mb-1 font-medium text-gray-600">Customer</label>
        <Select
       size="large"
        className="w-full border border-gray-600"
    showSearch
    placeholder="Select Customer"
    name="customer"
    value={form.customer || undefined}
    onChange={(value) => setForm({ ...form, customer: value })}
    options={customerList?.map(c => ({
        value: c.id,                 // ✅ unique
        label: c.customer_name,
    }))}
    filterOption={(input, option) =>
        option.label.toLowerCase().includes(input.toLowerCase())
    }
/>

    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Production Line</label>
        <Select
        size="large"
        className="w-full border border-gray-600"
            placeholder="Select Production Line"
            name="productline"
            value={form.productline || undefined}
            onChange={(value) => setForm({ ...form, productline: value })}
            options={[
                { value: "PL1", label: "PL1" },
                { value: "PL6", label: "PL6" },
            ]}
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Package Type</label>
        <Select
        size="large"
        className="w-full border border-gray-600"
            showSearch
            placeholder="Select Package Type"
            name="package_type"
            value={form.package_type || undefined}
            onChange={(value) => setForm({ ...form, package_type: value })}
            options={packageTypeList?.map(p => ({
                value: p.package_type,
                label: p.package_type,
            }))}
            filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
            }
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Inspection Result</label>
        <Select
        size="large"
        className="w-full border border-gray-600"
            placeholder="Select Result"
            name="inspection_result"
            value={form.inspection_result || undefined}
            onChange={(value) => setForm({ ...form, inspection_result: value })}
            options={[
                { value: "PASSED", label: "PASSED" },
                { value: "FAILED", label: "FAILED" },
            ]}
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Station</label>
        <Select
        size="large"
        className="w-full border border-gray-600"
            placeholder="Select Station"
            name="station"
            value={form.station || undefined}
            onChange={(value) => setForm({ ...form, station: value })}
            options={stationOptions}
        />
    </div>

    {/* Inputs */}
    <div>
        <label className="block mb-1 font-medium text-gray-600">Lot ID</label>
        <Input
        className="rounded-md"
            name="lot_id"
            value={form.lot_id}
            onChange={(e) => setForm({ ...form, lot_id: e.target.value })}
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Requirement</label>
        <Select
        size="large"
        className="w-full border border-gray-600"
            placeholder="Select Requirement"
            name="requirement"
            value={form.requirement || undefined}
            onChange={(value) => setForm({ ...form, requirement: value })}
            options={[
                { value: "Automotive", label: "Automotive" },
                { value: "Non-Automotive", label: "Non-Automotive" },
            ]}
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Lot Quantity</label>
        <InputNumber
            size="large"
        className="w-full border border-gray-600"
            min={0}
            name="lot_quantity"
            value={form.lot_quantity}
            onChange={(value) =>
                setForm({ ...form, lot_quantity: value })
            }
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Sample Size</label>
        <InputNumber
            size="large"
        className="w-full border border-gray-600"
            name="sample_size"
            value={form.sample_size}
            readOnly
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">Type of Defect</label>
        <Select
        size="large"
        className="w-full border border-gray-600"
            placeholder="Select Defect Type"
            name="type_of_defect"
            value={form.type_of_defect || undefined}
            onChange={(value) => setForm({ ...form, type_of_defect: value })}
            options={[
                { value: "BL-Bent Leads", label: "BL-Bent Leads" },
                { value: "LC - Lead Copla", label: "LC - Lead Copla" },
                { value: "MP - Marking Problem", label: "MP - Marking Problem" },
                { value: "CR - Crack", label: "CR - Crack" },
                { value: "CO - Chip Out", label: "CO - Chip Out" },
                { value: "WO - Wrong Orientation", label: "WO - Wrong Orientation" },
                { value: "SP - Sealing Problem", label: "SP - Sealing Problem" },
                { value: "QD - Quality Discrepancy", label: "QD - Quality Discrepancy" },
            ]}
        />
    </div>

    <div>
        <label className="block mb-1 font-medium text-gray-600">No. of Defect</label>
        <Input
        className="rounded-md"
            name="no_of_defect"
            value={form.no_of_defect}
            onChange={(e) => setForm({ ...form, no_of_defect: e.target.value })}
        />
    </div>

    <div className="col-span-2">
        <label className="block mb-1 font-medium text-gray-600">Remarks</label>
        <TextArea
        size="large"
        className="w-full border border-gray-600"
            rows={3}
            name="remarks"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
        />
    </div>

    <div className="col-span-2 flex gap-2 pt-4 justify-end">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
            <i className="fa-regular fa-floppy-disk mr-1"></i>Save
        </button>
        <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="bg-red-600 text-white px-6 py-2 rounded"
        >
            <i className="fa-regular fa-x mr-1"></i>Cancel
        </button>
    </div>
</form>

                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
