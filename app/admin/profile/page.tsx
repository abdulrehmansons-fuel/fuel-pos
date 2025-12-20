"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Edit2, Check, X } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { toast } from "sonner";

export default function AdminProfilePage() {
    const router = useRouter();
    const { user: authUser, isLoading: authLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    if (authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#f1f5f9]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="p-6 text-center">
                <p>Please log in to view your profile.</p>
                <Button onClick={() => router.push("/")} className="mt-4">Go to Login</Button>
            </div>
        );
    }

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsUpdating(true);
        try {
            const res = await fetch("/api/auth/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Password updated successfully");
                setIsEditing(false);
                setNewPassword("");
            } else {
                toast.error(data.error || "Failed to update password");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            {/* Back Button */}
            <div className="flex justify-between items-start md:items-center">
                <Button variant="outline" className="rounded-xl" onClick={() => router.push("/admin/dashboard")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#020617]">Profile</h1>
                    <p className="text-[#64748b]">
                        Manage your account information
                    </p>
                </div>
            </div>

            {/* Profile Header */}
            <Card className="border-none shadow-sm rounded-xl">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-4 border-[#14b8a6]/10">
                            <AvatarFallback className="bg-[#14b8a6] text-white text-2xl">
                                {authUser.fullName?.split(' ').map((n: string) => n[0]).join('') || 'AD'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-semibold text-[#020617]">{authUser.fullName}</h2>
                            <p className="text-[#64748b] capitalize">{authUser.role}</p>
                            <p className="text-sm text-[#94a3b8]">Username: {authUser.username}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#020617]">
                        <User className="h-5 w-5 text-[#14b8a6]" />
                        Account Information
                    </CardTitle>
                    {!isEditing ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#14b8a6] hover:text-[#0d9488] hover:bg-teal-50"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#64748b] hover:bg-slate-100"
                                onClick={() => {
                                    setIsEditing(false);
                                    setNewPassword("");
                                }}
                                disabled={isUpdating}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="bg-[#14b8a6] hover:bg-[#0d9488] text-white"
                                onClick={handleUpdatePassword}
                                disabled={isUpdating || !newPassword}
                            >
                                {isUpdating ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={authUser.fullName}
                                disabled
                                className="bg-slate-50 border-slate-100 text-slate-500 rounded-xl cursor-not-allowed"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Mail className="h-4 w-4 text-slate-400" />
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={authUser.email}
                                disabled
                                className="bg-slate-50 border-slate-100 text-slate-500 rounded-xl cursor-not-allowed"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Lock className="h-4 w-4 text-slate-400" />
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={isEditing ? newPassword : "••••••••••••"}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={isEditing ? "Enter new password" : ""}
                                    disabled={!isEditing || isUpdating}
                                    className={`rounded-xl pr-10 focus-visible:ring-[#14b8a6] ${!isEditing ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed' : 'border-slate-200'}`}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {isEditing && (
                                <p className="text-[11px] text-[#64748b] ml-1">
                                    Min 6 characters. Leave blank or cancel to keep current password.
                                </p>
                            )}
                        </div>

                        {/* Role */}
                        <div className="space-y-2 pb-2">
                            <Label htmlFor="role" className="text-sm font-medium text-slate-700">Role</Label>
                            <Input
                                id="role"
                                type="text"
                                value={authUser.role}
                                disabled
                                className="bg-slate-50 border-slate-100 text-slate-500 rounded-xl capitalize cursor-not-allowed"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
