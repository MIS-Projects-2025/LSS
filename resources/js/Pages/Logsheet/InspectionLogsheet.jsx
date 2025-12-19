import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState, useEffect } from "react";
import { Input, Select, InputNumber, message, Drawer, Button, Form } from "antd";

export default function InspectionLogsheet({
    tableData,
    tableFilters,
    emp_data,
    stampNo,
    customerList,
    packageTypeList
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
     const [manageOpen, setManageOpen] = useState(false);
     const [submitting, setSubmitting] = useState(false);
     const [activeRow, setActiveRow] = useState(null);
    const [cart, setCart] = useState([]);
    const { TextArea } = Input;
    const [manageForm] = Form.useForm();

    // Deduplicate by customer_name
    const uniqueCustomers = Array.from(
        new Map(customerList.map(c => [c.customer_name, c])).values()
    );

    /* ================= DATE / SHIFT ================= */
    const getDateShift = () => {
        const now = new Date();
        const date = now.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const hour = now.getHours();
        const shift = hour >= 7 && hour < 19 ? "A" : "C";
        return `${date} - ${shift}`;
    };

    const [dateShift, setDateShift] = useState(getDateShift());

    /* ================= FORM STATE ================= */
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

    const stationOptions = [
        { value: "IQA", label: "IQA" },
        { value: "OQA", label: "OQA" },
        { value: "Batching", label: "Batching" },
        { value: "Buy-off", label: "Buy-off" },
    ];

    /* ================= AUTO SAMPLE SIZE ================= */
    useEffect(() => {
        const qty = Number(form.lot_quantity);
        let sample = "";

        if (form.station === "IQA") {
            if (qty <= 280) sample = 20;
            else if (qty <= 1200) sample = 80;
            else if (qty <= 3200) sample = 125;
            else if (qty <= 10000) sample = 200;
            else if (qty <= 35000) sample = 315;
            else if (qty <= 150000) sample = 500;
            else if (qty <= 500000) sample = 800;
            else sample = 1250;
        }

        if (form.station === "OQA") {
            if (qty <= 3200) sample = 125;
            else if (qty <= 150000) sample = 500;
            else if (qty <= 500000) sample = 800;
            else sample = 1250;
        }

        setForm((prev) => ({ ...prev, sample_size: sample }));
    }, [form.lot_quantity, form.station]);

    /* ================= ADD TO CART ================= */
const addToCart = async () => {
    if (!form.lot_id || !form.package_type) {
        message.warning("Lot ID and Package Type are required");
        return;
    }

    // Optional: check if already in cart
    const inCart = cart.some(
        (item) =>
            item.lot_id === form.lot_id && item.package_type === form.package_type
    );
    if (inCart) {
        message.error(
            `Item with Lot ID "${form.lot_id}" and Package Type "${form.package_type}" is already in the cart.`
        );
        return;
    }

    // Check database for existing item
    const response = await axios.post(route("inspection-logsheet.check-exists"), {
        lot_id: form.lot_id,
        package_type: form.package_type,
    });

    if (response.data.exists) {
        message.error(
            `Item with Lot ID "${form.lot_id}" and Package Type "${form.package_type}" already exists in database.`
        );
        return;
    }

    // Add to cart if all checks pass
    setCart((prev) => [
        ...prev,
        {
            ...form,
            employee_id: emp_data?.emp_id,
            employee_name: emp_data?.emp_name,
            employee_dept: emp_data?.emp_dept,
            stamp_no: stampNo?.[0]?.stamp_no || "",
            date_shift: dateShift,
        },
    ]);

    message.success("Added to cart");
    setForm({
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
};



    /* ================= REMOVE CART ITEM ================= */
    const removeCartItem = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    /* ================= SAVE ALL ================= */
    const saveAll = () => {
    if (cart.length === 0) {
        message.warning("Cart is empty");
        return;
    }

    router.post(
        route("inspection-logsheet.mass-insert"),
        { items: cart },
        {
            onSuccess: (page) => {
                const warningMessage = page.props.flash?.warning;

                if (warningMessage) {
                    // Display duplicates
                    message.warning(warningMessage);
                } else {
                    message.success("All items saved successfully!");
                }

                setCart([]);
                setIsDrawerOpen(false);
                setDateShift(getDateShift());
            },
            onError: () => {
                message.error("Failed to save items.");
            },
        }
    );
};


    const openManage = (row) => {
        setActiveRow(row);
        manageForm.setFieldsValue({
            employee_id: row.employee_id,
            stamp_no: row.stamp_no,
            date_shift: row.date_shift,
            customer: row.customer,
            station: row.station,
            productline: row.productline,
            lot_id: row.lot_id,
            package_type: row.package_type,
            requirement: row.requirement,
            lot_quantity: row.lot_quantity,
            sample_size: row.sample_size,
            type_of_defect: row.type_of_defect,
            no_of_defect: row.no_of_defect,
            inspection_result: row.inspection_result,
            remarks: row.remarks,
        });
        setManageOpen(true);
    };

     const submitEdit = (values) => {
            // console.log(values);
             setSubmitting(true);
            router.put(route("logsheets.update", activeRow.id), values, {
                onSuccess: () => {
                    message.success("Logsheet item updated successfully!");
                    setManageOpen(false);
                    window.location.reload();
                },
                onError: () => message.error("Failed to update Logsheet item."),
                onFinish: () => setSubmitting(false),
            });
        };

    /* ================= TABLE ================= */
    const tableDataRows = (tableData?.data || []).map((row, index) => ({
        ...row,
        i: index + 1,
        actions: (
            <div className="flex gap-2">
                <button className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={() => openManage(row)}
                >
                    
                    <i className="fa-regular fa-eye mr-1"></i>view
                </button>
                {["superadmin", "admin"].includes(emp_data?.emp_system_role) && (
                    <button
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to remove this Lot ID: ${row.lot_id}?`)) {
                                router.delete(route("logsheet.delete", row.id));
                                message.success("Logsheet item removed successfully.");
                                window.location.reload();
                                
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

            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold text-yellow-500">
                    Logsheet List
                </h1>
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="border border-green-600 text-green-600 px-4 py-2 rounded hover:bg-green-600 hover:text-white"
                >
                    <i className="fa-solid fa-file-circle-check"></i> New Logsheet
                </button>
            </div>

            <DataTable
                columns={[
                    { key: "lot_id", label: "Lot ID" },
                    { key: "package_type", label: "Package" },
                    { key: "lot_quantity", label: "Lot Qty" },
                    { key: "sample_size", label: "Sample Size" },
                    { key: "inspection_result", label: "Result" },
                    { key: "actions", label: "Action" },
                ]}
                data={tableDataRows}
                meta={tableData}
                routeName={route("inspection.logsheet.index")}
                filters={tableFilters}
                rowKey="id"
            />

            {/* ================= DRAWER ================= */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        className="fixed inset-0 bg-black/40"
                        onClick={() => setIsDrawerOpen(false)}
                    ></div>

                    <div className="relative ml-auto w-full max-w-5xl bg-white h-full overflow-y-auto">
                        <div className="p-4 bg-yellow-400 font-semibold flex justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                <i className="fa-solid fa-list-check mr-1"></i> New Monitoring Logsheet
                            </h2>
                            <button onClick={() => setIsDrawerOpen(false)}>✕</button>
                        </div>
                        

                        {/* ================= FORM ================= */}
                        <div className="p-6 grid grid-cols-2 gap-4 text-sm">
                            
                            <div>
        <label className="block mb-1 font-medium text-gray-600">Inspected By</label>
        <Input  className="rounded-md" name="employee_id" value={emp_data?.emp_id || ""}  readOnly />
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
    options={uniqueCustomers.map(c => ({
        value: c.customer_name,   // still just the name
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
</div>
 <div className="p-5 grid grid-cols-1 text-sm">
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
</div>

                            {/* ================= BUTTONS ================= */}
                            <div className="p-6 col-span-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={addToCart}
                                    className="bg-blue-600 text-white px-5 py-2 rounded"
                                >
                                    <i className="fa-solid fa-cart-shopping"></i> Add to Cart
                                </button>
                            </div>
                        

                        {/* ================= CART TABLE ================= */}
                        {cart.length > 0 && (
                            <div className="p-6">
                                <h3 className="font-semibold mb-2">Cart Items</h3>
                                <table className="w-full text-xs border">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border p-2">Inspected By</th>
                                            <th className="border p-2">Date & Shift</th>
                                            <th className="border p-2">Productline</th>
                                             <th className="border p-2">Station</th>
                                            <th className="border p-2">Lot ID</th>
                                            <th className="border p-2">Package Type</th>
                                            <th className="border p-2">Lot Qty</th>
                                            <th className="border p-2">Sample Size</th>
                                            <th className="border p-2">Inspection Result</th>
                                            <th className="border p-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item, i) => (
                                            <tr key={i}>
                                                <td className="border p-2">{item.employee_id}</td>
                                                <td className="border p-2">{item.date_shift}</td>
                                                <td className="border p-2">{item.productline}</td>
                                                <td className="border p-2">{item.station}</td>
                                                <td className="border p-2">{item.lot_id}</td>
                                                <td className="border p-2">{item.package_type}</td>
                                                <td className="border p-2">{item.lot_quantity}</td>
                                                <td className="border p-2">{item.sample_size}</td>
                                                <td className="border p-2">{item.inspection_result}</td>
                                                <td className="border p-2">
                                                    <button
                                                        onClick={() => removeCartItem(i)}
                                                        className="text-red-600"
                                                    >
                                                        remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-4 col-span-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={saveAll}
                                    className="bg-green-600 text-white px-5 py-2 rounded"
                                >
                                    <i className="fa-solid fa-floppy-disk"></i>Save All ({cart.length})
                                </button>
                            </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

           {/* ================= MANAGE DRAWER ================= */}
<Drawer
    open={manageOpen}
    onClose={() => setManageOpen(false)}
    size={1000}
    title={
        <span className="flex items-center gap-2 text-lg font-semibold">
            <i className="fa-solid fa-circle-info"></i>
            Inspection Monitoring Logsheet
        </span>
    }
    styles={{
        header: { backgroundColor: "#facc15" },
        body: { padding: 0 }, // ✅ correct replacement
    }}
>

    <Form
        form={manageForm}
        layout="vertical"
        onFinish={submitEdit}
    >
        {/* ================= Form Sections ================= */}
        <div className="p-6 space-y-6">

            {/* Section 1: Basic Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200">
                <Form.Item
                    name="employee_id"
                    label="Inspected By"
                    rules={[{ required: true }]}
                >
                    <Input className="rounded-md bg-gray-100" readOnly />
                </Form.Item>
                <Form.Item
                    name="stamp_no"
                    label="Stamp No"
                    rules={[{ required: true }]}
                >
                    <Input className="rounded-md bg-gray-100" readOnly />
                </Form.Item>
                <Form.Item
                    name="date_shift"
                    label="Date & Shift"
                    rules={[{ required: true }]}
                >
                    <Input className="rounded-md bg-gray-100" readOnly />
                </Form.Item>
                <Form.Item
                    name="customer"
                    label="Customer"
                    rules={[{ required: true }]}
                >
                    <Input className="rounded-md bg-gray-100" readOnly />
                </Form.Item>
            </div>

            {/* Section 2: Product Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200">
                <Form.Item name="productline" label="Productline" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="package_type" label="Package Type" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="inspection_result" label="Inspection Result" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="station" label="Station" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="lot_id" label="Lot ID" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="requirement" label="Requirement" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="lot_quantity" label="Lot Quantity" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="sample_size" label="Sample Size" rules={[{ required: true }]}>
                    <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
            </div>

            {/* Section 3: Defect Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200">
                <Form.Item name="type_of_defect" label="Type of Defect">
                      <Input className="rounded-md bg-gray-50" readOnly />
                </Form.Item>
                <Form.Item name="no_of_defect" label="Number of Defect">
                    <Input className="rounded-md bg-gray-100" readOnly />
                </Form.Item>
            </div>

            {/* Section 4: Remarks */}
            <div className="p-4 rounded-lg bg-gray-100 shadow-sm border border-gray-200">
                <Form.Item name="remarks" label="Remarks">
                    <TextArea className="rounded-md bg-gray-100" readOnly  rows={4} />
                </Form.Item>
            </div>
        </div>

        {/* ================= Form Actions ================= */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
            {/* <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
                <i className="fa-solid fa-pen-to-square"></i> Update
            </Button> */}
            <Button
                type="default"
                onClick={() => setManageOpen(false)}
                className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-600"
            >
                <i className="fa-solid fa-xmark"></i> Close
            </Button>
        </div>
    </Form>
</Drawer>

        </AuthenticatedLayout>
    );
}
