import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";
import { Drawer, Button, Form, Input, InputNumber, Select, message, Popconfirm } from "antd";
import { genRoundedArrow } from "antd/es/style/roundedArrow";

export default function StampList({ tableData, tableFilters, emp_data, EmpMasterlist }) {
    /* ================= STATES ================= */
    const [createOpen, setCreateOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [activeRow, setActiveRow] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [createForm] = Form.useForm();
    const [manageForm] = Form.useForm();

    /* ================= HELPERS ================= */
    const openCreate = () => {
        createForm.resetFields();
        setCreateOpen(true);
    };

    const submitCreate = (values) => {
        setSubmitting(true);
        router.post(route("stamp.add"), values, {
            onSuccess: () => {
                message.success("QA Stamp added successfully!");
                setCreateOpen(false);
                window.location.reload();
            },
            onError: () => message.error("Failed to add QA Stamp."),
            onFinish: () => setSubmitting(false),
        });
    };

    const openManage = (row) => {
        setActiveRow(row);
        manageForm.setFieldsValue({
            employee_id: row.employee_id,
            employee_name: row.employee_name,
            stamp_no: row.stamp_no,
        });
        setManageOpen(true);
    };

    const submitEdit = (values) => {
        console.log(values);
         setSubmitting(true);
        router.put(route("stamp.update", activeRow.id), values, {
            onSuccess: () => {
                message.success("QA Stamp updated successfully!");
                setManageOpen(false);
            },
            onError: () => message.error("Failed to update QA Stamp."),
            onFinish: () => setSubmitting(false),
        });
    };

    const tableDataRows = (tableData?.data || []).map((row, index) => ({
        ...row,
        i: index + 1,
        actions: (
            <div className="flex gap-2">
                {/* View / Edit Button */}
                <button
                    className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    onClick={() => openManage(row)}
                >
                    <div className="flex items-center">
                        <i className="fa-solid fa-pen-to-square mr-1"></i>edit
                    </div>
                </button>

                {/* Remove Button */}
                <button
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    onClick={() => {
                        if (
                            confirm(
                                "Are you sure you want to remove this QA Stamp?"
                            )
                        ) {
                            router.delete(
                                route("stamp.delete", row.id),
                                {
                                    onSuccess: () => {
                                        message.success(
                                            "QA Stamp removed successfully!"
                                        );
                                        window.location.reload();
                                    },
                                    onError: () =>
                                        message.error(
                                            "Failed to remove QA Stamp."
                                        ),
                                }
                            );
                        }
                    }}
                >
                    <div className="flex items-center">
                        <i className="fa-solid fa-trash mr-1"></i>trash
                    </div>
                </button>
            </div>
        ),
    }));

    return (
        <AuthenticatedLayout>
            <Head title="QA Stamp List" />

            {/* ================= HEADER ================= */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-yellow-500 animate-pulse">
                    <i className="fa-solid fa-stamp mr-2"></i>QA Stamp List
                </h1>

                <Button
                    color="purple"
                    variant="solid"
                    icon={<i className="fa-solid fa-user-plus"></i>}
                    onClick={openCreate}
                >New QA Stamp
                </Button>
            </div>

            {/* ================= DATA TABLE ================= */}
            <DataTable
                columns={[
                    { key: "stamp_no", label: "Stamp No" },
                    { key: "employee_id", label: "Employee ID" },
                    { key: "employee_name", label: "Employee Name" },
                    { key: "actions", label: "Action" },
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
                routeName={route("stamp.index")}
                filters={tableFilters}
                rowKey="employee_id"
                showExport={false}
            />

            {/* ================= CREATE DRAWER ================= */}
            <Drawer
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                size="default"
                title={
                    <span>
                        <i className="fa-solid fa-user-plus mr-2"></i>New QA
                        Stamp
                    </span>
                    
                }
                styles={{ header: { backgroundColor: "#facc15" } }}
            >
                <Form
    form={createForm}
    layout="vertical"
    onFinish={submitCreate}
>
    <Form.Item
    name="employee_id"
    label="Employee ID"
    rules={[{ required: true }]}
>
    <Select
        showSearch
        placeholder="Select Employee ID"
        onChange={(value) => {
            // Auto-fill Employee Name based on selection
            const selectedEmp = EmpMasterlist.find(
                (emp) => emp.EMPLOYID === value
            );
            createForm.setFieldsValue({
                employee_name: selectedEmp ? selectedEmp.EMPNAME : "",
            });
        }}
        options={EmpMasterlist.map((emp) => ({
            label: emp.EMPLOYID, // what is displayed in dropdown
            value: emp.EMPLOYID, // the actual value
        }))}
        filterOption={(input, option) =>
            option?.label.toLowerCase().includes(input.toLowerCase())
        } // still works for searching
    />
</Form.Item>


    <Form.Item
        name="employee_name"
        label="Employee Name"
        rules={[{ required: true }]}
    >
        <Input className="rounded-md" placeholder="Employee Name" disabled />
    </Form.Item>

    <Form.Item
        name="stamp_no"
        label="Stamp No"
        rules={[{ required: true }]}
    >
        <InputNumber className="rounded-md w-full" placeholder="Enter Stamp No" min={0} />
    </Form.Item>

    <div className="flex justify-end gap-2">
        <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
        >
            <i className="fa-solid fa-paper-plane"></i> Submit
        </Button>
        <Button
            color="red"
            variant="solid"
            onClick={() => setCreateOpen(false)}
        >
            <i className="fa-solid fa-xmark"></i> Close
        </Button>
    </div>
</Form>

            </Drawer>

            {/* ================= MANAGE DRAWER ================= */}
            <Drawer
                open={manageOpen}
                onClose={() => setManageOpen(false)}
                size="default"
                title={
                    <span>
                        <i className="fa-solid fa-user-pen mr-2"></i>Manage QA
                        Stamp
                    </span>
                }
                styles={{ header: { backgroundColor: "#facc15" } }}
            >
                <Form
                    form={manageForm}
                    layout="vertical"
                    onFinish={submitEdit}
                >
                    <Form.Item
                        name="employee_id"
                        label="Employee ID"
                        rules={[{ required: true }]}
                    >
                        <Input readOnly />
                    </Form.Item>

                    <Form.Item
                        name="employee_name"
                        label="Employee Name"
                        rules={[{ required: true }]}
                    >
                        <Input readOnly />
                    </Form.Item>

                    <Form.Item name="stamp_no" label="Stamp No" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                        >
                            <i className="fa-solid fa-pen-to-square"></i> Update
                        </Button>
                        <Button
                            color="red"
                            variant="solid"
                            onClick={() => setManageOpen(false)}
                        >
                            <i className="fa-solid fa-xmark"></i> Close
                        </Button>
                    </div>
                </Form>
            </Drawer>
        </AuthenticatedLayout>
    );
}
