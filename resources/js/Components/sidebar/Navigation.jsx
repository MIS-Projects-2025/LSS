import Dropdown from "@/Components/sidebar/Dropdown";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { usePage } from "@inertiajs/react";

export default function NavLinks() {
    const { emp_data } = usePage().props;
    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<i className="fa-solid fa-gauge-simple-high"></i>}
            />

            {!["superadmin", "admin"].includes(emp_data?.emp_system_role) && (
            <Dropdown
                label="Logsheet"
                icon={<i className="fa-solid fa-file-circle-check"></i>}
                links={[
                    {
                        href: route("inspection.logsheet.index"),
                        icon: <i className="fa-regular fa-rectangle-list"></i>,
                        label: "Inspection Logsheet",
                    },
                ]}
            />
            )}
            {["superadmin", "admin"].includes(emp_data?.emp_system_role) && (
                <div>
                     <SidebarLink
                        href={route("inspection.logsheet.list")}
                        label="Inspection Logsheet"
                        icon={<i className="fa-solid fa-file-circle-check"></i>}
                    />

                    <SidebarLink
                        href={route("admin")}
                        label="Administrators"
                        icon={<i className="fa-solid fa-users-gear"></i>}
                    />


            <Dropdown
                label="Maintenance"
                icon={<i className="fa-solid fa-screwdriver-wrench"></i>}
                links={[
                    {
                        href: route("stamp.index"),
                        icon: <i className="fa-solid fa-stamp"></i>,
                        label: "QA Stamp List",
                    },
                    {
                        href: route("package-type.index"),
                        icon: <i className="fas fa-microchip"></i>,
                        label: "Package List",
                    },
                ]}
            />
                </div>

                
            )}
        </nav>
    );
}
