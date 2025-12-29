"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, DollarSign, Plus, Eye, Search, PenLine, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FUEL_TYPES } from "@/validators/stock";

// Interface matching the API response
interface Stock {
  _id: string;
  fuelType: string;
  quantity: number;
  purchasePricePerLiter: number;
  salePricePerLiter: number;
  purchaseDate: string; // ISO date string
  supplier?: string;
  pump: string;
}

const Stock = () => {
  const router = useRouter();
  const [stockData, setStockData] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("all");

  // Global Price Update State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedFuelToUpdate, setSelectedFuelToUpdate] = useState("");
  const [newSalePrice, setNewSalePrice] = useState("");
  const [updatingPrice, setUpdatingPrice] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stocks");
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
      } else {
        toast.error("Failed to fetch stocks");
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = stockData.filter((item) => {
    const matchesSearch =
      item.fuelType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pump?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = fuelTypeFilter === "all" || item.fuelType === fuelTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const totalPurchases = stockData.length;
  // Approximation for "Today's Purchases" - check if purchaseDate is today
  const todaysPurchases = stockData.filter(item => {
    const today = new Date().toISOString().split('T')[0];
    const purchaseDate = new Date(item.purchaseDate).toISOString().split('T')[0];
    return purchaseDate === today;
  }).length;

  const totalAmount = stockData.reduce((sum, item) => sum + (item.quantity * item.purchasePricePerLiter), 0);

  const handleUpdateGlobalPrice = async () => {
    if (!selectedFuelToUpdate || !newSalePrice) {
      toast.error("Please select a fuel type and enter a new price.");
      return;
    }

    const price = parseFloat(newSalePrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    try {
      setUpdatingPrice(true);
      const res = await fetch("/api/stocks/update-price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuelType: selectedFuelToUpdate,
          newSalePrice: price
        })
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`Updated ${result.modifiedCount} records successfully`);
        setIsUpdateModalOpen(false);
        setNewSalePrice("");
        setSelectedFuelToUpdate("");
        fetchStocks(); // Refresh data to show new prices
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update prices");
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      toast.error("Failed to update prices");
    } finally {
      setUpdatingPrice(false);
    }
  };

  return (
    <div className="p-6 bg-[#f1f5f9] min-h-screen">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-2">
              <Package className="h-6 w-6 text-[#14b8a6]" />
            </div>
            <p className="text-sm text-[#64748b]">Total Stock Entries</p>
            <p className="text-2xl font-bold text-[#020617]">{totalPurchases}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-2">
              <ShoppingCart className="h-6 w-6 text-[#06b6d4]" />
            </div>
            <p className="text-sm text-[#64748b]">Today&apos;s Entries</p>
            <p className="text-2xl font-bold text-[#020617]">{todaysPurchases}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-2">
              <DollarSign className="h-6 w-6 text-[#22c55e]" />
            </div>
            <p className="text-sm text-[#64748b]">Total Stock Value</p>
            <p className="text-2xl font-bold text-[#020617]">Rs. {totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter + Add/Update Buttons */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
            <Input
              type="text"
              placeholder="Search fuel, pump, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64 rounded-md"
            />
          </div>
          <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 rounded-md">
              <SelectValue placeholder="Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {FUEL_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-md px-4 py-2 flex-1 sm:flex-none">
                <PenLine className="h-4 w-4 mr-2" />
                Update Fuel Price
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Global Sale Price</DialogTitle>
                <DialogDescription>
                  Select a fuel type to update its sale price across all stock batches.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelSelect">Fuel Type</Label>
                  <Select value={selectedFuelToUpdate} onValueChange={setSelectedFuelToUpdate}>
                    <SelectTrigger id="fuelSelect">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPrice">New Sale Price (Per Liter)</Label>
                  <Input
                    id="newPrice"
                    type="number"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    placeholder="e.g. 285"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleUpdateGlobalPrice}
                  className="bg-[#14b8a6] hover:bg-[#0d9488]"
                  disabled={updatingPrice}
                >
                  {updatingPrice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Prices
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => router.push("/admin/stock/add")}
            className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-md px-4 py-2 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stock Purchase
          </Button>
        </div>
      </div>

      {/* Stock Table */}
      <Card className="bg-white border shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-[#64748b] font-semibold">Fuel Type</TableHead>
                <TableHead className="text-[#64748b] font-semibold">Pump</TableHead>
                <TableHead className="text-[#64748b] font-semibold text-right">Qty (L)</TableHead>
                <TableHead className="text-[#64748b] font-semibold text-right">Purchase (Unit)</TableHead>
                <TableHead className="text-[#64748b] font-semibold text-right">Sale (Unit)</TableHead>
                <TableHead className="text-[#64748b] font-semibold text-right text-green-600">Total Purchase</TableHead>
                <TableHead className="text-[#64748b] font-semibold">Date</TableHead>
                <TableHead className="text-[#64748b] font-semibold text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[#64748b]">
                    No stock purchases found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item._id} className="hover:bg-gray-100 transition-colors">
                    <TableCell className="font-medium text-[#020617]">{item.fuelType}</TableCell>
                    <TableCell className="text-[#64748b]">{item.pump}</TableCell>
                    <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">Rs. {item.purchasePricePerLiter}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">Rs. {item.salePricePerLiter}</TableCell>
                    <TableCell className="text-right font-medium text-green-700">
                      Rs. {(item.quantity * item.purchasePricePerLiter).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-[#64748b]">
                      {new Date(item.purchaseDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/stock/${item._id}/view`)}
                        className="rounded-md"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Stock;
