"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCashTransaction } from "@/app/actions/cash-transactions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteTransactionButtonProps {
    id: string;
}

export function DeleteTransactionButton({ id }: DeleteTransactionButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        try {
            setIsDeleting(true);
            const result = await deleteCashTransaction(id);
            if (result.success) {
                toast.success("Transaction deleted successfully");
                router.push("/admin/cash-flow");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete transaction");
                setIsDeleting(false);
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this transaction record.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
