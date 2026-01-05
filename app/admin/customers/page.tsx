
import { getCustomers, deleteCustomer } from "@/app/actions/customers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CustomersPage() {
    const customers = await getCustomers();

    return (
        <div className="p-6 bg-[#f1f5f9] min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Customer Credit Management</h1>
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No.</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Balance Due</TableHead>
                            <TableHead className="text-right">Last Updated</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer: any, index: number) => (
                            <TableRow key={customer._id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell className={`text-right font-bold ${customer.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                    Rs. {customer.balance.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">{new Date(customer.updatedAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-center">
                                    <Link href={`/admin/customers/${customer._id}`}>
                                        <Button variant="outline" size="sm">View & Pay</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
