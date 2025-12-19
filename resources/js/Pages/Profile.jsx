import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";

export default function Profile({ profile, errors }) {
    const { props } = usePage();
    const successMessage = props.flash?.success;

    const [password, setPassword] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    const [passwordForm, setPasswordForm] = useState(false);

    const handleChangePassword = () => {
        router.post(route("changePassword"), password, {
            preserveScroll: true,
            onSuccess: () => {
                const token = localStorage.getItem("authify-token");
                localStorage.removeItem("authify-token");
                router.get(route("logout"));
                window.location.href = `http://192.168.2.221/authify/public/logout?token=${encodeURIComponent(
                    token
                )}&redirect=${encodeURIComponent(route("dashboard"))}`;
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Profile" />

            <div className="max-w-5xl mx-auto p-6 space-y-8">
                {/* ================= HEADER ================= */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 text-white shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold shadow-inner">
                            {profile?.EMPNAME?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-wide">
                                {profile?.EMPNAME}
                            </h1>
                            <p className="text-white/80">
                                {profile?.JOB_TITLE} • {profile?.DEPARTMENT}
                            </p>
                        </div>
                    </div>

                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                {/* ================= PROFILE INFO ================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard label="Production Line" value={profile?.PRODLINE} />
                    <InfoCard label="Station" value={profile?.STATION} />
                    <InfoCard label="Email Address" value={profile?.EMAIL} />
                </div>

                {/* ================= SECURITY ================= */}
                <div className="rounded-3xl bg-white shadow-xl border p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            🔐 Security
                        </h2>
                        <button
                            onClick={() => setPasswordForm(!passwordForm)}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                                passwordForm
                                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    : "bg-yellow-500 text-white hover:bg-amber-600"
                            }`}
                        >
                            {passwordForm ? "Cancel" : "Change Password"}
                        </button>
                    </div>

                    {!passwordForm && (
                        <div className="text-gray-500 text-sm">
                            Your password is securely encrypted.
                        </div>
                    )}

                    {passwordForm && (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-300 text-sm text-yellow-800">
                                ⚠ Changing your password will log you out of all
                                systems using Authify.
                            </div>

                            <PasswordInput
                                label="Current Password"
                                value={password.current_password}
                                onChange={v =>
                                    setPassword({
                                        ...password,
                                        current_password: v,
                                    })
                                }
                                error={errors.current_password}
                            />

                            <PasswordInput
                                label="New Password"
                                value={password.new_password}
                                onChange={v =>
                                    setPassword({
                                        ...password,
                                        new_password: v,
                                    })
                                }
                                error={errors.new_password}
                            />

                            <PasswordInput
                                label="Confirm New Password"
                                value={password.new_password_confirmation}
                                onChange={v =>
                                    setPassword({
                                        ...password,
                                        new_password_confirmation: v,
                                    })
                                }
                                error={errors.new_password_confirmation}
                            />

                            <button
                                onClick={handleChangePassword}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-yellow-500 text-white font-bold shadow-lg hover:scale-[1.01] transition"
                            >
                                <i className="fa-solid fa-key"></i> Update Password
                            </button>

                            {successMessage && (
                                <div className="p-3 rounded-xl bg-green-100 text-green-800 font-semibold">
                                    ✅ {successMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/* ================= COMPONENTS ================= */

function InfoCard({ label, value }) {
    return (
        <div className="rounded-2xl bg-white shadow-lg border p-5 hover:shadow-xl transition">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-1 text-lg font-bold text-gray-800">{value}</p>
        </div>
    );
}

function PasswordInput({ label, value, onChange, error }) {
    return (
        <div>
            <InputLabel value={label} />
            <TextInput
                type="password"
                value={value}
                className="block w-full mt-1 rounded-xl"
                onChange={e => onChange(e.target.value)}
            />
            <InputError message={error} className="mt-1" />
        </div>
    );
}
