import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import { useState } from "react";
import { Drawer, Button, Form, Input, Select, message, Popconfirm } from "antd";

export default function PackageType({
    tableData,
    tableFilters,
    packageTypes,
    leadCounts,
}) {

    /* ================= STATES ================= */
    const [createOpen, setCreateOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [mode, setMode] = useState("view"); // view | edit
    const [activeRow, setActiveRow] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [createForm] = Form.useForm();
    const [manageForm] = Form.useForm();

    /* ================= HELPERS ================= */
    const buildPackageType = (form) => {
        const name = form.getFieldValue("package_name");
        const lead = form.getFieldValue("lead_count");
        form.setFieldValue(
            "package_type",
            name && lead ? `${lead}L ${name}` : ""
        );
    };

    /* ================= CREATE ================= */
    const openCreate = () => {
        createForm.resetFields();
        setCreateOpen(true);
    };

    const submitCreate = (values) => {
        setSubmitting(true);
        router.post(route("package-type.store"), values, {
            onSuccess: () => {
                message.success("Package created successfully!");
                setCreateOpen(false);
            },
            onError: () => message.error("Failed to create package."),
            onFinish: () => setSubmitting(false),
        });
    };

    /* ================= VIEW / EDIT ================= */
    const openManage = (row) => {
        setActiveRow(row);
        setMode("view");
        manageForm.setFieldsValue({
            package_name: row.package_name,
            lead_count: row.lead_count,
            package_type: row.package_type,
        });
        setManageOpen(true);
    };

    const submitEdit = (values) => {
        setSubmitting(true);
        router.put(route("package-type.update", activeRow.id), values, {
            onSuccess: () => {
                message.success("Package updated successfully!");
                setManageOpen(false);
            },
            onError: () => message.error("Failed to update package."),
            onFinish: () => setSubmitting(false),
        });
    };

    const tableDataRows = (tableData?.data || []).map((row, index) => ({
  ...row,
  i: index + 1,

 actions: (
  <div className="flex gap-2">
    {/* View Button */}
    <button
  className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
  onClick={() => {
    setActiveRow(row);
    setManageOpen(true);

    // Populate the form with the selected row
    manageForm.setFieldsValue({
      package_name: row.package_name,
      lead_count: row.lead_count,
      package_type: row.package_type,
    });
  }}
>

      <div className="flex items-center">
        <i className="fa-solid fa-pen-to-square mr-1"></i>edit
      </div>
    </button>

    {/* Delete Button */}
    <button
      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      onClick={() => {
        if (confirm("Are you sure you want to mark this as Deleted?")) {
          router.delete(route("package-type.delete", row.id), // <-- use row.id
            {
              onSuccess: () => {
                message.success("Package deleted successfully!");
                window.location.reload();
              },
              onError: () => alert("❌ Failed to remove this activity...!"),
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
)

}));

    return (
        <AuthenticatedLayout>
            <Head title="Manage Package" />

            {/* ================= HEADER ================= */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-yellow-500">
                    <i className="fas fa-microchip mr-2"></i>Package List
                </h1>

                {/* ✅ CREATE BUTTON */}
                <Button
                    color="purple"
                    variant="solid"
                    icon={<i className="fas fa-plus"></i>}
                    onClick={openCreate}
                >
                    New Package
                </Button>
            </div>

            {/* ================= DATA TABLE ================= */}
            <DataTable
    columns={[
        { key: "package_name", label: "Package Name" },
        { key: "package_type", label: "Package Type" },
        { key: "created_by_emp_name", label: "Created By" },
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
                routeName={route("package-type.index")}
                filters={tableFilters}
                rowKey="id"
                showExport={false}
/>


            {/* ================================================= */}
            {/* ================= CREATE DRAWER ================= */}
            {/* ================================================= */}
            <Drawer
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                size="default"
                title={
                    <span>
                        <i className="fas fa-microchip mr-2"></i>Create Package
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
    name="package_name"
    label="Package Name"
    rules={[{ required: true }]}
>
    <Select
        showSearch
        placeholder="Select or type to search"
        optionFilterProp="children"
        onChange={() => buildPackageType(createForm)}
        filterOption={(input, option) =>
            (option?.children ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
        }
    >
        {packageTypes.map((p) => (
            <Select.Option key={p} value={p}>
                {p}
            </Select.Option>
        ))}
    </Select>
</Form.Item>

<Form.Item
    name="lead_count"
    label="Lead Count"
    rules={[{ required: true }]}
>
    <Select
        showSearch
        placeholder="Select or type to search"
        optionFilterProp="children"
        onChange={() => buildPackageType(createForm)}
        filterOption={(input, option) =>
            (option?.children ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
        }
    >
        {leadCounts.map((l) => (
            <Select.Option key={l} value={l}>
                {l}
            </Select.Option>
        ))}
    </Select>
</Form.Item>


                    <Form.Item
                        name="package_type"
                        label="Package Type"
                        rules={[{ required: true }]}
                    >
                        <Input readOnly />
                    </Form.Item>

                    <div className="flex justify-end gap-2">
                        <Button
                            color="blue"
                            variant="solid"
                            htmlType="submit"
                            loading={submitting}
                        >
                            <i className="fa-solid fa-paper-plane"></i>Submit
                        </Button>
                        <Button color="red" variant="solid" onClick={() => setCreateOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                            Close
                        </Button>
                    </div>
                </Form>
            </Drawer>

            {/* ================================================= */}
            {/* ================= MANAGE DRAWER ================= */}
            {/* ================================================= */}
            <Drawer
    open={manageOpen}
    onClose={() => setManageOpen(false)}
    size="default"
    title={
        <div className="flex justify-between items-center">
            <span>
                <i className="fas fa-microchip mr-2"></i>
                {mode === "view" ? "View Package" : "Edit Package"}
            </span>
        </div>
    }
    styles={{ header: { backgroundColor: "#facc15" } }}
>
    <Form form={manageForm} layout="vertical" onFinish={submitEdit}>
        <Form.Item name="package_name" label="Package Name">
            <Select
                disabled={mode === "view"}
                onChange={() => buildPackageType(manageForm)}
            >
                {packageTypes.map((p) => (
                    <Select.Option key={p} value={p}>
                        {p}
                    </Select.Option>
                ))}
            </Select>
        </Form.Item>

        <Form.Item name="lead_count" label="Lead Count">
            <Select
                disabled={mode === "view"}
                onChange={() => buildPackageType(manageForm)}
            >
                {leadCounts.map((l) => (
                    <Select.Option key={l} value={l}>
                        {l}
                    </Select.Option>
                ))}
            </Select>
        </Form.Item>

        <Form.Item name="package_type" label="Package Type">
            <Input readOnly />
        </Form.Item>

        <div className="flex justify-end gap-2">
            {mode === "view" && (
                <Button color="blue" variant="solid" type="link" onClick={() => setMode("edit")}>
                    <i className="fa-solid fa-pen"></i>Edit
                </Button>
            )}

            {mode === "edit" && (
                <Button color="green" variant="solid" htmlType="submit" loading={submitting}>
                    <i className="fa-solid fa-pen-to-square"></i>Update
                </Button>
            )}

            <Button color="red" variant="solid" onClick={() => setManageOpen(false)}>
                <i className="fa-solid fa-xmark"></i>Close</Button>
        </div>
    </Form>
</Drawer>

        </AuthenticatedLayout>
    );
}
